"use client";

import { useActionState } from "react";
import { resendNotificationAction } from "@/lib/actions/admin/orders";
import type { ActionResult } from "@/lib/actions/admin/types";

export function ResendButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(resendNotificationAction, {} as ActionResult);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="notificationId" value={id} />
      <button type="submit" disabled={pending} className="btn-ghost btn-sm">{pending ? "Envoi…" : "Relancer"}</button>
      {state.error ? <span role="alert" className="text-xs text-danger">{state.error}</span> : null}
      {state.message && !state.error ? <span role="status" className="text-xs text-success">{state.message}</span> : null}
    </form>
  );
}
