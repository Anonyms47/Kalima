"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/server/auth";
import { claimReward, OrderError } from "@/lib/server/orders";

export type ClaimState = { error?: string };

export async function claimRewardAction(_prev: ClaimState, formData: FormData): Promise<ClaimState> {
  const user = await requireUser("/compte/ambassadeur");
  const [productId, formatId] = String(formData.get("choice") ?? "").split(":");
  const units = formData.get("units") ? Number(formData.get("units")) : null;
  const fulfillment = formData.get("fulfillment") === "pickup" ? "pickup" : "delivery";
  let reference: string;
  try {
    const order = await claimReward(user, {
      rewardId: String(formData.get("rewardId") ?? ""),
      productId: productId ?? "",
      formatId: formatId ?? "",
      units,
      fulfillment,
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      deliveryArea: String(formData.get("deliveryArea") ?? "") || null,
      note: String(formData.get("note") ?? "") || null,
    });
    reference = order.reference;
  } catch (error) {
    if (error instanceof OrderError) return { error: error.message };
    console.error(error);
    return { error: "Un problème technique empêche d'enregistrer la demande." };
  }
  redirect(`/compte/commandes/${reference}`);
}
