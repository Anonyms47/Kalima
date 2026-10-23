import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { availability } from "@/lib/availability";
import { boxPrice, lineTotal } from "@/lib/pricing";
import { sql } from "@/lib/server/db";
import { cancelByCustomer, createOrder, declarePayment, expireStaleOrders, OrderError, transitionOrder } from "@/lib/server/orders";
import { baseCheckout, makeStaff, makeUser, product, setStock } from "./helpers";

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await setStock("gaufres", null);
  await setStock("mini-pancakes", null);
});

describe("prix", () => {
  it("calcule une boîte de gaufres à l'unité avec suppléments, puis multiplie par le nombre de boîtes", () => {
    const format = { pricing: "per_unit" as const, price: 500, min_units: 2, max_units: null };
    const supplements = [{ name: "Chantilly", price: 500 }, { name: "Banane", price: 500 }];
    expect(boxPrice(format, 3, supplements)).toBe(2500);
    expect(lineTotal(format, 3, supplements, 2)).toBe(5000);
  });

  it("calcule une boîte de mini pancakes à prix fixe", () => {
    const format = { pricing: "fixed" as const, price: 3000, min_units: null, max_units: null };
    expect(lineTotal(format, null, [{ name: "Spéculoos", price: 500 }], 3)).toBe(10500);
  });

  it("recalcule le total côté serveur et fige les prix dans la commande", async () => {
    const user = await makeUser();
    const g = await product("gaufres");
    const order = await createOrder(user, {
      ...baseCheckout,
      items: [{ productId: g.id, formatId: g.formats[0].id, units: 4, boxes: 2, supplementIds: [g.supplements[0].id, g.supplements[6].id] }],
    });
    const [row] = await sql`select total, status from orders where id = ${order.id}`;
    expect(row.total).toBe((4 * 500 + 500 + 500) * 2);
    expect(row.status).toBe("awaiting_payment");

    await sql`update product_formats set price = 900 where id = ${g.formats[0].id}`;
    const [item] = await sql`select box_price, line_total from order_items where order_id = ${order.id}`;
    expect(item.box_price).toBe(3000);
    await sql`update product_formats set price = 500 where id = ${g.formats[0].id}`;
  });

  it("refuse un nombre de gaufres sous le minimum", async () => {
    const user = await makeUser();
    const g = await product("gaufres");
    await expect(
      createOrder(user, { ...baseCheckout, items: [{ productId: g.id, formatId: g.formats[0].id, units: 1, boxes: 1, supplementIds: [] }] }),
    ).rejects.toThrow(/entre 2/);
  });

  it("refuse un supplément qui n'appartient pas au produit", async () => {
    const user = await makeUser();
    const m = await product("mini-pancakes");
    await expect(
      createOrder(user, {
        ...baseCheckout,
        items: [{ productId: m.id, formatId: m.formats[0].id, units: null, boxes: 1, supplementIds: ["00000000-0000-0000-0000-000000000000"] }],
      }),
    ).rejects.toThrow(OrderError);
  });
});

describe("brouillons", () => {
  it("ne permet pas de commander un brouillon, même par requête directe", async () => {
    const user = await makeUser();
    const b = await product("brownies");
    await expect(
      createOrder(user, { ...baseCheckout, items: [{ productId: b.id, formatId: b.formats[0].id, units: null, boxes: 1, supplementIds: [] }] }),
    ).rejects.toThrow(/n'est plus proposé/);
  });
});

describe("stock", () => {
  it("distingue vide, zéro, quantité positive et rupture manuelle", () => {
    expect(availability({ stock_quantity: null, manual_out_of_stock: false })).toEqual({ orderable: true, maxBoxes: null });
    expect(availability({ stock_quantity: 0, manual_out_of_stock: false })).toEqual({ orderable: false, reason: "sold_out" });
    expect(availability({ stock_quantity: 3, manual_out_of_stock: false })).toEqual({ orderable: true, maxBoxes: 3 });
    expect(availability({ stock_quantity: 3, manual_out_of_stock: true })).toEqual({ orderable: false, reason: "manual" });
    expect(availability({ stock_quantity: null, manual_out_of_stock: true })).toEqual({ orderable: false, reason: "manual" });
    // Lever la rupture manuelle ne rend pas commandable un stock à zéro.
    expect(availability({ stock_quantity: 0, manual_out_of_stock: false }).orderable).toBe(false);
  });

  it("décompte le stock limité et bloque au-delà", async () => {
    await setStock("mini-pancakes", 3);
    const user = await makeUser();
    const m = await product("mini-pancakes");
    const line = { productId: m.id, formatId: m.formats[0].id, units: null, supplementIds: [] };
    await createOrder(user, { ...baseCheckout, items: [{ ...line, boxes: 2 }] });
    await expect(createOrder(user, { ...baseCheckout, items: [{ ...line, boxes: 2 }] })).rejects.toThrow(/Il ne reste que 1/);
    const [p] = await sql`select stock_quantity from products where id = ${m.id}`;
    expect(p.stock_quantity).toBe(1);
  });

  it("bloque un produit en rupture manuelle même avec du stock, et un stock à zéro", async () => {
    const user = await makeUser();
    const m = await product("mini-pancakes");
    const items = [{ productId: m.id, formatId: m.formats[0].id, units: null, boxes: 1, supplementIds: [] }];
    await setStock("mini-pancakes", 10, true);
    await expect(createOrder(user, { ...baseCheckout, items })).rejects.toThrow(/rupture/);
    await setStock("mini-pancakes", 0, false);
    await expect(createOrder(user, { ...baseCheckout, items })).rejects.toThrow(/épuisé/);
  });

  it("ne vend pas deux fois la dernière boîte lors de commandes simultanées", async () => {
    await setStock("mini-pancakes", 1);
    const m = await product("mini-pancakes");
    const users = await Promise.all(Array.from({ length: 6 }, () => makeUser("simultane")));
    const results = await Promise.allSettled(
      users.map((u) =>
        createOrder(u, { ...baseCheckout, items: [{ productId: m.id, formatId: m.formats[1].id, units: null, boxes: 1, supplementIds: [] }] }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const [p] = await sql`select stock_quantity from products where id = ${m.id}`;
    expect(p.stock_quantity).toBe(0);
  });

  it("libère le stock d'une réservation expirée, sauf si le client a déclaré avoir payé", async () => {
    await setStock("mini-pancakes", 2);
    const m = await product("mini-pancakes");
    const items = [{ productId: m.id, formatId: m.formats[0].id, units: null, boxes: 1, supplementIds: [] }];
    const u1 = await makeUser();
    const u2 = await makeUser();
    const o1 = await createOrder(u1, { ...baseCheckout, items });
    const o2 = await createOrder(u2, { ...baseCheckout, items });
    await declarePayment(u2.id, o2.reference);
    await sql`update orders set reservation_expires_at = now() - interval '1 minute' where id in (${o1.id}, ${o2.id})`;
    await expireStaleOrders();
    const rows = await sql`select id, status from orders where id in (${o1.id}, ${o2.id})`;
    expect(rows.find((r) => r.id === o1.id)!.status).toBe("expired");
    expect(rows.find((r) => r.id === o2.id)!.status).toBe("awaiting_payment");
    const [p] = await sql`select stock_quantity from products where id = ${m.id}`;
    expect(p.stock_quantity).toBe(1);
  });
});

describe("paiement et étapes", () => {
  it("une confirmation répétée ne consomme le stock et n'envoie l'e-mail qu'une fois", async () => {
    await setStock("gaufres", 5);
    const staff = await makeStaff();
    const user = await makeUser();
    const g = await product("gaufres");
    const order = await createOrder(user, {
      ...baseCheckout,
      items: [{ productId: g.id, formatId: g.formats[0].id, units: 2, boxes: 1, supplementIds: [] }],
    });
    const results = await Promise.allSettled([
      transitionOrder(order.id, "confirmed", staff, { paidAmount: 1000 }),
      transitionOrder(order.id, "confirmed", staff, { paidAmount: 1000 }),
    ]);
    const changed = results.filter((r) => r.status === "fulfilled" && r.value.changed);
    expect(changed).toHaveLength(1);
    const [p] = await sql`select stock_quantity from products where id = ${g.id}`;
    expect(p.stock_quantity).toBe(4);
    const [{ count }] = await sql`select count(*)::int as count from notifications where order_id = ${order.id}`;
    expect(count).toBe(1);
  });

  it("refuse un montant différent sans explication et respecte l'ordre des étapes", async () => {
    const staff = await makeStaff();
    const user = await makeUser();
    const m = await product("mini-pancakes");
    const order = await createOrder(user, {
      ...baseCheckout,
      fulfillment: "pickup",
      items: [{ productId: m.id, formatId: m.formats[0].id, units: null, boxes: 1, supplementIds: [] }],
    });
    await expect(transitionOrder(order.id, "in_production", staff)).rejects.toThrow(OrderError);
    await expect(transitionOrder(order.id, "confirmed", staff, { paidAmount: 1500 })).rejects.toThrow(/diffère/);
    await transitionOrder(order.id, "confirmed", staff, { paidAmount: 2000 });
    await expect(cancelByCustomer(user.id, order.reference)).rejects.toThrow(/ne peut plus être annulée/);
    await transitionOrder(order.id, "in_production", staff);
    await expect(transitionOrder(order.id, "out_for_delivery", staff)).rejects.toThrow(OrderError);
    await transitionOrder(order.id, "ready_for_pickup", staff);
    await transitionOrder(order.id, "picked_up", staff);
    const kinds = await sql`select kind from notifications where order_id = ${order.id} order by created_at`;
    expect(kinds.map((k) => k.kind)).toEqual(["payment_confirmed", "production_started", "ready_for_pickup", "picked_up"]);
  });

  it("une réservation expirée peut être confirmée si le stock le permet encore", async () => {
    await setStock("mini-pancakes", 1);
    const staff = await makeStaff();
    const m = await product("mini-pancakes");
    const items = [{ productId: m.id, formatId: m.formats[0].id, units: null, boxes: 1, supplementIds: [] }];
    const u1 = await makeUser();
    const o1 = await createOrder(u1, { ...baseCheckout, items });
    await sql`update orders set reservation_expires_at = now() - interval '1 minute' where id = ${o1.id}`;
    await expireStaleOrders();
    const u2 = await makeUser();
    await createOrder(u2, { ...baseCheckout, items });
    await expect(transitionOrder(o1.id, "confirmed", staff, { paidAmount: 2000 })).rejects.toThrow(/Ajustez le stock/);
  });

  it("isole les commandes : un client ne peut agir sur la commande d'un autre", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const m = await product("mini-pancakes");
    const order = await createOrder(owner, {
      ...baseCheckout,
      items: [{ productId: m.id, formatId: m.formats[0].id, units: null, boxes: 1, supplementIds: [] }],
    });
    await expect(cancelByCustomer(other.id, order.reference)).rejects.toThrow(/introuvable/);
    await expect(declarePayment(other.id, order.reference)).rejects.toThrow(/introuvable/);
  });
});
