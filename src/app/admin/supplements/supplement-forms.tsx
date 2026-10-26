"use client";

import { saveSupplementAction } from "@/lib/actions/admin/products";
import type { Supplement } from "@/lib/server/catalog";
import { ActionForm } from "../_components/action-form";

export function SupplementForms({ supplements }: { supplements: Supplement[] }) {
  const blank = { id: "", name: "", price: 500, active: true, sort_order: 0 };
  return (
    <div className="space-y-3">
      {[...supplements, blank].map((s) => (
        <ActionForm key={s.id || "nouveau"} action={saveSupplementAction} resetOnSuccess={!s.id} className={`grid items-end gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-[2fr_1fr_auto_auto] ${s.id ? "border-line" : "border-dashed border-violet/40"}`}>
          {(pending) => (
            <>
              <input type="hidden" name="supplementId" value={s.id} />
              <div>
                <label className="field-label" htmlFor={`n-${s.id}`}>{s.id ? "Nom" : "Nouveau supplément"}</label>
                <input id={`n-${s.id}`} name="name" defaultValue={s.name} className="field" />
              </div>
              <div>
                <label className="field-label" htmlFor={`p-${s.id}`}>Prix par boîte</label>
                <input id={`p-${s.id}`} name="price" inputMode="numeric" defaultValue={s.price} className="field tabular" />
              </div>
              <label className="flex items-center gap-2 pb-3 text-sm font-semibold">
                <input type="checkbox" name="active" defaultChecked={s.active} className="size-5 accent-[var(--color-violet)]" /> Actif
              </label>
              <button type="submit" disabled={pending} className="btn-ghost btn-sm mb-1">{s.id ? "Enregistrer" : "Ajouter"}</button>
            </>
          )}
        </ActionForm>
      ))}
    </div>
  );
}
