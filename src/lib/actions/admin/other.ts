"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/server/audit";
import { EMAIL_PATTERN, normalizeEmail, requireStaff, staffActor } from "@/lib/server/auth";
import { sql } from "@/lib/server/db";
import { DEPOSIT_RATE, EVENT_STATUS_LABELS, type EventStatus } from "@/lib/server/events";
import { revokeReferralForOrder, syncRewards } from "@/lib/server/referrals";
import { saveSetting, type Settings } from "@/lib/server/settings";
import type { ActionResult } from "./types";

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

// --- Événements --------------------------------------------------------------

export async function updateEventAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  const id = String(formData.get("eventId") ?? "");
  const status = String(formData.get("status") ?? "") as EventStatus;
  if (!(status in EVENT_STATUS_LABELS)) return { error: "Statut inconnu." };
  const quoteRaw = String(formData.get("quoteAmount") ?? "").replace(/\s/g, "");
  const quote = quoteRaw ? Number(quoteRaw) : null;
  if (quote !== null && (!Number.isInteger(quote) || quote < 0)) return { error: "Le devis doit être un montant entier en FCFA." };
  const depositPaid = formData.get("depositPaid") === "on";
  if ((status === "deposit_received" || status === "confirmed") && !depositPaid) {
    return { error: "Cochez « Acompte reçu » après l'avoir vérifié, avant de confirmer l'événement." };
  }
  const deposit = quote !== null ? Math.round(quote * DEPOSIT_RATE) : null;
  await sql`
    update event_requests set status = ${status}, quote_amount = ${quote}, deposit_amount = ${deposit},
      deposit_paid_at = case when ${depositPaid} then coalesce(deposit_paid_at, now()) else null end,
      internal_notes = ${text(formData, "internalNotes", 4000)}, updated_at = now()
    where id = ${id}`;
  await audit(sql, staffActor(staff), "event.updated", "event", id, { status, quote, depositPaid });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Demande mise à jour." };
}

// --- Ambassadeurs --------------------------------------------------------------

export async function revokeReferralAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  const ambassadorId = String(formData.get("ambassadorId") ?? "");
  const referredId = String(formData.get("referredId") ?? "");
  const reason = text(formData, "reason", 300);
  if (!reason) return { error: "Indiquez la raison de la correction." };
  const actor = staffActor(staff);
  await sql.begin(async (tx) => {
    const [row] = await tx<{ qualifying_order_id: string }[]>`
      select qualifying_order_id from referrals where ambassador_user_id = ${ambassadorId} and referred_user_id = ${referredId} and revoked_at is null`;
    if (row) await revokeReferralForOrder(tx, row.qualifying_order_id, `Correction : ${reason}`, actor);
  });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Parrainage retiré. La correction est inscrite au journal." };
}

export async function restoreReferralAction(formData: FormData) {
  const staff = await requireStaff();
  const ambassadorId = String(formData.get("ambassadorId") ?? "");
  const referredId = String(formData.get("referredId") ?? "");
  const actor = staffActor(staff);
  await sql.begin(async (tx) => {
    await tx`select user_id from ambassadors where user_id = ${ambassadorId} for update`;
    await tx`update referrals set revoked_at = null, revoked_reason = null, revoked_by = null
      where ambassador_user_id = ${ambassadorId} and referred_user_id = ${referredId}`;
    await audit(tx, actor, "referral.restored", "ambassador", ambassadorId, { referredId });
    await syncRewards(tx, ambassadorId, actor);
  });
  revalidatePath("/admin", "layout");
}

export async function setAmbassadorActiveAction(formData: FormData) {
  const staff = await requireStaff();
  const id = String(formData.get("ambassadorId") ?? "");
  const active = formData.get("active") === "true";
  await sql`update ambassadors set active = ${active} where user_id = ${id}`;
  await audit(sql, staffActor(staff), active ? "ambassador.enabled" : "ambassador.disabled", "ambassador", id, {});
  revalidatePath("/admin", "layout");
}

// --- Paramètres --------------------------------------------------------------

export async function saveSettingsAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  const paymentLink = text(formData, "paymentLink", 500);
  if (paymentLink && !/^https:\/\/\S+$/.test(paymentLink)) return { error: "Le lien de paiement doit commencer par https://" };
  const minutes = Number(formData.get("reservationMinutes"));
  if (!Number.isInteger(minutes) || minutes < 15 || minutes > 7 * 24 * 60) return { error: "Durée de réservation : entre 15 minutes et 7 jours." };
  const contactEmail = text(formData, "contactEmail", 120);
  if (contactEmail && !EMAIL_PATTERN.test(contactEmail)) return { error: "L'e-mail de contact est invalide." };
  const policy = formData.get("rewardPolicy") === "not_included" ? "not_included" : "undecided";

  const values: Partial<Settings> = {
    contact: {
      phone: text(formData, "phone", 40),
      whatsapp_number: text(formData, "whatsappNumber", 20).replace(/\D/g, ""),
      whatsapp_link: text(formData, "whatsappLink", 200),
      instagram: text(formData, "instagram", 60).replace(/^@/, ""),
      email: contactEmail,
    },
    hours: text(formData, "hours", 120),
    pickup: { area: text(formData, "pickupArea", 80), details: text(formData, "pickupDetails", 500) },
    payment: { provider: "manual_link", link: paymentLink, label: text(formData, "paymentLabel", 60), instructions: text(formData, "paymentInstructions", 1000) },
    reservation_minutes: minutes,
    orders_open: formData.get("ordersOpen") === "on",
    announcement: text(formData, "announcement", 200),
    home_note: text(formData, "homeNote", 200),
    reward_supplements_policy: policy,
    food_info: text(formData, "foodInfo", 6000),
    sales_terms: text(formData, "salesTerms", 20000),
  };
  await sql.begin(async (tx) => {
    for (const [key, value] of Object.entries(values)) {
      await saveSetting(tx, key as keyof Settings, value as never, staff.id);
    }
    await audit(tx, staffActor(staff), "settings.updated", "settings", null, { payment_link: paymentLink ? "renseigné" : "vide", orders_open: values.orders_open });
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Paramètres enregistrés." };
}

// --- Équipe --------------------------------------------------------------

export async function addStaffAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  if (staff.staff.role !== "owner") return { error: "Seule la gérante peut gérer les accès." };
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const name = text(formData, "displayName", 60);
  if (!EMAIL_PATTERN.test(email) || !name) return { error: "Indiquez un e-mail valide et un prénom." };
  const [user] = await sql<{ id: string }[]>`
    insert into users (email, first_name) values (${email}, ${name})
    on conflict (email) do update set updated_at = now() returning id`;
  await sql`insert into staff (user_id, display_name, role) values (${user.id}, ${name}, 'manager')
    on conflict (user_id) do update set display_name = excluded.display_name, active = true`;
  await audit(sql, staffActor(staff), "staff.added", "staff", user.id, { email });
  revalidatePath("/admin/equipe");
  return { ok: true, message: `Accès créé pour ${email}. La personne se connecte avec un code reçu par e-mail.` };
}

export async function setStaffActiveAction(formData: FormData) {
  const staff = await requireStaff();
  if (staff.staff.role !== "owner") return;
  const userId = String(formData.get("userId") ?? "");
  if (userId === staff.id) return;
  const active = formData.get("active") === "true";
  await sql`update staff set active = ${active} where user_id = ${userId} and role <> 'owner'`;
  if (!active) await sql`delete from sessions where user_id = ${userId}`;
  await audit(sql, staffActor(staff), active ? "staff.enabled" : "staff.disabled", "staff", userId, {});
  revalidatePath("/admin/equipe");
}
