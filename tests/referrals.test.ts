import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "@/lib/server/db";
import { claimReward, createOrder, transitionOrder } from "@/lib/server/orders";
import { activateAmbassador, getAmbassadorOverview } from "@/lib/server/referrals";
import { baseCheckout, makeStaff, makeUser, product } from "./helpers";

let staff: Awaited<ReturnType<typeof makeStaff>>;

beforeAll(async () => {
  staff = await makeStaff();
  await sql`update products set stock_quantity = null, manual_out_of_stock = false`;
  await sql`update products set reward_eligible = true where slug = 'mini-pancakes'`;
});

afterAll(async () => {
  await sql.end();
});

async function deliveredOrderFor(user: { id: string; email: string }, code: string | null, fulfillment: "delivery" | "pickup" = "delivery") {
  const m = await product("mini-pancakes");
  const order = await createOrder(user, {
    ...baseCheckout,
    phone: `77 ${Math.floor(1000000 + Math.random() * 8999999)}`,
    fulfillment,
    referralCode: code,
    items: [{ productId: m.id, formatId: m.formats[0].id, units: null, boxes: 1, supplementIds: [] }],
  });
  await transitionOrder(order.id, "confirmed", staff, { paidAmount: 2000 });
  await transitionOrder(order.id, "in_production", staff);
  if (fulfillment === "delivery") {
    await transitionOrder(order.id, "out_for_delivery", staff);
    await transitionOrder(order.id, "delivered", staff);
  } else {
    await transitionOrder(order.id, "ready_for_pickup", staff);
    await transitionOrder(order.id, "picked_up", staff);
  }
  return order;
}

describe("programme ambassadeur", () => {
  it("attribue un code unique et stable", async () => {
    const amb = await makeUser("amb");
    const code = await activateAmbassador(amb.id);
    expect(code).toMatch(/^K[A-Z0-9]{6}$/);
    expect(await activateAmbassador(amb.id)).toBe(code);
  });

  it("refuse l'auto-parrainage et un code inconnu", async () => {
    const amb = await makeUser("amb");
    const code = await activateAmbassador(amb.id);
    const m = await product("mini-pancakes");
    const items = [{ productId: m.id, formatId: m.formats[0].id, units: null, boxes: 1, supplementIds: [] }];
    await expect(createOrder(amb, { ...baseCheckout, referralCode: code, items })).rejects.toThrow(/propre code/);
    await expect(createOrder(amb, { ...baseCheckout, referralCode: "KZZZZZZ", items })).rejects.toThrow(/n'existe pas/);
  });

  it("ne compte que les commandes payées et exécutées, et un filleul une seule fois", async () => {
    const amb = await makeUser("amb");
    const code = await activateAmbassador(amb.id);
    const filleul = await makeUser("filleul");
    await deliveredOrderFor(filleul, code);
    await deliveredOrderFor(filleul, code);
    // Une commande payée mais pas encore livrée ne compte pas encore.
    const pending = await makeUser("filleul");
    const m = await product("mini-pancakes");
    const order = await createOrder(pending, {
      ...baseCheckout,
      referralCode: code,
      items: [{ productId: m.id, formatId: m.formats[0].id, units: null, boxes: 1, supplementIds: [] }],
    });
    await transitionOrder(order.id, "confirmed", staff, { paidAmount: 2000 });
    const overview = await getAmbassadorOverview(amb.id);
    expect(overview?.validated).toBe(1);
    expect(overview?.pending).toBe(1);
    expect(overview?.rewards).toHaveLength(0);
  });

  it("crée une récompense à 5 puis une seconde à 10 filleuls (retrait compris)", async () => {
    const amb = await makeUser("amb");
    const code = await activateAmbassador(amb.id);
    for (let i = 0; i < 5; i++) await deliveredOrderFor(await makeUser("filleul"), code, i % 2 ? "pickup" : "delivery");
    let overview = await getAmbassadorOverview(amb.id);
    expect(overview?.validated).toBe(5);
    expect(overview?.rewards.map((r) => r.tier)).toEqual([1]);
    for (let i = 0; i < 5; i++) await deliveredOrderFor(await makeUser("filleul"), code);
    overview = await getAmbassadorOverview(amb.id);
    expect(overview?.validated).toBe(10);
    expect(overview?.rewards.map((r) => r.tier)).toEqual([1, 2]);
  });

  it("une récompense ne s'utilise qu'une fois, exclut les box famille et ne crée pas de parrainage", async () => {
    const amb = await makeUser("amb");
    const code = await activateAmbassador(amb.id);
    for (let i = 0; i < 5; i++) await deliveredOrderFor(await makeUser("filleul"), code);
    const [reward] = await sql<{ id: string }[]>`select id from rewards where ambassador_user_id = ${amb.id}`;
    const m = await product("mini-pancakes");
    const [family] = await sql<{ id: string }[]>`
      insert into products (slug, name, status, is_family_box) values ('box-famille-test', 'Box famille test', 'published', true)
      on conflict (slug) do update set status = 'published' returning id`;
    const claim = {
      rewardId: reward.id,
      productId: m.id,
      formatId: m.formats[0].id,
      units: null,
      fulfillment: "pickup" as const,
      name: "Ambassadeur Test",
      phone: "77 123 45 67",
      deliveryArea: null,
      note: null,
    };
    await expect(claimReward(amb, { ...claim, productId: family.id })).rejects.toThrow(/ne fait pas partie/);

    const results = await Promise.allSettled([claimReward(amb, claim), claimReward(amb, claim)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const ok = results.find((r) => r.status === "fulfilled") as PromiseFulfilledResult<{ id: string }>;

    await transitionOrder(ok.value.id, "confirmed", staff);
    await transitionOrder(ok.value.id, "in_production", staff);
    await transitionOrder(ok.value.id, "ready_for_pickup", staff);
    await transitionOrder(ok.value.id, "picked_up", staff);
    const [r] = await sql`select status from rewards where id = ${reward.id}`;
    expect(r.status).toBe("delivered");
    const [{ count }] = await sql`select count(*)::int as count from referrals where qualifying_order_id = ${ok.value.id}`;
    expect(count).toBe(0);
  });

  it("un remboursement retire le parrainage et annule une récompense non réclamée", async () => {
    const amb = await makeUser("amb");
    const code = await activateAmbassador(amb.id);
    const orders = [];
    for (let i = 0; i < 5; i++) orders.push(await deliveredOrderFor(await makeUser("filleul"), code));
    expect((await getAmbassadorOverview(amb.id))?.rewards).toHaveLength(1);
    await transitionOrder(orders[0].id, "refunded", staff, { refundedAmount: 2000, note: "Test de remboursement" });
    const overview = await getAmbassadorOverview(amb.id);
    expect(overview?.validated).toBe(4);
    expect(overview?.rewards).toHaveLength(0);
  });

  it("n'expose aucune coordonnée de filleul dans la vue ambassadeur", async () => {
    const amb = await makeUser("amb");
    const code = await activateAmbassador(amb.id);
    const filleul = await makeUser("filleul");
    await deliveredOrderFor(filleul, code);
    const overview = JSON.stringify(await getAmbassadorOverview(amb.id));
    expect(overview).not.toContain(filleul.email);
    expect(overview).not.toContain("Awa");
  });
});
