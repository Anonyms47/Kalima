"use server";

import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/server/auth";
import { createEventRequest, type EventFieldErrors, type EventRequestInput } from "@/lib/server/events";
import { rateLimit } from "@/lib/server/rate-limit";

export type EventFormState = {
  ok?: boolean;
  reference?: string;
  error?: string;
  errors?: EventFieldErrors;
  values?: Partial<EventRequestInput>;
};

const FIELDS: (keyof EventRequestInput)[] = ["name", "phone", "email", "occasion", "eventDate", "location", "guests", "productsWanted", "details"];

export async function requestEventAction(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const values = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")])) as EventRequestInput;
  // Champ piège invisible : les robots le remplissent, pas les personnes.
  if (String(formData.get("website") ?? "")) return { ok: true, reference: "—" };
  const ip = ((await headers()).get("x-forwarded-for") ?? "inconnue").split(",")[0].trim();
  if (!(await rateLimit(`event:${ip}`, 5, 60 * 60))) {
    return { error: "Trop de demandes envoyées. Réessayez plus tard ou écrivez-nous sur WhatsApp.", values };
  }
  const user = await getCurrentUser();
  const result = await createEventRequest(user?.id ?? null, values);
  if (!result.ok) return { errors: result.errors, values, error: "Quelques informations manquent : vérifiez les champs signalés." };
  return { ok: true, reference: result.reference };
}
