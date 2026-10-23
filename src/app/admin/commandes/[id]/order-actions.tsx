"use client";

import { transitionOrderAction } from "@/lib/actions/admin/orders";
import type { Fulfillment, OrderStatus } from "@/lib/order-status";
import { formatPrice } from "@/lib/format";
import { ActionForm } from "../../_components/action-form";

type Props = {
  orderId: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  kind: "standard" | "reward";
  total: number;
  paid: boolean;
};

function Step({ orderId, to, label, hint, tone = "primary" }: { orderId: string; to: OrderStatus; label: string; hint: string; tone?: "primary" | "violet" }) {
  return (
    <ActionForm action={transitionOrderAction} className="space-y-2">
      {(pending) => (
        <>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="to" value={to} />
          <button type="submit" disabled={pending} className={`${tone === "violet" ? "btn-violet" : "btn-primary"} w-full text-base`}>
            {pending ? "Enregistrement…" : label}
          </button>
          <p className="text-center text-xs text-muted">{hint}</p>
        </>
      )}
    </ActionForm>
  );
}

function CancelForm({ orderId, paid, label = "Annuler la commande" }: { orderId: string; paid: boolean; label?: string }) {
  return (
    <details className="group rounded-2xl border border-line">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-danger">{label}…</summary>
      <ActionForm action={transitionOrderAction} className="space-y-3 border-t border-line p-4">
        {(pending) => (
          <>
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="to" value="cancelled" />
            <label htmlFor={`cancel-note-${orderId}`} className="field-label">Raison {paid ? "(obligatoire)" : "(facultatif)"}</label>
            <textarea id={`cancel-note-${orderId}`} name="note" rows={2} required={paid} className="field" />
            {paid ? <p className="text-xs text-muted">Commande déjà payée : le remboursement éventuel se fait hors du site puis s&apos;enregistre ici.</p> : null}
            <button type="submit" disabled={pending} className="btn btn-sm bg-danger text-white">Confirmer l&apos;annulation</button>
          </>
        )}
      </ActionForm>
    </details>
  );
}

export function OrderActions({ orderId, status, fulfillment, kind, total, paid }: Props) {
  if (status === "awaiting_payment" || status === "expired") {
    return (
      <div className="space-y-4">
        <ActionForm action={transitionOrderAction}>
          {(pending) => (
            <>
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="to" value="confirmed" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="paidAmount" className="field-label">Montant reçu (FCFA)</label>
                  <input id="paidAmount" name="paidAmount" inputMode="numeric" defaultValue={total} required className="field tabular" />
                </div>
                <div>
                  <label htmlFor="paymentReference" className="field-label">Référence de transaction</label>
                  <input id="paymentReference" name="paymentReference" className="field" placeholder="Facultatif" />
                </div>
              </div>
              <div>
                <label htmlFor="pay-note" className="field-label">Note <span className="font-normal text-muted">(obligatoire si le montant diffère)</span></label>
                <input id="pay-note" name="note" className="field" />
              </div>
              <label className="flex items-start gap-3 rounded-xl bg-mist p-3 text-sm">
                <input type="checkbox" required className="mt-0.5 size-5 accent-[var(--color-violet)]" />
                <span>J&apos;ai vérifié dans l&apos;application de paiement que {formatPrice(total)} ont bien été reçus pour cette commande.</span>
              </label>
              <button type="submit" disabled={pending} className="btn-primary w-full text-base">
                {pending ? "Enregistrement…" : "Confirmer le paiement"}
              </button>
              <p className="text-center text-xs text-muted">La commande devient confirmée et le client reçoit l&apos;e-mail « Paiement reçu ».</p>
            </>
          )}
        </ActionForm>
        <CancelForm orderId={orderId} paid={false} />
      </div>
    );
  }
  if (status === "reward_requested") {
    return (
      <div className="space-y-4">
        <Step orderId={orderId} to="confirmed" label="Valider la box offerte" hint="Le client reçoit l'e-mail de confirmation de sa box." tone="violet" />
        <CancelForm orderId={orderId} paid={false} label="Refuser la demande (la récompense redevient disponible)" />
      </div>
    );
  }
  if (status === "confirmed") {
    return (
      <div className="space-y-4">
        <Step orderId={orderId} to="in_production" label="La confection commence" hint="À signaler au vrai début de la préparation : le client est prévenu par e-mail." />
        <CancelForm orderId={orderId} paid={paid} />
      </div>
    );
  }
  if (status === "in_production") {
    return (
      <div className="space-y-4">
        {fulfillment === "delivery" ? (
          <Step orderId={orderId} to="out_for_delivery" label="Remise au livreur" hint="Le client reçoit l'e-mail « Commande en route »." />
        ) : (
          <Step orderId={orderId} to="ready_for_pickup" label="Prête à être retirée" hint="Le client reçoit les instructions de retrait." />
        )}
        <CancelForm orderId={orderId} paid={paid} />
      </div>
    );
  }
  if (status === "out_for_delivery") {
    return <Step orderId={orderId} to="delivered" label="Livraison confirmée" hint="À cliquer quand la réception est confirmée. Le client reçoit un remerciement." />;
  }
  if (status === "ready_for_pickup") {
    return <Step orderId={orderId} to="picked_up" label="Remise au client" hint="Le client reçoit un remerciement." />;
  }
  if (kind === "standard" && paid && (status === "delivered" || status === "picked_up" || status === "cancelled")) {
    return (
      <details className="rounded-2xl border border-line">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold">Enregistrer un remboursement…</summary>
        <ActionForm action={transitionOrderAction} className="space-y-3 border-t border-line p-4">
          {(pending) => (
            <>
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="to" value="refunded" />
              <div>
                <label htmlFor="refundedAmount" className="field-label">Montant remboursé (FCFA)</label>
                <input id="refundedAmount" name="refundedAmount" inputMode="numeric" required className="field tabular" />
              </div>
              <div>
                <label htmlFor="refund-note" className="field-label">Raison</label>
                <textarea id="refund-note" name="note" rows={2} required className="field" />
              </div>
              <p className="text-xs text-muted">Le remboursement se fait hors du site. Un parrainage lié à cette commande est retiré.</p>
              <button type="submit" disabled={pending} className="btn-primary btn-sm">Enregistrer le remboursement</button>
            </>
          )}
        </ActionForm>
      </details>
    );
  }
  return <p className="text-sm text-muted">Aucune action à faire sur cette commande.</p>;
}
