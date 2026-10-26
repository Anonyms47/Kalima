"use client";

import { addStaffAction } from "@/lib/actions/admin/other";
import { ActionForm } from "../_components/action-form";

export function AddStaffForm() {
  return (
    <ActionForm action={addStaffAction} resetOnSuccess>
      {(pending) => (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="displayName" className="field-label">Prénom</label>
              <input id="displayName" name="displayName" required className="field" />
            </div>
            <div>
              <label htmlFor="email" className="field-label">E-mail</label>
              <input id="email" name="email" type="email" required className="field" />
            </div>
          </div>
          <button type="submit" disabled={pending} className="btn-primary btn-sm">Donner l&apos;accès</button>
        </>
      )}
    </ActionForm>
  );
}
