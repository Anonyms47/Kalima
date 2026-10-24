"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bang } from "@/components/brand";
import { useCart, type CartLine } from "@/components/cart/cart-context";
import { useQuote } from "@/components/cart/use-quote";
import { CheckoutSteps } from "@/components/checkout-steps";
import { ArrowIcon, BackIcon, CheckIcon, TrashIcon, WhatsappIcon } from "@/components/icons";
import { Note } from "@/components/note";
import { Stepper } from "@/components/stepper";
import { formatPrice } from "@/lib/format";
import { MAX_BOXES_PER_LINE } from "@/lib/pricing";

const DELIVERY_NOTE = "Livraison non comprise. Les modalités seront convenues sur WhatsApp après votre commande.";

function formatLine(line: CartLine) {
  return line.units ? `${line.formatLabel} · ${line.units} ${line.unitLabel ?? "pièce"}${line.units > 1 ? "s" : ""}` : line.formatLabel;
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
      <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-16 text-center sm:px-6">
        {undo ? <div className="mb-10 w-full text-left">{undo}</div> : null}
        <Note className="w-full max-w-sm">Votre panier attend sa première gourmandise…</Note>
        <h1 className="display mt-12 text-4xl">Votre panier est vide</h1>
        <p className="mt-3 text-muted">Composez une boîte de gaufres ou de mini pancakes pour commencer.</p>
        <Link href="/gourmandises" className="btn-primary mt-8">
          Voir les gourmandises <ArrowIcon />
        </Link>
      </div>
    );
  }

  return (
    <div data-hide-footer-cta className="mx-auto w-full max-w-5xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <CheckoutSteps current={1} />
      <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="display text-4xl sm:text-5xl">Mon panier</h1>
        <p className="text-muted">
          {boxes} boîte{boxes > 1 ? "s" : ""} · {lines.length} article{lines.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-8">
        <div className="space-y-4">
          {undo}
          <ul className="space-y-4">
            {lines.map((line, index) => {
              const q = quote?.lines[index];
              return (
                <li key={line.key} className={`card p-4 sm:p-5 ${q && !q.ok ? "border-danger/50" : ""}`}>
                  <div className="flex gap-4">
                    <Link
                      href={`/gourmandises/${line.slug}`}
                      tabIndex={-1}
                      aria-hidden
                      className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-2xl bg-mist sm:w-28"
                    >
                      {line.image ? <Image src={line.image} alt="" fill sizes="7rem" className="object-cover" /> : null}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/gourmandises/${line.slug}`} className="display text-xl leading-tight hover:text-violet sm:text-2xl">
                            {line.name}
                          </Link>
                          <p className="mt-1 text-sm text-muted">{formatLine(line)}</p>
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
                      <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Suppléments">
                        {line.supplementNames.length === 0 ? (
                          <li className="inline-flex items-center gap-1 rounded-full bg-mist px-2.5 py-1 text-xs font-semibold text-night/70">
                            <CheckIcon className="size-3.5 text-violet" /> Sans supplément
                          </li>
                        ) : null}
                        {line.supplementNames.map((name) => (
                          <li key={name} className="rounded-full bg-kraft-soft px-2.5 py-1 text-xs font-semibold text-kraft-deep">
                            + {name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                    <Stepper
                      size="sm"
                      value={line.boxes}
                      min={1}
                      max={MAX_BOXES_PER_LINE}
                      onChange={(v) => setBoxes(line.key, v)}
                      label={`Nombre de boîtes de ${line.name}`}
                    />
                    <p className="tabular text-right">
                      <span className="block text-xs text-muted">
                        {q?.ok ? `${line.boxes} × ${formatPrice(q.boxPrice)}` : " "}
                      </span>
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
          <Link href="/gourmandises" className="inline-flex items-center gap-2 px-1 py-2 text-sm font-semibold text-violet hover:underline">
            <BackIcon className="size-4" /> Ajouter d&apos;autres gourmandises
          </Link>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="p-6">
              <h2 className="display text-2xl">Récapitulatif</h2>
              <dl className="tabular mt-4 space-y-2.5 text-[0.95rem]">
                {lines.map((line, index) => {
                  const q = quote?.lines[index];
                  return (
                    <div key={line.key} className="flex justify-between gap-4">
                      <dt className="min-w-0 truncate text-muted">
                        {line.boxes} × {line.name}
                      </dt>
                      <dd className="shrink-0">{q?.ok ? formatPrice(q.lineTotal) : "—"}</dd>
                    </div>
                  );
                })}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Livraison</dt>
                  <dd className="shrink-0 text-muted">À convenir</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
                  <dt className="font-semibold">Total produits</dt>
                  <dd className="display text-3xl" aria-live="polite">
                    {total}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 rounded-xl bg-kraft-soft px-4 py-3 text-sm leading-relaxed text-kraft-deep">{DELIVERY_NOTE}</p>
              {quote && !quote.ok ? (
                <p className="mt-4 text-sm font-medium text-danger">Corrigez les lignes signalées pour continuer.</p>
              ) : null}
              <Link
                href="/commande"
                aria-disabled={!canCheckout}
                className={`btn-primary mt-5 w-full ${!canCheckout ? "pointer-events-none opacity-50" : ""}`}
              >
                Passer commande <ArrowIcon />
              </Link>
            </div>
            <ul className="space-y-2 border-t border-line bg-mist/60 px-6 py-4 text-sm text-night/80">
              <li className="flex items-center gap-2">
                <Bang className="h-4 w-2.5 shrink-0 text-lilac" /> Préparé à la commande, avec un petit mot dans chaque boîte
              </li>
              <li className="flex items-center gap-2">
                <WhatsappIcon className="size-4 shrink-0 text-[#1f7a4d]" /> Livraison ou retrait organisés ensemble sur WhatsApp
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Téléphone : total et bouton toujours à portée de pouce. */}
      <div data-sticky-cta className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:hidden">
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
