"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { WhatsappIcon } from "@/components/icons";
import { Receipt } from "@/components/receipt";
import { Stepper } from "@/components/stepper";
import { whatsappUrl } from "@/lib/whatsapp";
import { requestFamilyBoxAction, type FamilyBoxFormState } from "./actions";

const MAX_QUANTITY = 200;

type Props = { sweet: string[]; salty: string[]; whatsappNumber: string; defaults: { name: string; phone: string } };

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

export function FamilyBoxComposer({ sweet, salty, whatsappNumber, defaults }: Props) {
  const [state, action, pending] = useActionState(requestFamilyBoxAction, {} as FamilyBoxFormState);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [guests, setGuests] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const err = state.errors ?? {};
  const confirmation = useRef<HTMLDivElement>(null);

  // La demande part depuis le bas de la page : on remonte jusqu'à la confirmation.
  useEffect(() => {
    if (state.ok) confirmation.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state.ok]);

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
  const talkUrl = whatsappUrl(whatsappNumber, "Bonjour KALIMA ! J'aimerais une box famille, pouvez-vous m'aider à la composer ?");

  // Demande enregistrée : KALIMA la retrouve dans l'administration et y fixe le prix.
  if (state.ok) {
    const message = [
      `Bonjour KALIMA ! Je viens de vous envoyer ma box famille ${state.reference} :`,
      chosenSweet.length ? `\nCôté sucré :\n${chosenSweet.map((c) => `- ${c.quantity} × ${c.item}`).join("\n")}` : "",
      chosenSalty.length ? `\nCôté salé :\n${chosenSalty.map((c) => `- ${c.quantity} × ${c.item}`).join("\n")}` : "",
      guests || dateLabel ? `\n${[guests ? `Pour ${guests} personnes` : "", dateLabel ? `le ${dateLabel}` : ""].filter(Boolean).join(", ")}.` : "",
      note.trim() ? `\nPrécisions : ${note.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const sendUrl = whatsappUrl(whatsappNumber, message);
    return (
      <div ref={confirmation} role="status" className="rise mx-auto mt-12 flex max-w-xl scroll-mt-28 flex-col items-center text-center">
        <span className="inline-flex -rotate-6 flex-col items-center rounded-lg border-[3px] border-violet px-5 py-1.5 text-violet">
          <span className="display text-xl tracking-[0.18em]">DEMANDE REÇUE</span>
          <span className="tabular text-xs font-semibold">{state.reference}</span>
        </span>
        <p className="hand mt-8 text-3xl text-violet">merci, on s&apos;en occupe !</p>
        <p className="mt-3 leading-relaxed text-night/75">
          Votre box famille est bien enregistrée. KALIMA vous répond sur WhatsApp avec le prix et la disponibilité.
        </p>
        {sendUrl ? (
          <a href={sendUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-7">
            <WhatsappIcon /> Envoyer aussi sur WhatsApp
          </a>
        ) : null}
        <p className="mt-2 text-sm text-muted">Facultatif : pour aller plus vite, le message est déjà prêt.</p>
      </div>
    );
  }

  const submit = (className: string) => (
    <button type="submit" disabled={pending || !ready} className={`btn-primary ${className}`}>
      {pending ? "Envoi…" : "Envoyer ma demande"}
    </button>
  );

  return (
    <form action={action} noValidate className="mt-12 grid items-start gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
      <input type="hidden" name="quantities" value={JSON.stringify(quantities)} />
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Site web</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
          <Side title="Côté sucré" note="pour les gourmands" items={sweet} quantities={quantities} onChange={setQuantity} tilt="md:-rotate-[0.6deg]" />
          <Side title="Côté salé" note="pour l'apéro" items={salty} quantities={quantities} onChange={setQuantity} tilt="md:rotate-[0.6deg]" />
        </div>
        {err.items ? <p className="text-sm font-medium text-danger">{err.items}</p> : null}

        <div className="grid gap-5 sm:grid-cols-2 [&>*]:min-w-0">
          <div>
            <label htmlFor="name" className="field-label">Votre nom</label>
            <input id="name" name="name" required autoComplete="name" defaultValue={defaults.name} aria-invalid={Boolean(err.name)} aria-describedby={err.name ? "name-error" : undefined} className="field" />
            {err.name ? <p id="name-error" className="mt-1.5 text-sm font-medium text-danger">{err.name}</p> : null}
          </div>
          <div>
            <label htmlFor="phone" className="field-label">WhatsApp</label>
            <input id="phone" name="phone" type="tel" required autoComplete="tel" defaultValue={defaults.phone} aria-invalid={Boolean(err.phone)} aria-describedby={err.phone ? "phone-error" : undefined} className="field" />
            {err.phone ? <p id="phone-error" className="mt-1.5 text-sm font-medium text-danger">{err.phone}</p> : null}
          </div>
          <div>
            <label htmlFor="guests" className="field-label">Pour combien de personnes ? <span className="font-normal text-muted">(facultatif)</span></label>
            <input id="guests" name="guests" type="number" min={1} inputMode="numeric" value={guests} onChange={(e) => setGuests(e.target.value.replace(/\D/g, "").slice(0, 4))} aria-invalid={Boolean(err.guests)} className="field" />
            {err.guests ? <p className="mt-1.5 text-sm font-medium text-danger">{err.guests}</p> : null}
          </div>
          <div>
            <label htmlFor="wantedDate" className="field-label">Pour quand ? <span className="font-normal text-muted">(facultatif)</span></label>
            <input id="wantedDate" name="wantedDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={Boolean(err.wantedDate)} className="field" />
            {err.wantedDate ? <p className="mt-1.5 text-sm font-medium text-danger">{err.wantedDate}</p> : null}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="note" className="field-label">Une envie en plus ? <span className="font-normal text-muted">(facultatif)</span></label>
            <textarea id="note" name="note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Une sauce, un thème, une autre gourmandise…" className="field" />
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
            <span className="hand text-2xl text-violet">donné sur WhatsApp</span>
          </div>
        </Receipt>
        {state.error ? (
          <p role="alert" className="mt-5 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {state.error}
          </p>
        ) : null}
        <div className="mt-6 hidden lg:block">
          {submit("w-full text-base")}
          <p className="mt-3 text-center text-sm text-muted">KALIMA reçoit votre composition et vous répond sur WhatsApp avec le prix.</p>
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
            <span className="display tabular text-xl">
              {pieces} pièce{pieces > 1 ? "s" : ""}
            </span>
          </p>
          {submit("flex-1")}
        </div>
      </div>
    </form>
  );
}
