"use client";

import { useState } from "react";
import { updateEventAction } from "@/lib/actions/admin/other";
import { formatPrice } from "@/lib/format";
import type { EventRow } from "@/lib/server/admin-queries";
import { ActionForm } from "../../_components/action-form";

const LABELS = {
  new: "Nouvelle demande",
  in_discussion: "En discussion",
  quote_sent: "Devis envoyé",
  deposit_received: "Acompte reçu",
  confirmed: "Confirmé",
  declined: "Non retenu",
  completed: "Terminé",
};

export function EventAdminForm({ event }: { event: EventRow }) {
  const [quote, setQuote] = useState(event.quote_amount ? String(event.quote_amount) : "");
  const amount = Number(quote.replace(/\s/g, ""));
  return (
    <ActionForm action={updateEventAction}>
      {(pending) => (
        <>
          <input type="hidden" name="eventId" value={event.id} />
          <div>
            <label htmlFor="status" className="field-label">Statut</label>
            <select id="status" name="status" defaultValue={event.status} className="field">
              {Object.entries(LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="quoteAmount" className="field-label">Montant du devis (FCFA)</label>
            <input id="quoteAmount" name="quoteAmount" inputMode="numeric" value={quote} onChange={(e) => setQuote(e.target.value)} className="field tabular" />
            {amount > 0 ? <p className="field-hint">Acompte de 45 % : <strong className="tabular">{formatPrice(Math.round(amount * 0.45))}</strong> (à encaisser hors du site).</p> : null}
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-line p-3 text-sm">
            <input type="checkbox" name="depositPaid" defaultChecked={Boolean(event.deposit_paid_at)} className="mt-0.5 size-5 accent-[var(--color-violet)]" />
            <span>Acompte reçu et vérifié</span>
          </label>
          <div>
            <label htmlFor="internalNotes" className="field-label">Notes internes</label>
            <textarea id="internalNotes" name="internalNotes" rows={4} defaultValue={event.internal_notes} className="field" />
          </div>
          <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">{pending ? "Enregistrement…" : "Enregistrer"}</button>
        </>
      )}
    </ActionForm>
  );
}
