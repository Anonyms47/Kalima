// Règles de disponibilité (cahier des charges, § Stock) :
// - quantité vide (null) : aucune limite définie, produit disponible ;
// - quantité positive : stock limité et suivi ;
// - zéro : épuisé ;
// - rupture manuelle : bloque toujours, quelle que soit la quantité.

export type StockFields = {
  stock_quantity: number | null;
  manual_out_of_stock: boolean;
};

export type Availability =
  | { orderable: true; maxBoxes: number | null }
  | { orderable: false; reason: "manual" | "sold_out" };

export function availability(product: StockFields): Availability {
  if (product.manual_out_of_stock) return { orderable: false, reason: "manual" };
  if (product.stock_quantity === 0) return { orderable: false, reason: "sold_out" };
  return { orderable: true, maxBoxes: product.stock_quantity };
}

export function availabilityLabel(a: Availability) {
  if (a.orderable) {
    if (a.maxBoxes !== null && a.maxBoxes <= 5) {
      return `Plus que ${a.maxBoxes} boîte${a.maxBoxes > 1 ? "s" : ""}`;
    }
    return "Disponible";
  }
  return a.reason === "manual" ? "En rupture de stock" : "Épuisé pour le moment";
}
