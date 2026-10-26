import { afterAll, describe, expect, it } from "vitest";
import { getProductPerformance } from "@/lib/server/admin-queries";
import { sql } from "@/lib/server/db";
import { createOrder, transitionOrder } from "@/lib/server/orders";
import { baseCheckout, makeStaff, makeUser, product } from "./helpers";

afterAll(async () => {
  await sql.end();
});

describe("ventes par produit", () => {
  it("additionne ce que rapporte chaque produit, suppléments compris, sans les commandes non payées", async () => {
    const before = await getProductPerformance(30);
    const staff = await makeStaff();
    const g = await product("gaufres");
    const m = await product("mini-pancakes");
    const chantilly = g.supplements.find((s) => s.name === "Chantilly")!;

    // Payée : 2 boîtes de 3 gaufres avec chantilly (2 000 × 2) + 1 boîte de mini pancakes (format 1).
    const paid = await createOrder(await makeUser(), {
      ...baseCheckout,
      items: [
        { productId: g.id, formatId: g.formats[0].id, units: 3, boxes: 2, supplementIds: [chantilly.id] },
        { productId: m.id, formatId: m.formats[0].id, units: null, boxes: 1, supplementIds: [] },
      ],
    });
    const [{ total }] = await sql<{ total: number }[]>`select total from orders where id = ${paid.id}`;
    await transitionOrder(paid.id, "confirmed", staff, { paidAmount: total });
    // Non payée : ne compte pas.
    await createOrder(await makeUser(), { ...baseCheckout, items: [{ productId: g.id, formatId: g.formats[0].id, units: 2, boxes: 5, supplementIds: [] }] });

    const after = await getProductPerformance(30);
    const delta = (name: string, key: "boxes" | "revenue") =>
      (after.products.find((p) => p.product_name === name)?.[key] ?? 0) - (before.products.find((p) => p.product_name === name)?.[key] ?? 0);
    expect(delta("Gaufres", "boxes")).toBe(2);
    expect(delta("Gaufres", "revenue")).toBe(4000);
    expect(delta("Mini pancakes", "boxes")).toBe(1);
    expect(after.total - before.total).toBe(total);
    const supp = (list: typeof after.supplements) => list.find((s) => s.name === "Chantilly")?.revenue ?? 0;
    expect(supp(after.supplements) - supp(before.supplements)).toBe(1000);
  });
});
