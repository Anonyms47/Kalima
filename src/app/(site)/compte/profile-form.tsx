"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileState } from "./actions";

export function ProfileForm({ firstName, lastName, phone }: { firstName: string; lastName: string; phone: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, {} as ProfileState);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="field-label">Prénom</label>
          <input id="firstName" name="firstName" defaultValue={firstName} autoComplete="given-name" required className="field" />
        </div>
        <div>
          <label htmlFor="lastName" className="field-label">Nom</label>
          <input id="lastName" name="lastName" defaultValue={lastName} autoComplete="family-name" className="field" />
        </div>
      </div>
      <div>
        <label htmlFor="phone" className="field-label">WhatsApp</label>
        <input id="phone" name="phone" type="tel" defaultValue={phone} autoComplete="tel" className="field" />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-ghost btn-sm">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {state.ok ? <p role="status" className="text-sm font-medium text-success">Informations enregistrées.</p> : null}
        {state.error ? <p role="alert" className="text-sm font-medium text-danger">{state.error}</p> : null}
      </div>
    </form>
  );
}
