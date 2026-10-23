"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionResult } from "@/lib/actions/admin/types";

/** Formulaire d'administration avec retour visible (succès ou erreur). */
export function ActionForm({
  action,
  children,
  className = "space-y-4",
  resetOnSuccess = false,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  children: (pending: boolean) => ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className} key={resetOnSuccess && state.ok ? state.message : undefined}>
      {children(pending)}
      {state.error ? <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{state.error}</p> : null}
      {state.message && !state.error ? (
        <p role="status" className={`rounded-xl px-4 py-3 text-sm font-medium ${state.ok ? "bg-success-soft text-success" : "bg-mist text-night"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
