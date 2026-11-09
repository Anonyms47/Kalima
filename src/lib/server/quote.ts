import "server-only";
import { availability } from "../availability";
import { boxPrice, MAX_BOXES_PER_LINE, unitsRange } from "../pricing";
import { sql } from "./db";
import type { CartLineInput } from "./orders";

export type QuotedLine = {
  index: number;
  ok: boolean;
  error: string | null;
  boxPrice: number;
  lineTotal: number;
  maxBoxes: number | null;
};

export type Quote = { lines: QuotedLine[]; total: number; ok: boolean };

/**
 * Devis indicatif du panier, recalculé à partir du catalogue publié.
 * La commande refait ces contrôles sous verrou au moment de l'enregistrement.
 */
export async function quoteCart(items: CartLineInput[]): Promise<Quote> {
  const ids = [...new Set(items.map((i) => i.productId).filter((id) => /^[0-9a-f-]{36}$/.test(id)))];
  const products = ids.length
    ? await sql<{ id: string; name: string; stock_quantity: number | null; manual_out_of_stock: boolean }[]>`
        select id, name, stock_quantity, manual_out_of_stock from products where id = any(${ids}::uuid[]) and status = 'published'`
    : [];
  const formats = ids.length
    ? await sql<{ id: string; product_id: string; pricing: "fixed" | "per_unit"; price: number; min_units: number | null; max_units: number | null }[]>`
        select id, product_id, pricing, price, min_units, max_units from product_formats where product_id = any(${ids}::uuid[]) and active`
    : [];
  const supplements = ids.length
    ? await sql<{ id: string; product_id: string; name: string; price: number }[]>`
        select s.id, ps.product_id, s.name, s.price from supplements s
        join product_supplements ps on ps.supplement_id = s.id
        where ps.product_id = any(${ids}::uuid[]) and s.active`
    : [];

  const boxesPerProduct = new Map<string, number>();
  for (const item of items) boxesPerProduct.set(item.productId, (boxesPerProduct.get(item.productId) ?? 0) + (Number(item.boxes) || 0));

  const lines = items.map((item, index): QuotedLine => {
    const fail = (error: string): QuotedLine => ({ index, ok: false, error, boxPrice: 0, lineTotal: 0, maxBoxes: null });
    const product = products.find((p) => p.id === item.productId);
    if (!product) return fail("Ce produit n'est plus proposé.");
    const a = availability(product);
    if (!a.orderable) return fail(a.reason === "manual" ? "En rupture de stock pour le moment." : "Épuisé pour le moment.");
    const format = formats.find((f) => f.id === item.formatId && f.product_id === product.id);
    if (!format) return fail("Ce format n'est plus disponible.");
    const range = unitsRange(format);
    const units = format.pricing === "per_unit" ? Number(item.units) : null;
    if (units !== null && (!Number.isInteger(units) || units < range.min || units > range.max)) {
      return fail(`Choisissez entre ${range.min} et ${range.max} pièces par boîte.`);
    }
    const chosen = supplements.filter((s) => s.product_id === product.id && item.supplementIds.includes(s.id));
    if (chosen.length !== new Set(item.supplementIds).size) return fail("Un supplément choisi n'est plus proposé.");
    const boxes = Number(item.boxes);
    if (!Number.isInteger(boxes) || boxes < 1 || boxes > MAX_BOXES_PER_LINE) return fail("Nombre de boîtes invalide.");
    if (a.maxBoxes !== null && (boxesPerProduct.get(product.id) ?? 0) > a.maxBoxes) {
      return { ...fail(`Il ne reste que ${a.maxBoxes} boîte${a.maxBoxes > 1 ? "s" : ""} de ce produit.`), maxBoxes: a.maxBoxes };
    }
    const price = boxPrice(format, units, chosen);
    return { index, ok: true, error: null, boxPrice: price, lineTotal: price * boxes, maxBoxes: a.maxBoxes };
  });

  return { lines, total: lines.reduce((sum, l) => sum + l.lineTotal, 0), ok: lines.length > 0 && lines.every((l) => l.ok) };
}
