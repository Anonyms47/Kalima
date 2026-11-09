"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/lib/order-status";
import { requireStaff, staffActor } from "@/lib/server/auth";
import { deliverNotification } from "@/lib/server/notifications";
import { OrderError, transitionOrder } from "@/lib/server/orders";
import type { ActionResult } from "./types";

const ALLOWED: OrderStatus[] = ["confirmed", "in_production", "out_for_delivery", "delivered", "ready_for_pickup", "picked_up", "cancelled", "refunded"];

function intOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").replace(/\s/g, "");
  return text ? Number(text) : null;
}

export async function transitionOrderAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  const orderId = String(formData.get("orderId") ?? "");
  const to = String(formData.get("to") ?? "") as OrderStatus;
  if (!ALLOWED.includes(to)) return { error: "Action inconnue." };
  try {
    const result = await transitionOrder(orderId, to, staffActor(staff), {
      note: String(formData.get("note") ?? ""),
      paidAmount: intOrNull(formData.get("paidAmount")),
      paymentReference: String(formData.get("paymentReference") ?? ""),
      refundedAmount: intOrNull(formData.get("refundedAmount")),
    });
    revalidatePath("/admin", "layout");
    if (!result.changed) return { ok: true, message: "Cette étape était déjà enregistrée : rien n'a été modifié." };
    if (!result.notificationId) return { ok: true, message: "Étape enregistrée." };
    // L'e-mail part maintenant ; son résultat réel est affiché (jamais supposé).
    const delivery = await deliverNotification(result.notificationId);
    if (delivery.status === "sent") return { ok: true, message: "Étape enregistrée et e-mail accepté par le service d'envoi." };
    return { ok: true, message: `Étape enregistrée, mais l'e-mail n'est pas parti : ${delivery.error ?? "envoi en attente"}. Il pourra être relancé.` };
  } catch (error) {
    if (error instanceof OrderError) return { error: error.message };
    console.error(error);
    return { error: "Erreur technique : l'étape n'a pas été enregistrée." };
  }
}

export async function resendNotificationAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireStaff();
  const id = String(formData.get("notificationId") ?? "");
  const result = await deliverNotification(id, { manual: true });
  revalidatePath("/admin", "layout");
  if (result.status === "sent") return { ok: true, message: "E-mail accepté par le service d'envoi." };
  if (result.status === "skipped") return { message: "Cet e-mail est déjà envoyé ou en cours d'envoi." };
  return { error: `Échec : ${result.error}` };
}
