import "server-only";
import { appUrl } from "../config";
import { renderOrderEmail, type OrderEmailData, type OrderEmailKind } from "../emails/templates";
import { whatsappUrl } from "../whatsapp";
import { sql, type Db } from "./db";
import { sendEmail } from "./email";
import { loadSettings } from "./settings";

const MAX_AUTO_ATTEMPTS = 5;

export const NOTIFICATION_LABELS: Record<OrderEmailKind, string> = {
  payment_confirmed: "Paiement reçu et commande confirmée",
  production_started: "Confection commencée",
  out_for_delivery: "Commande en route",
  delivered: "Commande livrée",
  ready_for_pickup: "Prête à être retirée",
  picked_up: "Commande remise",
};

/**
 * Ajoute un e-mail à la file, dans la transaction du changement d'état.
 * L'index unique (order_id, kind) garantit un seul envoi initial par événement.
 */
export async function enqueueOrderEmail(tx: Db, orderId: string, kind: OrderEmailKind, recipient: string) {
  const [row] = await tx<{ id: string }[]>`
    insert into notifications (order_id, kind, recipient, subject)
    values (${orderId}, ${kind}, ${recipient}, ${NOTIFICATION_LABELS[kind]})
    on conflict (order_id, kind) where order_id is not null do nothing
    returning id`;
  return row?.id ?? null;
}

async function buildOrderEmailData(orderId: string, settings: Awaited<ReturnType<typeof loadSettings>>): Promise<OrderEmailData | null> {
  const [order] = await sql<
    { reference: string; customer_name: string; fulfillment: "delivery" | "pickup"; kind: "standard" | "reward"; total: number; paid_amount: number | null; gift_message: string | null }[]
  >`select reference, customer_name, fulfillment, kind, total, paid_amount, gift_message from orders where id = ${orderId}`;
  if (!order) return null;
  const items = await sql<OrderEmailData["items"]>`
    select product_name, format_label, units, unit_label, supplements, box_price, boxes, line_total
    from order_items where order_id = ${orderId} order by sort_order`;
  return {
    firstName: order.customer_name.trim().split(/\s+/)[0] || "et merci",
    reference: order.reference,
    trackingUrl: `${appUrl()}/compte/commandes/${order.reference}`,
    fulfillment: order.fulfillment,
    kind: order.kind,
    total: order.total,
    paidAmount: order.paid_amount,
    items,
    pickupArea: settings.pickup.area,
    pickupDetails: settings.pickup.details,
    pickupMapUrl: settings.pickup.map_url,
    giftMessage: order.gift_message,
  };
}

export type DeliveryOutcome = { id: string; status: "sent" | "failed" | "skipped"; error?: string };

/**
 * Envoie une notification. Le passage à « sending » est atomique : deux
 * exécutions simultanées ne peuvent pas envoyer le même e-mail.
 */
export async function deliverNotification(id: string, { manual = false } = {}): Promise<DeliveryOutcome> {
  const [claimed] = await sql<{ id: string; order_id: string | null; kind: string; recipient: string; attempts: number }[]>`
    update notifications set status = 'sending', attempts = attempts + 1, claimed_at = now()
    where id = ${id}
      and (status = 'pending' or (status = 'failed' and (${manual} or (attempts < ${MAX_AUTO_ATTEMPTS} and next_attempt_at <= now()))))
    returning id, order_id, kind, recipient, attempts`;
  if (!claimed) return { id, status: "skipped" };

  let result: Awaited<ReturnType<typeof sendEmail>>;
  try {
    const settings = await loadSettings(sql);
    const data = claimed.order_id ? await buildOrderEmailData(claimed.order_id, settings) : null;
    if (!data) throw new Error("Commande introuvable pour cette notification.");
    const rendered = renderOrderEmail(claimed.kind as OrderEmailKind, data, {
      appUrl: appUrl(),
      contactPhone: settings.contact.phone,
      instagram: settings.contact.instagram,
      whatsappUrl: whatsappUrl(settings.contact.whatsapp_number, `Bonjour KALIMA, je vous écris au sujet de la commande ${data.reference}.`),
    });
    result = await sendEmail({ to: claimed.recipient, toName: data.firstName, ...rendered, tags: [claimed.kind] });
    if (result.ok) {
      await sql`
        update notifications set status = 'sent', sent_at = now(), subject = ${rendered.subject},
          provider = ${result.provider}, provider_message_id = ${result.messageId}, last_error = null
        where id = ${claimed.id}`;
      return { id, status: "sent" };
    }
  } catch (error) {
    result = { ok: false, provider: "interne", error: (error as Error).message };
  }

  // Nouvelle tentative automatique avec un délai croissant (5, 10, 20, 40 min).
  const delayMinutes = 5 * 2 ** Math.max(0, claimed.attempts - 1);
  await sql`
    update notifications set status = 'failed', provider = ${result.provider}, last_error = ${result.error},
      next_attempt_at = now() + make_interval(mins => ${delayMinutes})
    where id = ${claimed.id}`;
  return { id, status: "failed", error: result.error };
}

/** Traite la file : notifications en attente et échecs à relancer. */
export async function processNotificationQueue(limit = 20) {
  // Un envoi interrompu (« sending » depuis plus de 10 min) repasse en échec visible.
  await sql`
    update notifications set status = 'failed', attempts = greatest(attempts, ${MAX_AUTO_ATTEMPTS}),
      last_error = 'Envoi interrompu : vérifiez la réception avant de relancer manuellement.'
    where status = 'sending' and claimed_at < now() - interval '10 minutes'`;
  const due = await sql<{ id: string }[]>`
    select id from notifications
    where status = 'pending' or (status = 'failed' and attempts < ${MAX_AUTO_ATTEMPTS} and next_attempt_at <= now())
    order by created_at limit ${limit}`;
  const outcomes: DeliveryOutcome[] = [];
  for (const row of due) outcomes.push(await deliverNotification(row.id));
  return outcomes;
}

export async function deliverMany(ids: (string | null)[]) {
  for (const id of ids) if (id) await deliverNotification(id);
}
