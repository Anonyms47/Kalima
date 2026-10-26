import { afterAll, describe, expect, it } from "vitest";
import { sql } from "@/lib/server/db";
import { createEventRequest } from "@/lib/server/events";
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
    expect(result.reference).toMatch(/^KAL-\d{2}-BF\d{3,}$/);
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

  it("numérote chaque type de demande à part : KAL-AA-BF…, KAL-AA-EV…", async () => {
    const first = await createFamilyBoxRequest(null, { ...base, quantities: { Gaufres: 1 } });
    const future = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    const event = await createEventRequest(null, {
      name: "Awa Test", phone: "77 123 45 67", email: "awa@exemple.test", occasion: "Anniversaire", eventDate: future,
      location: "Dakar", guests: "", productsWanted: "60 gaufres", details: "",
    });
    const second = await createFamilyBoxRequest(null, { ...base, quantities: { Gaufres: 2 } });
    expect(first.ok && event.ok && second.ok).toBe(true);
    if (!first.ok || !event.ok || !second.ok) return;
    expect(event.reference).toMatch(/^KAL-\d{2}-EV\d{3,}$/);
    const n = (ref: string) => Number(ref.slice(9));
    // L'événement intercalé ne consomme pas de numéro de box famille.
    expect(n(second.reference)).toBe(n(first.reference) + 1);
  });

  it("refuse une demande vide, sans nom ou sans numéro WhatsApp", async () => {
    const result = await createFamilyBoxRequest(null, { ...base, name: "", phone: "12", quantities: {} });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["items", "name", "phone"]);
  });
});
