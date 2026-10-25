"use client";

import { useState } from "react";
import { WhatsappIcon } from "@/components/icons";
import { Receipt } from "@/components/receipt";
import { Stepper } from "@/components/stepper";
import { whatsappUrl } from "@/lib/whatsapp";

const MAX_QUANTITY = 200;

type Props = { sweet: string[]; salty: string[]; whatsappNumber: string };

function Side({ title, note, items, quantities, onChange, tilt }: { title: string; note: string; items: string[]; quantities: Record<string, number>; onChange: (item: string, value: number) => void; tilt: string }) {
  if (items.length === 0) return null;
  return (
    <fieldset className={`relative rounded-[1.3rem] border border-[#efe4d2] bg-paper px-5 pt-7 pb-4 shadow-[var(--shadow-soft)] sm:px-6 ${tilt}`}>
      <span aria-hidden className="absolute -top-3 left-8 h-6 w-20 -rotate-3 rounded-sm bg-lilac/80" />
      <legend className="sr-only">{title}</legend>
      <p aria-hidden className="display text-2xl">{title}</p>
      <p className="hand text-lg text-violet">{note}</p>
      <ul className="mt-3 divide-y-2 divide-dotted divide-kraft/35">
        {items.map((item) => {
          const value = quantities[item] ?? 0;
          return (
            <li key={item} className="flex items-center justify-between gap-3 py-2.5">
              <span className={`font-semibold ${value ? "text-night" : "text-night/75"}`}>{item}</span>
              <Stepper value={value} min={0} max={MAX_QUANTITY} onChange={(v) => onChange(item, v)} label={`Quantité : ${item}`} size="sm" />
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

export function FamilyBoxComposer({ sweet, salty, whatsappNumber }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [guests, setGuests] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  const chosen = (items: string[]) => items.filter((item) => (quantities[item] ?? 0) > 0).map((item) => ({ item, quantity: quantities[item] }));
  const chosenSweet = chosen(sweet);
  const chosenSalty = chosen(salty);
  const pieces = [...chosenSweet, ...chosenSalty].reduce((sum, c) => sum + c.quantity, 0);
  const ready = pieces > 0 || note.trim().length > 0;

  function setQuantity(item: string, value: number) {
    setQuantities((current) => ({ ...current, [item]: value }));
  }

  const dateLabel = date
    ? new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`))
    : "";
  const message = [
    "Bonjour KALIMA ! Je voudrais composer une box famille :",
    chosenSweet.length ? `\nCôté sucré :\n${chosenSweet.map((c) => `- ${c.quantity} × ${c.item}`).join("\n")}` : "",
    chosenSalty.length ? `\nCôté salé :\n${chosenSalty.map((c) => `- ${c.quantity} × ${c.item}`).join("\n")}` : "",
    guests || dateLabel ? `\n${[guests ? `Pour ${guests} personnes` : "", dateLabel ? `le ${dateLabel}` : ""].filter(Boolean).join(", ")}.` : "",
    note.trim() ? `\nPrécisions : ${note.trim()}` : "",
    "\nPouvez-vous me donner le prix et la disponibilité ? Merci !",
  ]
    .filter(Boolean)
    .join("\n");
  const sendUrl = whatsappUrl(whatsappNumber, message);
  const talkUrl = whatsappUrl(whatsappNumber, "Bonjour KALIMA ! J'aimerais une box famille, pouvez-vous m'aider à la composer ?");

  const sendButton = (className: string) =>
    ready && sendUrl ? (
      <a href={sendUrl} target="_blank" rel="noopener noreferrer" className={`btn-whatsapp ${className}`}>
        <WhatsappIcon /> Envoyer ma composition
      </a>
    ) : (
      <button type="button" disabled className={`btn-whatsapp ${className}`}>
        <WhatsappIcon /> Envoyer ma composition
      </button>
    );

  return (
    <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
      <div className="space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
          <Side title="Côté sucré" note="pour les gourmands" items={sweet} quantities={quantities} onChange={setQuantity} tilt="md:-rotate-[0.6deg]" />
          <Side title="Côté salé" note="pour l'apéro" items={salty} quantities={quantities} onChange={setQuantity} tilt="md:rotate-[0.6deg]" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="guests" className="field-label">Pour combien de personnes ? <span className="font-normal text-muted">(facultatif)</span></label>
            <input id="guests" type="number" min={1} inputMode="numeric" value={guests} onChange={(e) => setGuests(e.target.value.replace(/\D/g, "").slice(0, 4))} className="field" />
          </div>
          <div>
            <label htmlFor="date" className="field-label">Pour quand ? <span className="font-normal text-muted">(facultatif)</span></label>
            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="note" className="field-label">Une envie en plus ? <span className="font-normal text-muted">(facultatif)</span></label>
            <textarea id="note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Une sauce, un thème, une autre gourmandise…" className="field" />
          </div>
        </div>
      </div>

      <aside aria-labelledby="ma-box" className="lg:sticky lg:top-24">
        <Receipt title="Ma box famille" titleId="ma-box" barcode={null} thanks={false} className="rotate-[0.6deg]">
          {pieces === 0 ? (
            <p className="hand py-3 text-center text-xl text-muted">choisissez vos quantités…</p>
          ) : (
            <div className="space-y-3 text-[0.95rem]">
              {[
                { title: "Sucré", rows: chosenSweet },
                { title: "Salé", rows: chosenSalty },
              ].map((group) =>
                group.rows.length ? (
                  <div key={group.title}>
                    <p className="text-xs font-bold tracking-[0.18em] text-kraft-deep uppercase">{group.title}</p>
                    <ul className="mt-1 space-y-1">
                      {group.rows.map((c) => (
                        <li key={c.item} className="flex items-baseline gap-2">
                          <span className="tabular w-10 shrink-0 font-semibold">{c.quantity} ×</span>
                          <span>{c.item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
            </div>
          )}
          <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-dashed border-night/25 pt-3">
            <span className="text-sm font-bold tracking-[0.14em] uppercase">Prix</span>
            <span className="hand text-2xl text-violet">sur WhatsApp</span>
          </div>
        </Receipt>
        <div className="mt-6 hidden lg:block">
          {sendButton("w-full text-base")}
          <p className="mt-3 text-center text-sm text-muted">Le message est prérempli : rien n&apos;est envoyé sans vous.</p>
        </div>
        {talkUrl ? (
          <p className="mt-5 text-center">
            <span className="hand text-xl text-night/70">vous préférez en discuter ? </span>
            <a href={talkUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-violet underline decoration-lilac decoration-2 underline-offset-4 hover:decoration-violet">
              Écrire sur WhatsApp
            </a>
          </p>
        ) : null}
      </aside>

      {/* Barre d'envoi fixée en bas sur téléphone */}
      <div data-sticky-cta className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-dashed border-kraft/50 bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <p className="shrink-0 leading-tight">
            <span className="hand block text-lg text-kraft-deep">ma box</span>
            <span className="display tabular text-xl">{pieces} pièce{pieces > 1 ? "s" : ""}</span>
          </p>
          {sendButton("flex-1")}
        </div>
      </div>
    </div>
  );
}
