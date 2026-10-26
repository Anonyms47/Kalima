"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/server/auth";
import { cancelByCustomer, declarePayment, OrderError } from "@/lib/server/orders";

export type CustomerActionState = { error?: string; done?: boolean };

export async function declarePaymentAction(_prev: CustomerActionState, formData: FormData): Promise<CustomerActionState> {
  const reference = String(formData.get("reference") ?? "");
  const user = await requireUser(`/compte/commandes/${reference}`);
  try {
    await declarePayment(user.id, reference);
  } catch (error) {
    return { error: error instanceof OrderError ? error.message : "Action impossible pour le moment." };
  }
  revalidatePath(`/compte/commandes/${reference}`);
  return { done: true };
}

export async function cancelOrderAction(_prev: CustomerActionState, formData: FormData): Promise<CustomerActionState> {
  const reference = String(formData.get("reference") ?? "");
  const user = await requireUser(`/compte/commandes/${reference}`);
  try {
    await cancelByCustomer(user.id, reference);
  } catch (error) {
    return { error: error instanceof OrderError ? error.message : "Action impossible pour le moment." };
  }
  revalidatePath(`/compte/commandes/${reference}`);
  return { done: true };
}
