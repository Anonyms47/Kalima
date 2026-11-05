"use client";

import { useActionState, useState } from "react";
import { Stepper } from "@/components/stepper";
import { unitsRange } from "@/lib/pricing";
import type { Format } from "@/lib/server/catalog";
import { claimRewardAction, type ClaimState } from "./actions";

type Option = { productId: string; productName: string; format: Format; available: boolean };

export function ClaimForm({ rewardId, options, defaults }: { rewardId: string; options: Option[]; defaults: { name: string; phone: string } }) {
  const [state, action, pending] = useActionState(claimRewardAction, {} as ClaimState);
  const firstAvailable = options.find((o) => o.available);
  const [choice, setChoice] = useState(firstAvailable ? `${firstAvailable.productId}:${firstAvailable.format.id}` : "");
  const selected = options.find((o) => `${o.productId}:${o.format.id}` === choice);
  const range = selected ? unitsRange(selected.format) : { min: 1, max: 1 };
  const [units, setUnits] = useState(range.min);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="rewardId" value={rewardId} />
      {state.error ? <p role="alert" className="rounded-2xl bg-danger-soft px-5 py-4 font-medium text-danger">{state.error}</p> : null}
      <fieldset className="card space-y-3 p-6">
        <legend className="sr-only">Box choisie</legend>
        <h2 className="display text-2xl" aria-hidden>Ma box</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((o) => (
            <label key={`${o.productId}:${o.format.id}`} className={`rounded-2xl border-2 border-line p-4 transition has-[:checked]:border-violet has-[:checked]:bg-lilac-soft/60 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-lilac ${o.available ? "cursor-pointer hover:border-violet/50" : "opacity-50"}`}>
              <input type="radio" name="choice" value={`${o.productId}:${o.format.id}`} checked={choice === `${o.productId}:${o.format.id}`} disabled={!o.available} onChange={() => { setChoice(`${o.productId}:${o.format.id}`); setUnits(unitsRange(o.format).min); }} className="sr-only" />
              <span className="display block text-xl">{o.productName}</span>
              <span className="block text-sm text-muted">{o.format.label}{o.available ? "" : " · indisponible pour le moment"}</span>
            </label>
          ))}
        </div>
        {selected?.format.pricing === "per_unit" ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mist p-4">
            <p className="font-semibold">Nombre de {selected.format.unit_label}s</p>
            <Stepper value={units} min={range.min} max={range.min} onChange={setUnits} label={`${selected.format.unit_label}s`} />
            <input type="hidden" name="units" value={units} />
            <p className="w-full text-sm text-muted">La box offerte correspond au format minimum.</p>
          </div>
        ) : null}
      </fieldset>

      <fieldset className="card space-y-4 p-6">
        <legend className="sr-only">Réception et coordonnées</legend>
        <h2 className="display text-2xl" aria-hidden>Réception</h2>
        <div className="grid grid-cols-2 gap-3">
          {(["delivery", "pickup"] as const).map((value) => (
            <label key={value} className="cursor-pointer rounded-2xl border-2 border-line p-4 text-center font-semibold transition has-[:checked]:border-violet has-[:checked]:bg-lilac-soft/60 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-lilac">
              <input type="radio" name="fulfillment" value={value} checked={fulfillment === value} onChange={() => setFulfillment(value)} className="sr-only" />
              {value === "delivery" ? "Livraison" : "Retrait"}
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="field-label">Nom</label>
            <input id="name" name="name" defaultValue={defaults.name} required className="field" />
          </div>
          <div>
            <label htmlFor="phone" className="field-label">WhatsApp</label>
            <input id="phone" name="phone" type="tel" defaultValue={defaults.phone} required className="field" />
          </div>
        </div>
        {fulfillment === "delivery" ? (
          <div>
            <label htmlFor="deliveryArea" className="field-label">Quartier <span className="font-normal text-muted">(facultatif)</span></label>
            <input id="deliveryArea" name="deliveryArea" className="field" />
          </div>
        ) : null}
        <div>
          <label htmlFor="note" className="field-label">Précision <span className="font-normal text-muted">(facultatif)</span></label>
          <textarea id="note" name="note" rows={2} className="field" />
        </div>
      </fieldset>

      <button type="submit" disabled={pending || !selected} className="btn-primary w-full text-base sm:w-auto">
        {pending ? "Envoi…" : "Envoyer ma demande"}
      </button>
    </form>
  );
}
