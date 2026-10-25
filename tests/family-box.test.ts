import { afterAll, describe, expect, it } from "vitest";
import { sql } from "@/lib/server/db";
import { createFamilyBoxRequest } from "@/lib/server/family-box";

afterAll(async () => {
  await sql.end();
});

const base = { name: "Awa Test", phone: "77 123 45 67", guests: "12", wantedDate: "", note: "" };

describe("box famille", () => {
  it("enregistre la composition (produits de la liste uniquement), sans prix", async () => {
    const result = await createFamilyBoxRequest(null, { ...base, quantities: { Gaufres: 3, Nems: 2, "Produit inventé": 5, Frites: 0 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reference).toMatch(/^BF-[A-Z0-9]{6}$/);
    const [row] = await sql<{ items: { side: string; item: string; quantity: number }[]; status: string; price: number | null; guests: number }[]>`
      select items, status, price, guests from family_box_requests where reference = ${result.reference}`;
    expect(row.items).toEqual([
      { side: "sweet", item: "Gaufres", quantity: 3 },
      { side: "salty", item: "Nems", quantity: 2 },
    ]);
    expect(row.status).toBe("new");
    expect(row.price).toBeNull();
    expect(row.guests).toBe(12);
  });

  it("refuse une demande vide, sans nom ou sans numéro WhatsApp", async () => {
    const result = await createFamilyBoxRequest(null, { ...base, name: "", phone: "12", quantities: {} });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["items", "name", "phone"]);
  });
});
