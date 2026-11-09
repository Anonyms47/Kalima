"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit } from "@/lib/server/audit";
import { requireStaff, staffActor } from "@/lib/server/auth";
import { getProductById, publicationIssues } from "@/lib/server/catalog";
import { sql } from "@/lib/server/db";
import { deleteStoredImage, processProductImage, storeImage, UploadError } from "@/lib/server/storage";
import type { ActionResult } from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function refresh(productId?: string) {
  revalidatePath("/", "layout");
  if (productId) revalidatePath(`/admin/produits/${productId}`);
}

/** Quantité de stock : vide = aucune limite (NULL), sinon entier ≥ 0. Jamais confondus. */
function parseStock(raw: string): { ok: true; value: number | null } | { ok: false } {
  const value = raw.replace(/\s/g, "");
  if (value === "") return { ok: true, value: null };
  if (!/^\d+$/.test(value)) return { ok: false };
  return { ok: true, value: Number(value) };
}

export async function createProductAction(formData: FormData) {
  const staff = await requireStaff();
  const name = text(formData, "name", 80) || "Nouveau produit";
  let slug = slugify(name) || "produit";
  const [taken] = await sql`select 1 from products where slug = ${slug}`;
  if (taken) slug = `${slug}-${Date.now().toString(36)}`;
  const [product] = await sql<{ id: string }[]>`
    insert into products (slug, name, status, sort_order)
    values (${slug}, ${name}, 'draft', (select coalesce(max(sort_order), 0) + 1 from products))
    returning id`;
  await audit(sql, staffActor(staff), "product.created", "product", product.id, { name });
  redirect(`/admin/produits/${product.id}`);
}

export async function updateProductAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  const id = String(formData.get("productId") ?? "");
  const before = await getProductById(id);
  if (!before) return { error: "Produit introuvable." };

  const name = text(formData, "name", 80);
  const slug = slugify(text(formData, "slug", 60) || name);
  if (!name) return { error: "Le nom est obligatoire." };
  if (!slug) return { error: "L'adresse de la page est invalide." };
  const stock = parseStock(String(formData.get("stock") ?? ""));
  if (!stock.ok) return { error: "Le stock doit être vide (sans limite) ou un nombre entier positif ou nul." };
  const isFamilyBox = formData.get("isFamilyBox") === "on";
  const rewardEligible = formData.get("rewardEligible") === "on" && !isFamilyBox;
  const manual = formData.get("manualOutOfStock") === "on";

  const [conflict] = await sql`select 1 from products where slug = ${slug} and id <> ${id}`;
  if (conflict) return { error: "Cette adresse de page est déjà utilisée par un autre produit." };

  await sql`
    update products set
      name = ${name}, slug = ${slug}, tagline = ${text(formData, "tagline", 160)},
      description = ${text(formData, "description", 2000)}, included_note = ${text(formData, "includedNote", 160)},
      internal_note = ${text(formData, "internalNote", 1000)}, stock_quantity = ${stock.value},
      manual_out_of_stock = ${manual}, is_family_box = ${isFamilyBox}, reward_eligible = ${rewardEligible},
      sort_order = ${Number(formData.get("sortOrder")) || 0}, updated_at = now()
    where id = ${id}`;

  const changes: Record<string, unknown> = {};
  if (before.stock_quantity !== stock.value) changes.stock = { avant: before.stock_quantity, apres: stock.value };
  if (before.manual_out_of_stock !== manual) changes.rupture_manuelle = manual;
  if (before.name !== name) changes.nom = name;
  await audit(sql, staffActor(staff), "product.updated", "product", id, changes);
  refresh(id);
  return { ok: true, message: "Produit enregistré." };
}

/** Interrupteur rapide « En rupture de stock » depuis la liste. */
export async function toggleOutOfStockAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("productId") ?? "");
  const value = formData.get("value") === "on";
  await sql`update products set manual_out_of_stock = ${value}, updated_at = now() where id = ${id}`;
  await audit(sql, staffActor(staff), "product.stock_toggle", "product", id, { rupture_manuelle: value });
  refresh(id);
}

export async function setStatusAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  const id = String(formData.get("productId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["draft", "published", "archived"].includes(status)) return { error: "Statut inconnu." };
  const product = await getProductById(id);
  if (!product) return { error: "Produit introuvable." };
  if (status === "published") {
    const issues = publicationIssues(product);
    if (issues.length) return { error: `Impossible de publier : ${issues.join(" ")}` };
  }
  await sql`
    update products set status = ${status}, updated_at = now(),
      published_at = case when ${status} = 'published' then coalesce(published_at, now()) else published_at end
    where id = ${id}`;
  await audit(sql, staffActor(staff), `product.${status}`, "product", id, { name: product.name });
  refresh(id);
  const labels: Record<string, string> = { draft: "Produit repassé en brouillon : il n'est plus visible.", published: "Produit publié : il est visible et commandable.", archived: "Produit archivé. Les anciennes commandes restent intactes." };
  return { ok: true, message: labels[status] };
}

export async function duplicateProductAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("productId") ?? "");
  const source = await getProductById(id);
  if (!source) return;
  const slug = `${source.slug}-copie-${Date.now().toString(36)}`.slice(0, 60);
  const copyId = await sql.begin(async (tx) => {
    const [copy] = await tx<{ id: string }[]>`
      insert into products (slug, name, tagline, description, included_note, status, stock_quantity, manual_out_of_stock,
        is_family_box, reward_eligible, sort_order, internal_note)
      values (${slug}, ${`${source.name} (copie)`}, ${source.tagline}, ${source.description}, ${source.included_note}, 'draft',
        ${source.stock_quantity}, ${source.manual_out_of_stock}, ${source.is_family_box}, ${source.reward_eligible},
        ${source.sort_order + 1}, ${source.internal_note})
      returning id`;
    for (const f of source.formats) {
      await tx`insert into product_formats (product_id, label, pricing, price, min_units, max_units, unit_label, active, sort_order)
        values (${copy.id}, ${f.label}, ${f.pricing}, ${f.price}, ${f.min_units}, ${f.max_units}, ${f.unit_label}, ${f.active}, ${f.sort_order})`;
    }
    for (const s of source.supplements) {
      await tx`insert into product_supplements (product_id, supplement_id) values (${copy.id}, ${s.id})`;
    }
    for (const img of source.images) {
      // Les fichiers sont partagés : la copie ne supprime jamais l'original.
      await tx`insert into product_images (product_id, url, storage_path, alt, width, height, sort_order)
        values (${copy.id}, ${img.url}, null, ${img.alt}, ${img.width}, ${img.height}, ${img.sort_order})`;
    }
    return copy.id;
  });
  await audit(sql, staffActor(staff), "product.duplicated", "product", copyId, { source: source.name });
  redirect(`/admin/produits/${copyId}`);
}

// --- Formats ---------------------------------------------------------------

export async function saveFormatAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  const productId = String(formData.get("productId") ?? "");
  const formatId = String(formData.get("formatId") ?? "");
  const label = text(formData, "label", 60);
  const pricing = formData.get("pricing") === "per_unit" ? "per_unit" : "fixed";
  const price = Number(String(formData.get("price") ?? "").replace(/\s/g, ""));
  const minUnits = formData.get("minUnits") ? Number(formData.get("minUnits")) : null;
  const maxUnits = formData.get("maxUnits") ? Number(formData.get("maxUnits")) : null;
  const unitLabel = text(formData, "unitLabel", 30) || "pièce";
  const active = formData.get("active") === "on";

  if (!label) return { error: "Donnez un nom au format (ex. Boîte de 10)." };
  if (!Number.isInteger(price) || price <= 0) return { error: "Le prix doit être un nombre entier de FCFA." };
  if (pricing === "per_unit" && (!minUnits || !Number.isInteger(minUnits) || minUnits < 1)) {
    return { error: "Indiquez le minimum de pièces par boîte." };
  }
  if (maxUnits !== null && (!Number.isInteger(maxUnits) || (minUnits && maxUnits < minUnits))) {
    return { error: "Le maximum doit être supérieur ou égal au minimum." };
  }

  if (formatId && UUID.test(formatId)) {
    await sql`
      update product_formats set label = ${label}, pricing = ${pricing}, price = ${price},
        min_units = ${pricing === "per_unit" ? minUnits : null}, max_units = ${pricing === "per_unit" ? maxUnits : null},
        unit_label = ${unitLabel}, active = ${active}
      where id = ${formatId} and product_id = ${productId}`;
  } else {
    await sql`
      insert into product_formats (product_id, label, pricing, price, min_units, max_units, unit_label, active, sort_order)
      values (${productId}, ${label}, ${pricing}, ${price}, ${pricing === "per_unit" ? minUnits : null},
        ${pricing === "per_unit" ? maxUnits : null}, ${unitLabel}, ${active},
        (select coalesce(max(sort_order), 0) + 1 from product_formats where product_id = ${productId}))`;
  }
  await audit(sql, staffActor(staff), "product.format_saved", "product", productId, { label, price, pricing, active });
  refresh(productId);
  return { ok: true, message: "Format enregistré. Les commandes passées gardent leur prix d'origine." };
}

export async function deleteFormatAction(formData: FormData) {
  const staff = await requireStaff();
  const productId = String(formData.get("productId") ?? "");
  const formatId = String(formData.get("formatId") ?? "");
  const [used] = await sql`select 1 from rewards where format_id = ${formatId} limit 1`;
  if (used) {
    await sql`update product_formats set active = false where id = ${formatId}`;
  } else {
    await sql`delete from product_formats where id = ${formatId} and product_id = ${productId}`;
  }
  await audit(sql, staffActor(staff), "product.format_removed", "product", productId, { formatId });
  refresh(productId);
}

// --- Suppléments du produit -------------------------------------------------

export async function setProductSupplementsAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  const productId = String(formData.get("productId") ?? "");
  const ids = formData.getAll("supplementIds").map(String).filter((id) => UUID.test(id));
  await sql.begin(async (tx) => {
    await tx`delete from product_supplements where product_id = ${productId}`;
    for (const id of ids) await tx`insert into product_supplements (product_id, supplement_id) values (${productId}, ${id})`;
  });
  await audit(sql, staffActor(staff), "product.supplements", "product", productId, { count: ids.length });
  refresh(productId);
  return { ok: true, message: "Suppléments enregistrés." };
}

// --- Photos ----------------------------------------------------------------

export async function uploadImageAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  const productId = String(formData.get("productId") ?? "");
  const product = await getProductById(productId);
  if (!product) return { error: "Produit introuvable." };
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Choisissez au moins une photo." };
  if (files.length > 8) return { error: "8 photos au maximum à la fois." };
  const alt = text(formData, "alt", 160) || `${product.name} KALIMA`;
  try {
    let order = product.images.length;
    for (const file of files) {
      const image = await processProductImage(file);
      const stored = await storeImage(image.data, product.slug);
      await sql`
        insert into product_images (product_id, url, storage_path, alt, width, height, sort_order)
        values (${productId}, ${stored.url}, ${stored.storagePath}, ${alt}, ${image.width}, ${image.height}, ${order++})`;
    }
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message };
    console.error(error);
    return { error: "La photo n'a pas pu être enregistrée." };
  }
  await audit(sql, staffActor(staff), "product.images_added", "product", productId, { count: files.length });
  refresh(productId);
  return { ok: true, message: files.length > 1 ? `${files.length} photos ajoutées.` : "Photo ajoutée." };
}

export async function imageAction(formData: FormData) {
  const staff = await requireStaff();
  const productId = String(formData.get("productId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  const intent = String(formData.get("intent") ?? "");
  const images = await sql<{ id: string; storage_path: string | null; sort_order: number }[]>`
    select id, storage_path, sort_order from product_images where product_id = ${productId} order by sort_order, created_at`;
  const index = images.findIndex((i) => i.id === imageId);
  if (index === -1) return;

  if (intent === "delete") {
    await sql`delete from product_images where id = ${imageId}`;
    // Le fichier n'est supprimé que s'il n'est plus utilisé par une autre fiche.
    const path = images[index].storage_path;
    if (path) {
      const [shared] = await sql`select 1 from product_images where url like ${"%" + path}`;
      if (!shared) await deleteStoredImage(path);
    }
    await audit(sql, staffActor(staff), "product.image_deleted", "product", productId, {});
  } else if (intent === "first" || intent === "up" || intent === "down") {
    const order = images.map((i) => i.id);
    order.splice(index, 1);
    const target = intent === "first" ? 0 : intent === "up" ? Math.max(0, index - 1) : Math.min(order.length, index + 1);
    order.splice(target, 0, imageId);
    await sql.begin(async (tx) => {
      for (const [position, id] of order.entries()) await tx`update product_images set sort_order = ${position} where id = ${id}`;
    });
  } else if (intent === "alt") {
    await sql`update product_images set alt = ${text(formData, "alt", 160)} where id = ${imageId}`;
  }
  refresh(productId);
}

// --- Suppléments (liste générale) ------------------------------------------

export async function saveSupplementAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  const id = String(formData.get("supplementId") ?? "");
  const name = text(formData, "name", 60);
  const price = Number(String(formData.get("price") ?? "").replace(/\s/g, ""));
  const active = formData.get("active") === "on";
  if (!name) return { error: "Le nom est obligatoire." };
  if (!Number.isInteger(price) || price < 0) return { error: "Le prix doit être un nombre entier de FCFA." };
  try {
    if (UUID.test(id)) {
      await sql`update supplements set name = ${name}, price = ${price}, active = ${active} where id = ${id}`;
    } else {
      await sql`insert into supplements (name, price, active, sort_order) values (${name}, ${price}, ${active}, (select coalesce(max(sort_order), 0) + 1 from supplements))`;
    }
  } catch {
    return { error: "Un supplément porte déjà ce nom." };
  }
  await audit(sql, staffActor(staff), "supplement.saved", "supplement", id || null, { name, price, active });
  refresh();
  revalidatePath("/admin/supplements");
  return { ok: true, message: "Supplément enregistré." };
}
