"use client";

import { useActionState, useState } from "react";
import { cancelOrderAction, declarePaymentAction, type CustomerActionState } from "./actions";

const initial: CustomerActionState = {};

export function DeclarePaymentButton({ reference }: { reference: string }) {
  const [state, action, pending] = useActionState(declarePaymentAction, initial);
  return (
    <form action={action}>
      <input type="hidden" name="reference" value={reference} />
      <button type="submit" disabled={pending} className="btn-ghost w-full">
        {pending ? "Un instant…" : "J'ai effectué le paiement"}
      </button>
      {state.error ? <p role="alert" className="mt-2 text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}

export function CancelOrderButton({ reference }: { reference: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(cancelOrderAction, initial);
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-sm font-semibold text-danger hover:underline">
        Annuler cette commande
      </button>
    );
  }
  return (
    <form action={action} className="rounded-2xl border border-danger/30 bg-danger-soft p-4">
      <input type="hidden" name="reference" value={reference} />
      <p className="text-sm font-medium text-danger">Annuler la commande {reference} ? Cette action est définitive.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className="btn btn-sm bg-danger text-white">
          {pending ? "Annulation…" : "Oui, annuler"}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="btn-ghost btn-sm">
          Garder ma commande
        </button>
      </div>
      {state.error ? <p role="alert" className="mt-2 text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
