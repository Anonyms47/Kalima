"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart, type CartLine } from "@/components/cart/cart-context";
import { useQuote } from "@/components/cart/use-quote";
import { CheckoutSteps } from "@/components/checkout-steps";
import { CurlyArrow } from "@/components/doodles";
import { Receipt, ReceiptLine, ReceiptTotal } from "@/components/receipt";
import { ArrowIcon, TrashIcon } from "@/components/icons";
import { Stepper } from "@/components/stepper";
import { formatPrice } from "@/lib/format";
import { readPetitMot } from "@/lib/petit-mot";
import { MAX_BOXES_PER_LINE } from "@/lib/pricing";

const DELIVERY_NOTE = "Livraison non comprise. Les modalités seront convenues sur WhatsApp après votre commande.";

function formatLine(line: CartLine) {
  return line.units ? `${line.formatLabel} · ${line.units} ${line.unitLabel ?? "pièce"}${line.units > 1 ? "s" : ""}` : line.formatLabel;
}

/** Le petit mot écrit sur l'accueil, ou une invitation à en glisser un. */
function PetitMotReminder() {
  const [text, setText] = useState("");
  useEffect(() => {
    // Lecture différée : le stockage local n'existe qu'au navigateur.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(readPetitMot());
  }, []);

  if (text) {
    return (
      <figure className="note-card rotate-[-1deg] !pt-8 !pb-4">
        <blockquote className="hand text-[1.5rem] leading-[2rem] text-violet">{text}</blockquote>
        <figcaption className="mt-2 text-right text-xs text-muted">Votre petit mot, modifiable à l&apos;étape suivante</figcaption>
      </figure>
    );
  }
  return (
    <div className="rounded-[1.2rem] border-2 border-dashed border-kraft/60 bg-paper px-5 py-4">
      <p className="hand text-2xl text-kraft-deep">Un petit mot à glisser dans la boîte ?</p>
      <p className="mt-1 text-sm text-night/70">Vous pourrez l&apos;écrire à l&apos;étape suivante, ou nous laisser le choisir.</p>
    </div>
  );
}

export function CartView() {
  const { lines, ready, setBoxes, remove, restore } = useCart();
  const { quote, loading } = useQuote(lines, ready);
  const [removed, setRemoved] = useState<{ line: CartLine; index: number } | null>(null);

  // Le bouton « Annuler » reste proposé quelques secondes après un retrait.
  useEffect(() => {
    if (!removed) return;
    const timer = window.setTimeout(() => setRemoved(null), 7000);
    return () => window.clearTimeout(timer);
  }, [removed]);

  if (!ready) {
    return <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6" aria-busy="true" />;
  }

  const boxes = lines.reduce((s, l) => s + l.boxes, 0);
  const canCheckout = Boolean(quote?.ok) && !loading;
  const total = quote ? formatPrice(quote.total) : "…";

  const undo = removed ? (
    <div role="status" className="flex items-center justify-between gap-3 rounded-2xl bg-night px-4 py-3 text-sm text-white">
      <span>
        <strong>{removed.line.name}</strong> retiré du panier.
      </span>
      <button
        type="button"
        onClick={() => {
          restore(removed.line, removed.index);
          setRemoved(null);
        }}
        className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 font-semibold transition hover:bg-white/25"
      >
        Annuler
      </button>
    </div>
  ) : null;

  if (lines.length === 0) {
    return (
      <div data-hide-footer-cta className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
        <div className="order-2 md:order-1">
          {undo ? <div className="mb-8">{undo}</div> : null}
          <h1 className="display text-4xl sm:text-5xl">Votre panier est vide</h1>
          <p className="mt-4 max-w-sm text-lg leading-relaxed text-night/75">
            Gaufres ou mini pancakes, avec les suppléments de votre choix : on prépare tout à la commande.
          </p>
          <Link href="/gourmandises" className="kraft-label mt-8">
            Voir la carte <ArrowIcon className="size-5" />
          </Link>
        </div>
        <figure className="relative order-1 mx-auto w-full max-w-[19rem] rotate-[3deg] bg-white p-3 pb-12 shadow-[var(--shadow-lift)] md:order-2">
          <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-3 rounded-sm bg-lilac/80" />
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image src="/photos/gamme-boites-ouvertes.jpg" alt="Boîtes KALIMA ouvertes" fill sizes="19rem" className="object-cover" />
          </div>
          <figcaption className="hand absolute right-4 bottom-3 text-2xl text-night/80">elles n&apos;attendent que vous</figcaption>
        </figure>
      </div>
    );
  }

  return (
    <div data-hide-footer-cta className="mx-auto w-full max-w-5xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <CheckoutSteps current={1} />
      <div className="mt-5 flex flex-wrap items-end gap-x-5 gap-y-1">
        <h1 className="display text-4xl sm:text-5xl">Mon panier</h1>
        <p className="hand -rotate-2 pb-1 text-2xl text-violet">
          {boxes} boîte{boxes > 1 ? "s" : ""} en préparation
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.45fr_1fr] lg:gap-10">
        <div className="space-y-5">
          {undo}
          <ul className="space-y-5">
            {lines.map((line, index) => {
              const q = quote?.lines[index];
              return (
                <li
                  key={line.key}
                  className={`rounded-[1.4rem] border bg-white p-4 shadow-[var(--shadow-soft)] sm:p-5 ${q && !q.ok ? "border-danger/50" : "border-line/80"}`}
                >
                  <div className="flex gap-4 sm:gap-5">
                    <Link
                      href={`/gourmandises/${line.slug}`}
                      tabIndex={-1}
                      aria-hidden
                      className={`block w-20 shrink-0 bg-white p-1.5 pb-4 shadow-[var(--shadow-lift)] sm:w-24 ${index % 2 ? "rotate-[3deg]" : "-rotate-[3deg]"}`}
                    >
                      <span className="relative block aspect-square overflow-hidden bg-mist">
                        {line.image ? <Image src={line.image} alt="" fill sizes="6rem" className="object-cover" /> : null}
                      </span>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/gourmandises/${line.slug}`} className="display text-[1.4rem] leading-tight hover:text-violet sm:text-2xl">
                            {line.name}
                          </Link>
                          <p className="mt-0.5 text-sm text-muted">{formatLine(line)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRemoved({ line, index });
                            remove(line.key);
                          }}
                          className="-mt-1 -mr-1 grid size-10 shrink-0 place-items-center rounded-full text-muted transition hover:bg-danger-soft hover:text-danger"
                          aria-label={`Retirer ${line.name} du panier`}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                      {line.supplementNames.length ? (
                        <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Suppléments">
                          {line.supplementNames.map((name) => (
                            <li key={name} className="rounded-md bg-kraft-soft px-2 py-0.5 text-xs font-semibold text-kraft-deep">
                              + {name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="hand mt-1.5 text-lg text-violet/70">sans supplément</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-line pt-4">
                    <Stepper
                      size="sm"
                      value={line.boxes}
                      min={1}
                      max={MAX_BOXES_PER_LINE}
                      onChange={(v) => setBoxes(line.key, v)}
                      label={`Nombre de boîtes de ${line.name}`}
                    />
                    <p className="tabular text-right">
                      <span className="block text-xs text-muted">{q?.ok ? `${line.boxes} × ${formatPrice(q.boxPrice)}` : " "}</span>
                      <span className="text-lg font-bold">{q?.ok ? formatPrice(q.lineTotal) : loading ? "…" : "—"}</span>
                    </p>
                  </div>
                  {q && !q.ok ? (
                    <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                      {q.error}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <PetitMotReminder />

          <Link href="/gourmandises" className="hand inline-flex items-center gap-1 text-2xl text-violet hover:underline">
            ← encore une petite envie ?
          </Link>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Receipt title="Récapitulatif">
            <dl className="space-y-2.5 text-[0.95rem]">
              {lines.map((line, index) => {
                const q = quote?.lines[index];
                return <ReceiptLine key={line.key} label={`${line.boxes} × ${line.name}`} value={q?.ok ? formatPrice(q.lineTotal) : "—"} />;
              })}
              <ReceiptLine label="Livraison" value="à convenir" muted />
              <ReceiptTotal label="Total" value={total} />
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-kraft-deep">{DELIVERY_NOTE}</p>
            {quote && !quote.ok ? <p className="mt-3 text-sm font-medium text-danger">Corrigez les lignes signalées pour continuer.</p> : null}
            <Link
              href="/commande"
              aria-disabled={!canCheckout}
              className={`btn-primary mt-5 w-full ${!canCheckout ? "pointer-events-none opacity-50" : ""}`}
            >
              Passer commande <ArrowIcon />
            </Link>
          </Receipt>
          <p className="hand mt-6 hidden items-start gap-2 text-xl leading-snug text-night/70 lg:flex">
            <CurlyArrow className="h-10 w-12 shrink-0 -scale-x-100 text-lilac" />
            préparé à la commande, réglé en une fois, on s&apos;organise ensemble sur WhatsApp
          </p>
        </aside>
      </div>

      {/* Téléphone : total et bouton toujours à portée de pouce. */}
      <div data-sticky-cta className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-dashed border-kraft/50 bg-paper/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <p className="tabular leading-tight">
            <span className="block text-xs text-muted">
              Total · {boxes} boîte{boxes > 1 ? "s" : ""}
            </span>
            <span className="display text-xl">{total}</span>
          </p>
          <Link
            href="/commande"
            aria-disabled={!canCheckout}
            tabIndex={canCheckout ? undefined : -1}
            className={`btn-primary flex-1 sm:flex-none ${!canCheckout ? "pointer-events-none opacity-50" : ""}`}
          >
            Commander <ArrowIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}
