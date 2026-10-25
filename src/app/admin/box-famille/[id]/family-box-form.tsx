"use client";

import { updateFamilyBoxAction } from "@/lib/actions/admin/other";
import type { FamilyBoxRow } from "@/lib/server/admin-queries";
import { ActionForm } from "../../_components/action-form";

const LABELS = {
  new: "Nouvelle demande",
  quoted: "Prix envoyé",
  confirmed: "Confirmée",
  delivered: "Livrée ou retirée",
  cancelled: "Annulée",
};

export function FamilyBoxAdminForm({ request }: { request: FamilyBoxRow }) {
  return (
    <ActionForm action={updateFamilyBoxAction}>
      {(pending) => (
        <>
          <input type="hidden" name="requestId" value={request.id} />
          <div>
            <label htmlFor="price" className="field-label">Prix de la box (FCFA)</label>
            <input id="price" name="price" inputMode="numeric" defaultValue={request.price ?? ""} placeholder="Ex. 25000" className="field tabular" />
            <p className="field-hint">Le prix que vous proposez au client. Il reste enregistré sur la demande.</p>
          </div>
          <div>
            <label htmlFor="status" className="field-label">Statut</label>
            <select id="status" name="status" defaultValue={request.status} className="field">
              {Object.entries(LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-line p-3 text-sm">
            <input type="checkbox" name="paid" defaultChecked={Boolean(request.paid_at)} className="mt-0.5 size-5 accent-[var(--color-violet)]" />
            <span>Paiement reçu et vérifié</span>
          </label>
          <div>
            <label htmlFor="internalNotes" className="field-label">Notes internes</label>
            <textarea id="internalNotes" name="internalNotes" rows={4} defaultValue={request.internal_notes} className="field" />
          </div>
          <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">{pending ? "Enregistrement…" : "Enregistrer"}</button>
        </>
      )}
    </ActionForm>
  );
}
