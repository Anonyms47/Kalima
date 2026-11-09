"use client";

import { useState } from "react";

// Vercel refuse toute requête de plus de 4,5 Mo : une photo de téléphone en taille d'origine en pèse déjà 3 à 6.
// On les réduit donc ici, dans le navigateur, avant l'envoi (1600 px de large, comme le fait ensuite le serveur).
const MAX_SIDE = 1600;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;

async function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function shrink(file: File): Promise<File> {
  if (file.size < 500 * 1024 && (file.type === "image/jpeg" || file.type === "image/webp")) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    // WebP quand le navigateur le sait, JPEG sinon (anciens Safari).
    let blob = await toBlob(canvas, "image/webp", 0.85);
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", 0.85);
    if (!blob || blob.size >= file.size) return file;
    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${extension}`, { type: blob.type });
  } catch {
    // Format que le navigateur ne sait pas lire (HEIC sur certains appareils) : le serveur essaiera tel quel.
    return file;
  }
}

/** Champ « photos » qui prépare les images avant l'envoi et bloque le formulaire tant que ce n'est pas fini. */
export function PhotoInput() {
  const [note, setNote] = useState("");

  async function prepare(input: HTMLInputElement) {
    const chosen = Array.from(input.files ?? []);
    if (chosen.length === 0) {
      input.setCustomValidity("");
      setNote("");
      return;
    }
    input.setCustomValidity("Patientez : les photos sont en préparation.");
    setNote("Préparation des photos…");
    const files = await Promise.all(chosen.map(shrink));
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    input.files = transfer.files;
    const total = files.reduce((sum, file) => sum + file.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      const message = "Ces photos sont trop lourdes pour un seul envoi : ajoutez-en moins à la fois (2 ou 3).";
      input.setCustomValidity(message);
      setNote(message);
      return;
    }
    input.setCustomValidity("");
    const mo = (total / (1024 * 1024)).toFixed(1).replace(".", ",");
    setNote(`${files.length} photo${files.length > 1 ? "s" : ""} prête${files.length > 1 ? "s" : ""} (${mo} Mo).`);
  }

  return (
    <>
      <input
        id="photos"
        name="photos"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        required
        onChange={(event) => void prepare(event.currentTarget)}
        className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-night file:px-4 file:py-2 file:font-semibold file:text-white"
      />
      {note ? <p role="status" className="text-xs font-medium text-violet-deep">{note}</p> : null}
    </>
  );
}
