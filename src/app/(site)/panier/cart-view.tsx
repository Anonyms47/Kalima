"use client";

import Image from "next/image";
import Link from "next/link";
import { Bang } from "@/components/brand";
import { useCart } from "@/components/cart/cart-context";
import { lineDetail } from "@/components/cart/cart-line-summary";
import { useQuote } from "@/components/cart/use-quote";
import { ArrowIcon, TrashIcon } from "@/components/icons";
import { Note } from "@/components/note";
import { Stepper } from "@/components/stepper";
import { formatPrice } from "@/lib/format";
import { MAX_BOXES_PER_LINE } from "@/lib/pricing";

export function CartView() {
  const { lines, ready, setBoxes, remove } = useCart();
  const { quote, loading } = useQuote(lines, ready);

  if (!ready) {
    return <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6" aria-busy="true" />;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
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
    <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-20 sm:px-6">
      <p className="eyebrow"><Bang className="h-4 w-2.5 text-lilac" /> Étape 1 sur 3</p>
      <h1 className="display mt-3 text-5xl">Mon panier</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <ul className="space-y-4">
          {lines.map((line, index) => {
            const q = quote?.lines[index];
            return (
              <li key={line.key} className={`card flex gap-4 p-4 sm:p-5 ${q && !q.ok ? "border-danger/50" : ""}`}>
                <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-2xl bg-mist sm:w-24">
                  {line.image ? <Image src={line.image} alt="" fill sizes="6rem" className="object-cover" /> : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/gourmandises/${line.slug}`} className="display text-xl hover:text-violet">
                        {line.name}
                      </Link>
                      <p className="mt-0.5 text-sm text-muted">{lineDetail(line)}</p>
                    </div>
                    <button type="button" onClick={() => remove(line.key)} className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger" aria-label={`Retirer ${line.name} du panier`}>
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Stepper size="sm" value={line.boxes} min={1} max={MAX_BOXES_PER_LINE} onChange={(v) => setBoxes(line.key, v)} label={`Nombre de boîtes de ${line.name}`} />
                    <p className="tabular text-right">
                      <span className="block text-xs text-muted">{q?.ok ? `${formatPrice(q.boxPrice)} la boîte` : " "}</span>
                      <span className="font-semibold">{q?.ok ? formatPrice(q.lineTotal) : loading ? "…" : "—"}</span>
                    </p>
                  </div>
                  {q && !q.ok ? (
                    <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                      {q.error}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="display text-2xl">Récapitulatif</h2>
            <dl className="tabular mt-4 space-y-2">
              <div className="flex justify-between text-muted">
                <dt>Boîtes</dt>
                <dd>{lines.reduce((s, l) => s + l.boxes, 0)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-semibold">Total produits</dt>
                <dd className="display text-3xl" aria-live="polite">
                  {quote ? formatPrice(quote.total) : "…"}
                </dd>
              </div>
            </dl>
            <p className="mt-4 rounded-xl bg-kraft-soft px-4 py-3 text-sm leading-relaxed text-kraft-deep">
              Livraison non comprise. Les modalités seront convenues sur WhatsApp après votre commande.
            </p>
            {quote && !quote.ok ? (
              <p className="mt-4 text-sm font-medium text-danger">Corrigez les lignes signalées pour continuer.</p>
            ) : null}
            <Link
              href="/commande"
              aria-disabled={!quote?.ok || loading}
              className={`btn-primary mt-5 w-full ${!quote?.ok || loading ? "pointer-events-none opacity-50" : ""}`}
            >
              Passer commande <ArrowIcon />
            </Link>
            <Link href="/gourmandises" className="mt-3 block text-center text-sm font-semibold text-violet hover:underline">
              Ajouter d&apos;autres gourmandises
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
