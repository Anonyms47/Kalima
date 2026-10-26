import "server-only";
import { EMAIL_PATTERN, normalizeEmail } from "./auth";
import { audit } from "./audit";
import { sql } from "./db";
import { nextRequestReference } from "./orders";

export const EVENT_STATUS_LABELS = {
  new: "Nouvelle demande",
  in_discussion: "En discussion",
  quote_sent: "Devis envoyé",
  deposit_received: "Acompte reçu",
  confirmed: "Confirmé",
  declined: "Non retenu",
  completed: "Terminé",
} as const;

export type EventStatus = keyof typeof EVENT_STATUS_LABELS;

export const DEPOSIT_RATE = 0.45;

export type EventRequestInput = {
  name: string;
  phone: string;
  email: string;
  occasion: string;
  eventDate: string;
  location: string;
  guests: string;
  productsWanted: string;
  details: string;
};

export type EventFieldErrors = Partial<Record<keyof EventRequestInput, string>>;

function todayInDakar() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Dakar" }).format(new Date());
}

export function validateEventRequest(input: EventRequestInput) {
  const errors: EventFieldErrors = {};
  const t = (v: string, max: number) => v.trim().slice(0, max);
  const data = {
    name: t(input.name, 80),
    phone: t(input.phone, 30),
    email: normalizeEmail(input.email),
    occasion: t(input.occasion, 80),
    eventDate: t(input.eventDate, 10),
    location: t(input.location, 160),
    guests: input.guests.trim() ? Number(input.guests) : null,
    productsWanted: t(input.productsWanted, 1000),
    details: t(input.details, 2000),
  };
  if (!data.name) errors.name = "Indiquez votre nom.";
  if (data.phone.replace(/\D/g, "").length < 9) errors.phone = "Indiquez un numéro WhatsApp valide.";
  if (!EMAIL_PATTERN.test(data.email)) errors.email = "Adresse e-mail invalide.";
  if (!data.occasion) errors.occasion = "Précisez l'occasion.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.eventDate)) errors.eventDate = "Choisissez une date.";
  else if (data.eventDate < todayInDakar()) errors.eventDate = "La date est déjà passée.";
  if (!data.location) errors.location = "Indiquez le lieu.";
  if (data.guests !== null && (!Number.isInteger(data.guests) || data.guests < 1 || data.guests > 5000)) errors.guests = "Nombre de personnes invalide.";
  if (!data.productsWanted) errors.productsWanted = "Dites-nous ce que vous souhaitez.";
  return { data, errors };
}

/** Enregistre une demande. Elle ne bloque aucune date : KALIMA confirme ensuite. */
export async function createEventRequest(userId: string | null, input: EventRequestInput) {
  const { data, errors } = validateEventRequest(input);
  if (Object.keys(errors).length) return { ok: false as const, errors };
  const [row] = await sql<{ id: string; reference: string }[]>`
    insert into event_requests (reference, user_id, name, phone, email, occasion, event_date, location, guests, products_wanted, details)
    values (${await nextRequestReference(sql, "EV")}, ${userId}, ${data.name}, ${data.phone}, ${data.email}, ${data.occasion}, ${data.eventDate},
      ${data.location}, ${data.guests}, ${data.productsWanted}, ${data.details || null})
    returning id, reference`;
  await audit(sql, { userId, label: data.name }, "event.requested", "event", row.id, { reference: row.reference });
  return { ok: true as const, reference: row.reference };
}
