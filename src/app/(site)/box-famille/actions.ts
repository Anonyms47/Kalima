"use server";

import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/server/auth";
import { createFamilyBoxRequest, type FamilyBoxFieldErrors } from "@/lib/server/family-box";
import { rateLimit } from "@/lib/server/rate-limit";

export type FamilyBoxFormState = { ok?: boolean; reference?: string; error?: string; errors?: FamilyBoxFieldErrors };

export async function requestFamilyBoxAction(_prev: FamilyBoxFormState, formData: FormData): Promise<FamilyBoxFormState> {
  // Champ piège invisible : les robots le remplissent, pas les personnes.
  if (String(formData.get("website") ?? "")) return { ok: true, reference: "—" };
  const ip = ((await headers()).get("x-forwarded-for") ?? "inconnue").split(",")[0].trim();
  if (!(await rateLimit(`family-box:${ip}`, 5, 60 * 60))) {
    return { error: "Trop de demandes envoyées. Réessayez plus tard ou écrivez-nous sur WhatsApp." };
  }
  let quantities: Record<string, number> = {};
  try {
    const parsed = JSON.parse(String(formData.get("quantities") ?? "{}"));
    if (parsed && typeof parsed === "object") quantities = parsed;
  } catch {
    // Composition illisible : traitée comme vide, la validation le signale.
  }
  const user = await getCurrentUser();
  const result = await createFamilyBoxRequest(user?.id ?? null, {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    guests: String(formData.get("guests") ?? ""),
    wantedDate: String(formData.get("wantedDate") ?? ""),
    note: String(formData.get("note") ?? ""),
    quantities,
  });
  if (!result.ok) return { errors: result.errors, error: "Quelques informations manquent : vérifiez les champs signalés." };
  return { ok: true, reference: result.reference };
}
