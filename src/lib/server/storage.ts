import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import { isProductionSite } from "../config";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const LOCAL_DIR = path.join(process.cwd(), ".uploads");

export class UploadError extends Error {}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.STORAGE_BUCKET ?? "produits";
  return url && key ? { url: url.replace(/\/$/, ""), key, bucket } : null;
}

export function storageMode() {
  if (supabaseConfig()) return "supabase" as const;
  return isProductionSite ? ("none" as const) : ("local" as const);
}

/**
 * Optimise une photo produit : orientation corrigée, 1600 px de large au plus,
 * format WebP. Le contenu réel est vérifié (pas seulement l'extension).
 * Aucun recadrage : la photo et ses éléments de marque restent entiers.
 */
export async function processProductImage(file: File) {
  if (file.size === 0) throw new UploadError("Le fichier est vide.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("La photo dépasse 8 Mo.");
  const input = Buffer.from(await file.arrayBuffer());
  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new UploadError("Ce fichier n'est pas une image lisible.");
  }
  if (!meta.format || !["jpeg", "png", "webp", "heif", "avif"].includes(meta.format)) {
    throw new UploadError("Formats acceptés : JPEG, PNG, WebP ou HEIC.");
  }
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

export async function storeImage(data: Buffer, prefix: string) {
  const name = `${prefix}/${Date.now()}-${randomBytes(6).toString("hex")}.webp`;
  const supabase = supabaseConfig();
  if (supabase) {
    const response = await fetch(`${supabase.url}/storage/v1/object/${supabase.bucket}/${name}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${supabase.key}`, "content-type": "image/webp", "cache-control": "31536000", "x-upsert": "false" },
      body: new Uint8Array(data),
    });
    if (!response.ok) throw new UploadError(`Le stockage a refusé la photo (${response.status}).`);
    return { url: `${supabase.url}/storage/v1/object/public/${supabase.bucket}/${name}`, storagePath: name };
  }
  if (isProductionSite) throw new UploadError("Le stockage des photos n'est pas configuré.");
  await mkdir(path.join(LOCAL_DIR, path.dirname(name)), { recursive: true });
  await writeFile(path.join(LOCAL_DIR, name), data);
  return { url: `/media/${name}`, storagePath: name };
}

export async function deleteStoredImage(storagePath: string | null) {
  if (!storagePath) return;
  const supabase = supabaseConfig();
  if (supabase) {
    await fetch(`${supabase.url}/storage/v1/object/${supabase.bucket}/${storagePath}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${supabase.key}` },
    }).catch(() => {});
    return;
  }
  await unlink(path.join(LOCAL_DIR, storagePath)).catch(() => {});
}

/** Lecture d'une photo stockée localement (développement uniquement). */
export async function readLocalImage(storagePath: string) {
  const resolved = path.resolve(LOCAL_DIR, storagePath);
  if (!resolved.startsWith(LOCAL_DIR + path.sep)) return null;
  return readFile(resolved).catch(() => null);
}
