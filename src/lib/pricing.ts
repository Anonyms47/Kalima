// Calcul des prix, partagé entre le navigateur (affichage) et le serveur
// (seule source de vérité au moment de la commande).

export const MAX_BOXES_PER_LINE = 30;
export const MAX_UNITS_PER_BOX = 60;

export type PricedFormat = {
  pricing: "fixed" | "per_unit";
  price: number;
  min_units: number | null;
  max_units: number | null;
};

export type PricedSupplement = { name: string; price: number };

export function unitsRange(format: PricedFormat) {
  const min = format.min_units ?? 1;
  const max = Math.min(format.max_units ?? MAX_UNITS_PER_BOX, MAX_UNITS_PER_BOX);
  return { min, max };
}

/** Prix de base d'une boîte (sans supplément). */
export function boxBasePrice(format: PricedFormat, units: number | null) {
  if (format.pricing === "fixed") return format.price;
  return format.price * (units ?? 0);
}

/** Prix d'une boîte, suppléments compris. */
export function boxPrice(format: PricedFormat, units: number | null, supplements: PricedSupplement[]) {
  return boxBasePrice(format, units) + supplements.reduce((sum, s) => sum + s.price, 0);
}

export function lineTotal(format: PricedFormat, units: number | null, supplements: PricedSupplement[], boxes: number) {
  return boxPrice(format, units, supplements) * boxes;
}
