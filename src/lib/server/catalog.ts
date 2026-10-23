import "server-only";
import { sql, type Db } from "./db";

export type ProductStatus = "draft" | "published" | "archived";

export type Format = {
  id: string;
  label: string;
  pricing: "fixed" | "per_unit";
  price: number;
  min_units: number | null;
  max_units: number | null;
  unit_label: string;
  active: boolean;
  sort_order: number;
};

export type Supplement = { id: string; name: string; price: number; active: boolean; sort_order: number };

export type ProductImage = { id: string; url: string; alt: string; width: number | null; height: number | null; sort_order: number; storage_path: string | null };

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  included_note: string;
  status: ProductStatus;
  stock_quantity: number | null;
  manual_out_of_stock: boolean;
  is_family_box: boolean;
  reward_eligible: boolean;
  sort_order: number;
  internal_note: string;
  formats: Format[];
  supplements: Supplement[];
  images: ProductImage[];
};

/** Formats actifs et suppléments actifs uniquement, pour l'affichage public. */
export type PublicProduct = Omit<Product, "internal_note" | "status">;

async function hydrate(db: Db, rows: Omit<Product, "formats" | "supplements" | "images">[], onlyActive: boolean): Promise<Product[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [formats, supplements, images] = await Promise.all([
    db<(Format & { product_id: string })[]>`
      select id, product_id, label, pricing, price, min_units, max_units, unit_label, active, sort_order
      from product_formats where product_id = any(${ids}::uuid[]) ${onlyActive ? db`and active` : db``}
      order by sort_order, price`,
    db<(Supplement & { product_id: string })[]>`
      select s.id, ps.product_id, s.name, s.price, s.active, s.sort_order
      from product_supplements ps join supplements s on s.id = ps.supplement_id
      where ps.product_id = any(${ids}::uuid[]) ${onlyActive ? db`and s.active` : db``}
      order by s.sort_order, s.name`,
    db<(ProductImage & { product_id: string })[]>`
      select id, product_id, url, alt, width, height, sort_order, storage_path
      from product_images where product_id = any(${ids}::uuid[]) order by sort_order, created_at`,
  ]);
  return rows.map((row) => ({
    ...row,
    formats: formats.filter((f) => f.product_id === row.id),
    supplements: supplements.filter((s) => s.product_id === row.id),
    images: images.filter((i) => i.product_id === row.id),
  }));
}

function toPublic(product: Product): PublicProduct {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { internal_note, status, ...rest } = product;
  return rest;
}

const productColumns = sql`
  id, slug, name, tagline, description, included_note, status, stock_quantity,
  manual_out_of_stock, is_family_box, reward_eligible, sort_order, internal_note`;

/** Catalogue public : produits publiés seulement. */
export async function listPublishedProducts(): Promise<PublicProduct[]> {
  const rows = await sql<Product[]>`
    select ${productColumns} from products where status = 'published' order by sort_order, name`;
  return (await hydrate(sql, rows, true)).map(toPublic);
}

/** Fiche publique : un brouillon ou un produit archivé renvoie null (404). */
export async function getPublishedProduct(slug: string): Promise<PublicProduct | null> {
  const rows = await sql<Product[]>`
    select ${productColumns} from products where slug = ${slug} and status = 'published'`;
  const [product] = await hydrate(sql, rows, true);
  return product ? toPublic(product) : null;
}

// --- Administration ---------------------------------------------------------

export async function listAllProducts(): Promise<Product[]> {
  const rows = await sql<Product[]>`
    select ${productColumns} from products
    order by case status when 'published' then 0 when 'draft' then 1 else 2 end, sort_order, name`;
  return hydrate(sql, rows, false);
}

export async function getProductById(id: string): Promise<Product | null> {
  const rows = await sql<Product[]>`select ${productColumns} from products where id = ${id}`;
  const [product] = await hydrate(sql, rows, false);
  return product ?? null;
}

export async function listSupplements(): Promise<Supplement[]> {
  return sql<Supplement[]>`select id, name, price, active, sort_order from supplements order by sort_order, name`;
}

/** Raisons empêchant la publication d'un produit (aucune information inventée). */
export function publicationIssues(product: Product): string[] {
  const issues: string[] = [];
  if (!product.name.trim()) issues.push("Ajoutez un nom.");
  if (!product.description.trim()) issues.push("Ajoutez une description.");
  if (!product.formats.some((f) => f.active && f.price > 0)) issues.push("Ajoutez au moins un format actif avec un prix.");
  if (product.images.length === 0) issues.push("Ajoutez au moins une photo.");
  if (product.is_family_box && product.reward_eligible) issues.push("Une box famille ne peut pas être une récompense.");
  return issues;
}

/** Box individuelles proposées en récompense (jamais les box famille). */
export async function listRewardEligibleProducts(): Promise<PublicProduct[]> {
  const rows = await sql<Product[]>`
    select ${productColumns} from products
    where status = 'published' and reward_eligible and not is_family_box
    order by sort_order, name`;
  return (await hydrate(sql, rows, true)).map(toPublic);
}
