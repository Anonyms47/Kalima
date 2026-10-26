"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/server/auth";
import { createOrder, OrderError } from "@/lib/server/orders";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().max(64),
        formatId: z.string().max(64),
        units: z.number().int().nullable(),
        boxes: z.number().int(),
        supplementIds: z.array(z.string().max(64)).max(20),
      }),
    )
    .min(1)
    .max(20),
  fulfillment: z.enum(["delivery", "pickup"]),
  name: z.string().max(200),
  phone: z.string().max(60),
  deliveryArea: z.string().max(300).nullable(),
  note: z.string().max(2000).nullable(),
  giftMessage: z.string().max(1000).nullable(),
  referralCode: z.string().max(40).nullable(),
});

export type PlaceOrderResult = { ok: true; reference: string } | { ok: false; error: string };

export async function placeOrderAction(input: z.infer<typeof schema>): Promise<PlaceOrderResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Votre session a expiré. Reconnectez-vous pour valider la commande." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Certaines informations sont invalides. Vérifiez le formulaire." };
  try {
    const order = await createOrder(user, parsed.data);
    return { ok: true, reference: order.reference };
  } catch (error) {
    if (error instanceof OrderError) return { ok: false, error: error.message };
    console.error("Création de commande impossible", error);
    return { ok: false, error: "Un problème technique empêche d'enregistrer la commande. Réessayez dans un instant." };
  }
}
