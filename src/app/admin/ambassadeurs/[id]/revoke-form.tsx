"use client";

import { revokeReferralAction } from "@/lib/actions/admin/other";
import { ActionForm } from "../../_components/action-form";

export function RevokeForm({ ambassadorId, referredId }: { ambassadorId: string; referredId: string }) {
  return (
    <details>
      <summary className="cursor-pointer text-xs font-semibold text-danger">Retirer…</summary>
      <ActionForm action={revokeReferralAction} className="mt-2 space-y-2">
        {(pending) => (
          <>
            <input type="hidden" name="ambassadorId" value={ambassadorId} />
            <input type="hidden" name="referredId" value={referredId} />
            <label className="sr-only" htmlFor={`reason-${referredId}`}>Raison</label>
            <input id={`reason-${referredId}`} name="reason" required placeholder="Raison (doublon, erreur…)" className="field !py-2 text-sm" />
            <button type="submit" disabled={pending} className="btn btn-sm bg-danger text-white">Retirer ce parrainage</button>
          </>
        )}
      </ActionForm>
    </details>
  );
}
