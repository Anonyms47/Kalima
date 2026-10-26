"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { activateAmbassador } from "@/lib/server/referrals";

export type ProfileState = { ok?: boolean; error?: string };

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const firstName = String(formData.get("firstName") ?? "").trim().slice(0, 60);
  const lastName = String(formData.get("lastName") ?? "").trim().slice(0, 60);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 30);
  if (!firstName) return { error: "Indiquez votre prénom." };
  await sql`
    update users set first_name = ${firstName}, last_name = ${lastName || null}, phone = ${phone || null}, updated_at = now()
    where id = ${user.id}`;
  revalidatePath("/compte");
  return { ok: true };
}

export async function activateAmbassadorAction(formData: FormData) {
  const user = await requireUser("/compte/ambassadeur");
  // Le code est construit à partir du prénom (KALI + prénom) : on l'enregistre d'abord s'il manque.
  const firstName = String(formData.get("firstName") ?? "").trim().slice(0, 60);
  if (firstName && firstName !== user.firstName) {
    await sql`update users set first_name = ${firstName}, updated_at = now() where id = ${user.id}`;
  }
  await activateAmbassador(user.id);
  redirect("/compte/ambassadeur");
}
