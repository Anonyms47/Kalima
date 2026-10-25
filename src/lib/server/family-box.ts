import "server-only";
import { audit } from "./audit";
import { sql } from "./db";
import { newReference } from "./orders";
import { getSettings } from "./settings";

export const FAMILY_BOX_STATUS_LABELS = {
  new: "Nouvelle demande",
  quoted: "Prix envoyé",
  confirmed: "Confirmée",
  delivered: "Livrée ou retirée",
  cancelled: "Annulée",
} as const;

export type FamilyBoxStatus = keyof typeof FAMILY_BOX_STATUS_LABELS;

export type FamilyBoxItem = { side: "sweet" | "salty"; item: string; quantity: number };

export type FamilyBoxRequestInput = {
  name: string;
  phone: string;
  guests: string;
  wantedDate: string;
  note: string;
  /** Quantités par produit, telles qu'envoyées par le formulaire. */
  quantities: Record<string, number>;
};

export type FamilyBoxFieldErrors = Partial<Record<"name" | "phone" | "guests" | "wantedDate" | "items", string>>;

const MAX_QUANTITY = 200;

function todayInDakar() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dakar" }).format(new Date());
}

/** Enregistre la composition. Seuls les produits de la liste actuelle sont retenus. */
export async function createFamilyBoxRequest(userId: string | null, input: FamilyBoxRequestInput) {
  const settings = await getSettings();
  const errors: FamilyBoxFieldErrors = {};
  const name = input.name.trim().slice(0, 80);
  const phone = input.phone.trim().slice(0, 30);
  const note = input.note.trim().slice(0, 1000);
  const guests = input.guests.trim() ? Number(input.guests) : null;
  const wantedDate = input.wantedDate.trim().slice(0, 10) || null;

  const items: FamilyBoxItem[] = [];
  for (const [side, list] of [["sweet", settings.family_box.sweet], ["salty", settings.family_box.salty]] as const) {
    for (const item of list) {
      const quantity = Number(input.quantities[item] ?? 0);
      if (Number.isInteger(quantity) && quantity > 0) items.push({ side, item, quantity: Math.min(quantity, MAX_QUANTITY) });
    }
  }

  if (!name) errors.name = "Indiquez votre nom.";
  if (phone.replace(/\D/g, "").length < 9) errors.phone = "Indiquez un numéro WhatsApp valide.";
  if (guests !== null && (!Number.isInteger(guests) || guests < 1 || guests > 5000)) errors.guests = "Nombre de personnes invalide.";
  if (wantedDate && (!/^\d{4}-\d{2}-\d{2}$/.test(wantedDate) || wantedDate < todayInDakar())) errors.wantedDate = "Choisissez une date à venir.";
  if (items.length === 0 && !note) errors.items = "Choisissez au moins un produit, ou décrivez votre envie.";
  if (Object.keys(errors).length) return { ok: false as const, errors };

  const [row] = await sql<{ id: string; reference: string }[]>`
    insert into family_box_requests (reference, user_id, name, phone, items, guests, wanted_date, note)
    values (${newReference("BF")}, ${userId}, ${name}, ${phone}, ${sql.json(items)}, ${guests}, ${wantedDate}, ${note || null})
    returning id, reference`;
  await audit(sql, { userId, label: name }, "family_box.requested", "family_box", row.id, { reference: row.reference });
  return { ok: true as const, reference: row.reference, items };
}
