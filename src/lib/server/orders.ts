import "server-only";
import { randomInt } from "node:crypto";
import { availability } from "../availability";
import { TIME_ZONE } from "../config";
import { canTransition, type Fulfillment, type OrderStatus } from "../order-status";
import { boxBasePrice, boxPrice, MAX_BOXES_PER_LINE, unitsRange } from "../pricing";
import { toWhatsappNumber } from "../whatsapp";
import { audit, SYSTEM_ACTOR, type Actor } from "./audit";
import { sql, type Db, type Tx } from "./db";
import { enqueueOrderEmail } from "./notifications";
import { normalizeCode, qualifyReferral, REFUND_REVOCATION, revokeReferralForOrder } from "./referrals";
import { loadSettings } from "./settings";

export class OrderError extends Error {}

const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Référence aléatoire (demandes d'événement). */
export function newReference(prefix = "EVT") {
  let ref = "";
  for (let i = 0; i < 6; i++) ref += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return `${prefix}-${ref}`;
}

/**
 * Numéro de commande KA-26-0001, KA-26-0002… : compteur par année (heure de Dakar),
 * incrémenté dans la transaction de la commande, donc sans doublon ni trou en cas d'échec.
 */
export async function nextOrderReference(tx: Tx) {
  const year = Number(new Intl.DateTimeFormat("en", { year: "2-digit", timeZone: TIME_ZONE }).format(new Date()));
  const [row] = await tx<{ last_value: number }[]>`
    insert into order_counters (year, last_value) values (${year}, 1)
    on conflict (year) do update set last_value = order_counters.last_value + 1
    returning last_value`;
  return `KA-${String(year).padStart(2, "0")}-${String(row.last_value).padStart(4, "0")}`;
}

// ---------------------------------------------------------------------------
// Création de commande
// ---------------------------------------------------------------------------

export type CartLineInput = {
  productId: string;
  formatId: string;
  units: number | null;
  boxes: number;
  supplementIds: string[];
};

export type CheckoutInput = {
  items: CartLineInput[];
  fulfillment: Fulfillment;
  name: string;
  phone: string;
  deliveryArea: string | null;
  note: string | null;
  giftMessage: string | null;
  referralCode: string | null;
};

type LockedProduct = {
  id: string;
  name: string;
  status: string;
  stock_quantity: number | null;
  manual_out_of_stock: boolean;
  is_family_box: boolean;
  reward_eligible: boolean;
};

type PricedLine = {
  product: LockedProduct;
  formatLabel: string;
  units: number | null;
  unitLabel: string | null;
  basePrice: number;
  supplements: { id: string; name: string; price: number }[];
  boxPrice: number;
  boxes: number;
  lineTotal: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertIds(ids: (string | null | undefined)[]) {
  if (!ids.every((id) => typeof id === "string" && UUID.test(id))) {
    throw new OrderError("Un article de votre panier n'est plus valide. Retirez-le puis ajoutez-le à nouveau.");
  }
}

/** Verrouille les produits (ordre stable pour éviter les interblocages). */
async function lockProducts(tx: Tx, ids: string[]) {
  assertIds(ids);
  const unique = [...new Set(ids)].sort();
  return tx<LockedProduct[]>`
    select id, name, status, stock_quantity, manual_out_of_stock, is_family_box, reward_eligible
    from products where id = any(${unique}::uuid[]) order by id for update`;
}

/** Recalcule chaque ligne côté serveur à partir du catalogue (aucun prix venant du client). */
async function priceLines(tx: Tx, items: CartLineInput[], products: LockedProduct[]): Promise<PricedLine[]> {
  const lines: PricedLine[] = [];
  for (const item of items) {
    assertIds([item.formatId, ...item.supplementIds]);
    const product = products.find((p) => p.id === item.productId);
    if (!product || product.status !== "published") {
      throw new OrderError("Un produit de votre panier n'est plus proposé. Retirez-le pour continuer.");
    }
    const [format] = await tx<
      { label: string; pricing: "fixed" | "per_unit"; price: number; min_units: number | null; max_units: number | null; unit_label: string }[]
    >`select label, pricing, price, min_units, max_units, unit_label from product_formats
      where id = ${item.formatId} and product_id = ${product.id} and active`;
    if (!format) throw new OrderError(`Le format choisi pour « ${product.name} » n'est plus disponible.`);

    let units: number | null = null;
    if (format.pricing === "per_unit") {
      const range = unitsRange(format);
      units = Number(item.units);
      if (!Number.isInteger(units) || units < range.min || units > range.max) {
        throw new OrderError(`« ${product.name} » : choisissez entre ${range.min} et ${range.max} ${format.unit_label}s par boîte.`);
      }
    }
    const boxes = Number(item.boxes);
    if (!Number.isInteger(boxes) || boxes < 1 || boxes > MAX_BOXES_PER_LINE) {
      throw new OrderError(`« ${product.name} » : le nombre de boîtes doit être compris entre 1 et ${MAX_BOXES_PER_LINE}.`);
    }

    const supplementIds = [...new Set(item.supplementIds)];
    const supplements = supplementIds.length
      ? await tx<{ id: string; name: string; price: number }[]>`
          select s.id, s.name, s.price from supplements s
          join product_supplements ps on ps.supplement_id = s.id and ps.product_id = ${product.id}
          where s.id = any(${supplementIds}::uuid[]) and s.active order by s.sort_order`
      : [];
    if (supplements.length !== supplementIds.length) {
      throw new OrderError(`Un supplément choisi pour « ${product.name} » n'est plus proposé.`);
    }

    const price = boxPrice(format, units, supplements);
    lines.push({
      product,
      formatLabel: format.label,
      units,
      unitLabel: format.pricing === "per_unit" ? format.unit_label : null,
      basePrice: boxBasePrice(format, units),
      supplements,
      boxPrice: price,
      boxes,
      lineTotal: price * boxes,
    });
  }
  return lines;
}

function boxesByProduct(lines: { product: { id: string }; boxes: number }[]) {
  const map = new Map<string, number>();
  for (const line of lines) map.set(line.product.id, (map.get(line.product.id) ?? 0) + line.boxes);
  return map;
}

/**
 * Réserve le stock des produits suivis. La mise à jour conditionnelle
 * (stock >= quantité) sur des lignes verrouillées empêche la survente.
 */
async function reserveStock(tx: Tx, products: LockedProduct[], needed: Map<string, number>, { respectManual = true } = {}) {
  for (const [productId, boxes] of needed) {
    const product = products.find((p) => p.id === productId)!;
    if (respectManual) {
      const a = availability(product);
      if (!a.orderable) {
        throw new OrderError(
          a.reason === "manual"
            ? `« ${product.name} » est en rupture de stock pour le moment.`
            : `« ${product.name} » est épuisé pour le moment.`,
        );
      }
    }
    if (product.stock_quantity === null) continue;
    const updated = await tx`
      update products set stock_quantity = stock_quantity - ${boxes}, updated_at = now()
      where id = ${productId} and stock_quantity is not null and stock_quantity >= ${boxes}
      returning id`;
    if (updated.length === 0) {
      throw new OrderError(
        product.stock_quantity === 0
          ? `« ${product.name} » est épuisé pour le moment.`
          : `Il ne reste que ${product.stock_quantity} boîte(s) de « ${product.name} ».`,
      );
    }
  }
}

async function releaseStock(tx: Db, orderId: string) {
  const rows = await tx<{ product_id: string; boxes: number }[]>`
    select product_id, sum(boxes)::int as boxes from order_items
    where order_id = ${orderId} and product_id is not null group by product_id`;
  for (const row of rows) {
    // Un produit passé entre-temps en « sans limite » (NULL) reste sans limite.
    await tx`
      update products set stock_quantity = stock_quantity + ${row.boxes}, updated_at = now()
      where id = ${row.product_id} and stock_quantity is not null`;
  }
  await tx`update orders set stock_reserved = false where id = ${orderId}`;
}

async function insertItems(tx: Tx, orderId: string, lines: PricedLine[], free = false) {
  let index = 0;
  for (const line of lines) {
    await tx`
      insert into order_items (order_id, product_id, product_name, format_label, units, unit_label,
        box_base_price, supplements, box_price, boxes, line_total, sort_order)
      values (${orderId}, ${line.product.id}, ${line.product.name}, ${line.formatLabel}, ${line.units}, ${line.unitLabel},
        ${free ? 0 : line.basePrice}, ${tx.json(line.supplements.map(({ name, price }) => ({ name, price: free ? 0 : price })))},
        ${free ? 0 : line.boxPrice}, ${line.boxes}, ${free ? 0 : line.lineTotal}, ${index++})`;
  }
}

async function logEvent(tx: Db, orderId: string, from: OrderStatus | null, to: OrderStatus, actor: Actor, note?: string | null) {
  await tx`
    insert into order_events (order_id, from_status, to_status, actor_user_id, actor_label, note)
    values (${orderId}, ${from}, ${to}, ${actor.userId}, ${actor.label}, ${note ?? null})`;
}

function clean(value: string | null | undefined, max: number) {
  const v = (value ?? "").trim().replace(/\s+/g, " ");
  return v ? v.slice(0, max) : null;
}

function cleanMultiline(value: string | null | undefined, max: number) {
  const v = (value ?? "").trim();
  return v ? v.slice(0, max) : null;
}

export async function createOrder(user: { id: string; email: string }, input: CheckoutInput) {
  const name = clean(input.name, 80);
  const phone = clean(input.phone, 30);
  if (!name) throw new OrderError("Indiquez votre nom.");
  if (!phone || toWhatsappNumber(phone).length < 9) throw new OrderError("Indiquez un numéro WhatsApp valide.");
  if (input.fulfillment !== "delivery" && input.fulfillment !== "pickup") throw new OrderError("Choisissez livraison ou retrait.");
  if (!Array.isArray(input.items) || input.items.length === 0) throw new OrderError("Votre panier est vide.");
  if (input.items.length > 20) throw new OrderError("Votre panier contient trop de lignes.");

  await expireStaleOrders();

  return sql.begin(async (tx) => {
    const settings = await loadSettings(tx);
    if (!settings.orders_open) throw new OrderError("Les commandes en ligne sont momentanément fermées.");

    const products = await lockProducts(tx, input.items.map((i) => i.productId));
    const lines = await priceLines(tx, input.items, products);
    const needed = boxesByProduct(lines);

    // Parrainage : code fixé à la commande, jamais son propre code.
    let ambassadorId: string | null = null;
    let referralCode: string | null = null;
    if (input.referralCode && normalizeCode(input.referralCode)) {
      referralCode = normalizeCode(input.referralCode);
      const [amb] = await tx<{ user_id: string; phone: string | null }[]>`
        select a.user_id, u.phone from ambassadors a join users u on u.id = a.user_id
        where a.code = ${referralCode} and a.active`;
      if (!amb) throw new OrderError("Ce code ambassadeur n'existe pas. Vérifiez-le ou laissez le champ vide.");
      const samePhone = amb.phone && toWhatsappNumber(amb.phone) === toWhatsappNumber(phone);
      if (amb.user_id === user.id || samePhone) {
        throw new OrderError("Vous ne pouvez pas utiliser votre propre code ambassadeur.");
      }
      ambassadorId = amb.user_id;
    }

    await reserveStock(tx, products, needed);
    const reserved = [...needed.keys()].some((id) => products.find((p) => p.id === id)!.stock_quantity !== null);
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

    const [order] = await tx<{ id: string; reference: string }[]>`
      insert into orders (reference, user_id, fulfillment, customer_name, customer_phone, customer_email,
        delivery_area, customer_note, gift_message, subtotal, total, ambassador_user_id, referral_code,
        payment_method, stock_reserved, reservation_expires_at)
      values (${await nextOrderReference(tx)}, ${user.id}, ${input.fulfillment}, ${name}, ${phone}, ${user.email},
        ${input.fulfillment === "delivery" ? clean(input.deliveryArea, 120) : null},
        ${cleanMultiline(input.note, 600)}, ${cleanMultiline(input.giftMessage, 300)},
        ${subtotal}, ${subtotal}, ${ambassadorId}, ${ambassadorId ? referralCode : null},
        ${settings.payment.provider}, ${reserved},
        now() + make_interval(mins => ${settings.reservation_minutes}))
      returning id, reference`;
    await insertItems(tx, order.id, lines);
    await logEvent(tx, order.id, null, "awaiting_payment", { userId: user.id, label: "Client" });

    // Coordonnées mémorisées pour les prochaines commandes.
    await tx`
      update users set first_name = coalesce(nullif(first_name, ''), ${name.split(" ")[0]}),
        last_name = coalesce(last_name, ${name.split(" ").slice(1).join(" ") || null}),
        phone = coalesce(nullif(phone, ''), ${phone}), updated_at = now()
      where id = ${user.id}`;
    return order;
  });
}

// ---------------------------------------------------------------------------
// Réservations expirées
// ---------------------------------------------------------------------------

/**
 * Libère le stock des commandes non payées dont la réservation a expiré.
 * Une commande dont le client a déclaré avoir payé n'expire pas : l'équipe
 * vérifie le paiement et décide.
 */
export async function expireStaleOrders() {
  return sql.begin(async (tx) => {
    const stale = await tx<{ id: string; stock_reserved: boolean }[]>`
      select id, stock_reserved from orders
      where status = 'awaiting_payment' and payment_declared_at is null and reservation_expires_at < now()
      order by created_at for update skip locked limit 50`;
    for (const order of stale) {
      if (order.stock_reserved) await releaseStock(tx, order.id);
      await tx`update orders set status = 'expired', updated_at = now() where id = ${order.id}`;
      await logEvent(tx, order.id, "awaiting_payment", "expired", SYSTEM_ACTOR, "Délai de paiement dépassé, stock libéré.");
    }
    return stale.length;
  });
}

// ---------------------------------------------------------------------------
// Actions du client
// ---------------------------------------------------------------------------

type OrderRow = {
  id: string;
  reference: string;
  user_id: string;
  kind: "standard" | "reward";
  status: OrderStatus;
  fulfillment: Fulfillment;
  customer_email: string;
  total: number;
  stock_reserved: boolean;
  payment_declared_at: string | null;
  paid_at: string | null;
  ambassador_user_id: string | null;
  reward_id: string | null;
};

async function lockOrder(tx: Tx, where: { id?: string; reference?: string; userId?: string }) {
  const [order] = await tx<OrderRow[]>`
    select id, reference, user_id, kind, status, fulfillment, customer_email, total, stock_reserved,
           payment_declared_at, paid_at, ambassador_user_id, reward_id
    from orders
    where ${where.id ? tx`id = ${where.id}` : tx`reference = ${where.reference!}`}
      ${where.userId ? tx`and user_id = ${where.userId}` : tx``}
    for update`;
  return order ?? null;
}

/** Le client signale avoir payé. Ce n'est jamais une preuve de paiement. */
export async function declarePayment(userId: string, reference: string) {
  return sql.begin(async (tx) => {
    const order = await lockOrder(tx, { reference, userId });
    if (!order) throw new OrderError("Commande introuvable.");
    if (order.status !== "awaiting_payment") return { changed: false };
    if (order.payment_declared_at) return { changed: false };
    await tx`update orders set payment_declared_at = now(), updated_at = now() where id = ${order.id}`;
    await logEvent(tx, order.id, order.status, order.status, { userId, label: "Client" }, "Le client indique avoir payé (à vérifier).");
    return { changed: true };
  });
}

/** Annulation autonome possible uniquement tant que le paiement n'est ni vérifié ni déclaré. */
export async function cancelByCustomer(userId: string, reference: string) {
  return sql.begin(async (tx) => {
    const order = await lockOrder(tx, { reference, userId });
    if (!order) throw new OrderError("Commande introuvable.");
    if (order.status === "cancelled") return { changed: false };
    if (!["awaiting_payment", "expired"].includes(order.status) || order.payment_declared_at) {
      throw new OrderError("Cette commande ne peut plus être annulée en ligne. Contactez KALIMA sur WhatsApp.");
    }
    if (order.stock_reserved) await releaseStock(tx, order.id);
    await tx`update orders set status = 'cancelled', updated_at = now() where id = ${order.id}`;
    await logEvent(tx, order.id, order.status, "cancelled", { userId, label: "Client" }, "Annulée par le client avant paiement.");
    return { changed: true };
  });
}

// ---------------------------------------------------------------------------
// Actions de l'équipe
// ---------------------------------------------------------------------------

export type TransitionOptions = {
  note?: string | null;
  paidAmount?: number | null;
  paymentReference?: string | null;
  refundedAmount?: number | null;
};

const EMAIL_FOR_STATUS: Partial<Record<OrderStatus, Parameters<typeof enqueueOrderEmail>[2]>> = {
  confirmed: "payment_confirmed",
  in_production: "production_started",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  ready_for_pickup: "ready_for_pickup",
  picked_up: "picked_up",
};

export type TransitionResult = { changed: boolean; notificationId: string | null; message?: string };

/**
 * Change l'état d'une commande. Idempotent : une action répétée (double clic,
 * deux personnes en même temps) ne produit qu'un seul changement, un seul
 * e-mail et un seul parrainage.
 */
export async function transitionOrder(orderId: string, to: OrderStatus, actor: Actor, options: TransitionOptions = {}): Promise<TransitionResult> {
  return sql.begin(async (tx) => {
    const order = await lockOrder(tx, { id: orderId });
    if (!order) throw new OrderError("Commande introuvable.");
    if (order.status === to) return { changed: false, notificationId: null, message: "Déjà fait." };
    if (!canTransition(order.status, to, order.fulfillment)) {
      throw new OrderError("Cette étape n'est pas possible depuis l'état actuel de la commande.");
    }
    const note = clean(options.note, 500);

    if (to === "confirmed") {
      if (order.kind === "standard") {
        const paid = Number(options.paidAmount);
        if (!Number.isInteger(paid) || paid <= 0) throw new OrderError("Indiquez le montant reçu.");
        if (paid !== order.total && !note) {
          throw new OrderError("Le montant reçu diffère du total : ajoutez une note pour l'expliquer.");
        }
        if (!order.stock_reserved) {
          // Réservation expirée entre-temps : le stock doit être encore disponible.
          const items = await tx<{ product_id: string; boxes: number }[]>`
            select product_id, sum(boxes)::int as boxes from order_items
            where order_id = ${order.id} and product_id is not null group by product_id`;
          const products = await lockProducts(tx, items.map((i) => i.product_id));
          try {
            await reserveStock(tx, products, new Map(items.map((i) => [i.product_id, i.boxes])), { respectManual: false });
          } catch (error) {
            if (error instanceof OrderError) {
              throw new OrderError(`${error.message} Ajustez le stock du produit avant de confirmer ce paiement.`);
            }
            throw error;
          }
          await tx`update orders set stock_reserved = ${products.some((p) => p.stock_quantity !== null)} where id = ${order.id}`;
        }
        await tx`
          update orders set paid_at = now(), paid_amount = ${paid}, payment_reference = ${clean(options.paymentReference, 120)},
            payment_confirmed_by = ${actor.userId}
          where id = ${order.id}`;
      } else {
        await tx`update orders set paid_at = now(), paid_amount = 0, payment_confirmed_by = ${actor.userId} where id = ${order.id}`;
      }
    }

    if (to === "cancelled") {
      if (order.paid_at && !note) throw new OrderError("Précisez la raison de l'annulation d'une commande payée.");
      if (order.stock_reserved && ["awaiting_payment", "expired", "reward_requested", "confirmed"].includes(order.status)) {
        await releaseStock(tx, order.id);
      }
      if (order.reward_id) {
        // La récompense redevient disponible : elle n'a pas été utilisée.
        await tx`update orders set reward_id = null where id = ${order.id}`;
        await tx`update rewards set status = 'available', order_id = null, product_id = null, requested_at = null where id = ${order.reward_id}`;
        await audit(tx, actor, "reward.released", "reward", order.reward_id, { order: order.reference });
      }
    }

    if (to === "refunded") {
      if (!order.paid_at || order.kind !== "standard") throw new OrderError("Seule une commande payée peut être remboursée.");
      const refunded = Number(options.refundedAmount);
      if (!Number.isInteger(refunded) || refunded <= 0) throw new OrderError("Indiquez le montant remboursé.");
      if (!note) throw new OrderError("Précisez la raison du remboursement.");
      await tx`update orders set refunded_amount = ${refunded} where id = ${order.id}`;
      await revokeReferralForOrder(tx, order.id, REFUND_REVOCATION, actor);
    }

    await tx`update orders set status = ${to}, updated_at = now() where id = ${order.id}`;
    await logEvent(tx, order.id, order.status, to, actor, note);
    await audit(tx, actor, `order.${to}`, "order", order.id, { reference: order.reference, from: order.status });

    if (to === "delivered" || to === "picked_up") {
      await qualifyReferral(tx, order, actor);
      if (order.reward_id) {
        await tx`update rewards set status = 'delivered', delivered_at = now() where id = ${order.reward_id}`;
      }
    }

    const kind = EMAIL_FOR_STATUS[to];
    const notificationId = kind ? await enqueueOrderEmail(tx, order.id, kind, order.customer_email) : null;
    return { changed: true, notificationId };
  });
}

// ---------------------------------------------------------------------------
// Récompenses ambassadeur
// ---------------------------------------------------------------------------

export type RewardClaimInput = {
  rewardId: string;
  productId: string;
  formatId: string;
  units: number | null;
  fulfillment: Fulfillment;
  name: string;
  phone: string;
  deliveryArea: string | null;
  note: string | null;
};

/**
 * Réclamation d'une box offerte : crée une demande que KALIMA valide.
 * Une récompense ne peut être réclamée qu'une fois (verrou + état).
 */
export async function claimReward(user: { id: string; email: string }, input: RewardClaimInput) {
  const name = clean(input.name, 80);
  const phone = clean(input.phone, 30);
  if (!name) throw new OrderError("Indiquez votre nom.");
  if (!phone || toWhatsappNumber(phone).length < 9) throw new OrderError("Indiquez un numéro WhatsApp valide.");

  return sql.begin(async (tx) => {
    assertIds([input.rewardId, input.formatId]);
    const [reward] = await tx<{ id: string; status: string; tier: number }[]>`
      select id, status, tier from rewards where id = ${input.rewardId} and ambassador_user_id = ${user.id} for update`;
    if (!reward) throw new OrderError("Récompense introuvable.");
    if (reward.status !== "available") throw new OrderError("Cette récompense a déjà été utilisée.");

    const products = await lockProducts(tx, [input.productId]);
    const product = products[0];
    if (!product || product.status !== "published" || !product.reward_eligible || product.is_family_box) {
      throw new OrderError("Cette box ne fait pas partie des récompenses proposées.");
    }
    // Box offerte : une boîte au format minimum, sans supplément.
    const [format] = await tx<{ pricing: string; min_units: number | null }[]>`
      select pricing, min_units from product_formats where id = ${input.formatId} and product_id = ${product.id}`;
    const units = format?.pricing === "per_unit" ? format.min_units : null;
    const lines = await priceLines(tx, [{ ...input, units, boxes: 1, supplementIds: [] }], products);
    await reserveStock(tx, products, boxesByProduct(lines));

    const [order] = await tx<{ id: string; reference: string }[]>`
      insert into orders (reference, user_id, kind, status, fulfillment, customer_name, customer_phone, customer_email,
        delivery_area, customer_note, subtotal, total, payment_method, stock_reserved, reward_id)
      values (${await nextOrderReference(tx)}, ${user.id}, 'reward', 'reward_requested', ${input.fulfillment}, ${name}, ${phone}, ${user.email},
        ${input.fulfillment === "delivery" ? clean(input.deliveryArea, 120) : null}, ${cleanMultiline(input.note, 600)},
        0, 0, 'reward', ${product.stock_quantity !== null}, ${reward.id})
      returning id, reference`;
    await insertItems(tx, order.id, lines, true);
    await tx`update rewards set status = 'requested', product_id = ${product.id}, order_id = ${order.id}, requested_at = now() where id = ${reward.id}`;
    await logEvent(tx, order.id, null, "reward_requested", { userId: user.id, label: "Client" }, `Box offerte (récompense n° ${reward.tier}).`);
    await audit(tx, { userId: user.id, label: "Client" }, "reward.requested", "reward", reward.id, { order: order.reference });
    return order;
  });
}
