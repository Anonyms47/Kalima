"use client";

import { useActionState } from "react";
import { Note } from "@/components/note";
import { requestEventAction, type EventFormState } from "./actions";

const OCCASIONS = ["Anniversaire", "Baptême", "Mariage", "Fête de famille", "Événement d'entreprise", "Autre"];

export function EventForm({ defaults }: { defaults: { name: string; phone: string; email: string } }) {
  const [state, action, pending] = useActionState(requestEventAction, {} as EventFormState);
  const v = state.values ?? {};
  const err = state.errors ?? {};

  if (state.ok) {
    return (
      <div className="rise flex flex-col items-center py-6 text-center" role="status">
        <Note className="w-full max-w-sm" signature="KALIMA">Merci ! Votre demande est bien arrivée.</Note>
        <p className="display mt-10 text-2xl">Demande {state.reference}</p>
        <p className="mt-3 max-w-md text-muted">
          Ce n&apos;est pas encore une réservation : nous vérifions la disponibilité pour votre date, puis nous revenons vers vous sur WhatsApp avec un devis.
        </p>
      </div>
    );
  }

  const field = (name: keyof NonNullable<EventFormState["errors"]>) => ({
    id: name,
    name,
    "aria-invalid": Boolean(err[name]),
    "aria-describedby": err[name] ? `${name}-error` : undefined,
  });
  const error = (name: keyof NonNullable<EventFormState["errors"]>) =>
    err[name] ? <p id={`${name}-error`} className="mt-1.5 text-sm font-medium text-danger">{err[name]}</p> : null;

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error ? <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 font-medium text-danger">{state.error}</p> : null}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Site web</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="field-label">Nom</label>
          <input {...field("name")} required autoComplete="name" defaultValue={v.name ?? defaults.name} className="field" />
          {error("name")}
        </div>
        <div>
          <label htmlFor="phone" className="field-label">WhatsApp</label>
          <input {...field("phone")} type="tel" required autoComplete="tel" defaultValue={v.phone ?? defaults.phone} className="field" />
          {error("phone")}
        </div>
      </div>
      <div>
        <label htmlFor="email" className="field-label">E-mail</label>
        <input {...field("email")} type="email" required autoComplete="email" defaultValue={v.email ?? defaults.email} className="field" />
        {error("email")}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="occasion" className="field-label">Occasion</label>
          <select {...field("occasion")} required defaultValue={v.occasion ?? ""} className="field">
            <option value="" disabled>Choisir…</option>
            {OCCASIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
          {error("occasion")}
        </div>
        <div>
          <label htmlFor="eventDate" className="field-label">Date</label>
          <input {...field("eventDate")} type="date" required defaultValue={v.eventDate ?? ""} className="field" />
          {error("eventDate")}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
        <div>
          <label htmlFor="location" className="field-label">Lieu</label>
          <input {...field("location")} required defaultValue={v.location ?? ""} placeholder="Quartier, salle…" className="field" />
          {error("location")}
        </div>
        <div>
          <label htmlFor="guests" className="field-label">Personnes</label>
          <input {...field("guests")} type="number" min={1} inputMode="numeric" defaultValue={v.guests ?? ""} className="field" />
          {error("guests")}
        </div>
      </div>
      <div>
        <label htmlFor="productsWanted" className="field-label">Produits et quantités souhaités</label>
        <textarea {...field("productsWanted")} rows={3} required defaultValue={v.productsWanted ?? ""} placeholder="Ex. 60 gaufres, 50 mini pancakes au caramel…" className="field" />
        <p className="field-hint">Minimum 50 pièces par variété.</p>
        {error("productsWanted")}
      </div>
      <div>
        <label htmlFor="details" className="field-label">Précisions <span className="font-normal text-muted">(facultatif)</span></label>
        <textarea {...field("details")} rows={3} defaultValue={v.details ?? ""} placeholder="Horaire, thème, installation sur place souhaitée…" className="field" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full text-base sm:w-auto">
        {pending ? "Envoi…" : "Demander une réservation"}
      </button>
      <p className="text-sm text-muted">L&apos;envoi de ce formulaire ne réserve pas automatiquement la date.</p>
    </form>
  );
}
