"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { ArrowIcon, CheckIcon } from "@/components/icons";
import { Receipt, ReceiptLine, ReceiptTotal } from "@/components/receipt";
import { Stepper } from "@/components/stepper";
import type { Availability } from "@/lib/availability";
import { formatPrice } from "@/lib/format";
import { boxBasePrice, boxPrice, MAX_BOXES_PER_LINE, unitsRange } from "@/lib/pricing";
import type { Format, Supplement } from "@/lib/server/catalog";

type Props = {
  product: { id: string; slug: string; name: string; image: string | null; formats: Format[]; supplements: Supplement[] };
  availability: Availability;
  ordersOpen: boolean;
};

export function ProductConfigurator({ product, availability, ordersOpen }: Props) {
  const { add } = useCart();
  const [formatId, setFormatId] = useState(product.formats[0]?.id);
  const format = product.formats.find((f) => f.id === formatId) ?? product.formats[0];
  const range = format ? unitsRange(format) : { min: 1, max: 1 };
  const [units, setUnits] = useState(range.min);
  const [selected, setSelected] = useState<string[]>([]);
  const [boxes, setBoxes] = useState(1);
  const [added, setAdded] = useState(false);

  if (!format) return null;

  const perUnit = format.pricing === "per_unit";
  const effectiveUnits = perUnit ? Math.min(Math.max(units, range.min), range.max) : null;
  const chosen = product.supplements.filter((s) => selected.includes(s.id));
  const base = boxBasePrice(format, effectiveUnits);
  const oneBox = boxPrice(format, effectiveUnits, chosen);
  const maxBoxes = Math.min(MAX_BOXES_PER_LINE, availability.orderable && availability.maxBoxes !== null ? availability.maxBoxes : MAX_BOXES_PER_LINE);
  const canOrder = availability.orderable && ordersOpen;

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  function addToCart() {
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      formatId: format.id,
      formatLabel: format.label,
      units: effectiveUnits,
      unitLabel: perUnit ? format.unit_label : null,
      supplementIds: chosen.map((s) => s.id),
      supplementNames: chosen.map((s) => s.name),
      boxes: Math.min(boxes, maxBoxes),
      boxPrice: oneBox,
    });
    setAdded(true);
    setSelected([]);
    setBoxes(1);
  }

  const stepCount = product.supplements.length ? 3 : 2;
  const total = oneBox * Math.min(boxes, maxBoxes);

  return (
    <div className="mt-10 space-y-9">
      {/* 1. Format ------------------------------------------------------- */}
      <fieldset>
        <StepLegend n={1} hint={perUnit ? `minimum ${range.min} par boîte` : "selon votre faim"}>
          {perUnit && product.formats.length === 1 ? "Votre boîte" : "Choisissez le format"}
        </StepLegend>
        {product.formats.length > 1 ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {product.formats.map((f) => (
              <label
                key={f.id}
                className="relative cursor-pointer rounded-[1.1rem] border-2 border-dashed border-kraft/60 bg-paper p-4 transition hover:border-violet/50 has-[:checked]:-rotate-1 has-[:checked]:border-solid has-[:checked]:border-violet has-[:checked]:bg-white has-[:checked]:shadow-[var(--shadow-soft)] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-lilac"
              >
                <input type="radio" name="format" value={f.id} checked={f.id === format.id} onChange={() => setFormatId(f.id)} className="peer sr-only" />
                <span className="display block text-lg">{f.label}</span>
                <span className="tabular mt-1 block font-semibold text-kraft-deep">
                  {f.pricing === "per_unit" ? `${formatPrice(f.price)} / ${f.unit_label}` : formatPrice(f.price)}
                </span>
                <span aria-hidden className="absolute -top-3 -right-2 hidden size-8 rotate-12 place-items-center rounded-full bg-violet text-white peer-checked:grid">
                  <CheckIcon className="size-4" />
                </span>
              </label>
            ))}
          </div>
        ) : null}
        {perUnit ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.1rem] border-2 border-dashed border-kraft/60 bg-paper px-4 py-3.5">
            <div>
              <p className="font-semibold">Nombre de {format.unit_label}s dans la boîte</p>
              <p className="tabular text-sm text-kraft-deep">{formatPrice(format.price)} l&apos;unité</p>
            </div>
            <Stepper value={effectiveUnits ?? range.min} min={range.min} max={range.max} onChange={setUnits} label={`${format.unit_label}s par boîte`} />
          </div>
        ) : null}
      </fieldset>

      {/* 2. Suppléments : des étiquettes kraft à accrocher à la boîte ---- */}
      {product.supplements.length ? (
        <fieldset>
          <StepLegend n={2} hint="facultatif">
            Des suppléments ?
          </StepLegend>
          <p className="mt-1 pl-14 text-sm text-muted">500 FCFA chacun, appliqué à chaque boîte de cette sélection.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {product.supplements.map((s, index) => {
              const on = selected.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.id)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-lg border-2 border-dashed border-kraft/70 bg-paper px-3.5 text-[0.95rem] font-semibold transition hover:border-kraft-deep aria-pressed:border-solid aria-pressed:border-kraft aria-pressed:bg-kraft aria-pressed:shadow-[var(--shadow-soft)] ${
                    index % 3 === 0 ? "aria-pressed:-rotate-2" : index % 3 === 1 ? "aria-pressed:rotate-1" : "aria-pressed:rotate-2"
                  }`}
                >
                  {on ? <CheckIcon className="size-4" /> : <span aria-hidden className="text-kraft-deep">+</span>}
                  {s.name}
                  <span className={`tabular text-xs ${on ? "text-night/75" : "text-muted"}`}>{formatPrice(s.price)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {/* 3. Nombre de boîtes ------------------------------------------- */}
      <fieldset>
        <StepLegend n={stepCount} last hint="même format, mêmes suppléments">
          Combien de boîtes identiques ?
        </StepLegend>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Stepper value={Math.min(boxes, maxBoxes)} min={1} max={Math.max(1, maxBoxes)} onChange={setBoxes} label="Nombre de boîtes" />
          {availability.orderable && availability.maxBoxes !== null ? (
            <p className="inline-flex -rotate-3 rounded-md border-2 border-warning/70 px-2.5 py-0.5 text-sm font-bold tracking-wide text-warning uppercase">
              Plus que {availability.maxBoxes} boîte{availability.maxBoxes > 1 ? "s" : ""} disponible{availability.maxBoxes > 1 ? "s" : ""}
            </p>
          ) : null}
        </div>
      </fieldset>

      {/* Détail du prix, sur un ticket --------------------------------- */}
      <Receipt title="Votre boîte" barcode={null} thanks={false} className="mx-auto max-w-md rotate-[0.6deg]">
        <dl className="space-y-2 text-[0.95rem]">
          <ReceiptLine label={perUnit ? `${effectiveUnits} ${format.unit_label}s × ${formatPrice(format.price)}` : format.label} value={formatPrice(base)} />
          {chosen.map((s) => (
            <ReceiptLine key={s.id} label={`+ ${s.name}`} value={formatPrice(s.price)} />
          ))}
          <ReceiptLine label={<span className="font-semibold">Prix d&apos;une boîte</span>} value={<span className="font-semibold">{formatPrice(oneBox)}</span>} />
          <ReceiptTotal label={`Total · ${boxes} boîte${boxes > 1 ? "s" : ""}`} value={formatPrice(total)} />
        </dl>
      </Receipt>

      {!availability.orderable ? (
        <p className="flex items-center justify-center">
          <span className="inline-flex -rotate-3 rounded-lg border-[3px] border-night px-4 py-2 text-center font-bold tracking-wide text-night uppercase">
            {availability.reason === "manual" ? "En rupture de stock pour le moment." : "Épuisé pour le moment."} Revenez bientôt !
          </span>
        </p>
      ) : !ordersOpen ? (
        <p className="rounded-2xl bg-warning-soft px-5 py-4 font-semibold text-warning">Les commandes en ligne sont momentanément fermées.</p>
      ) : null}

      {/* Barre d'action, fixée en bas sur téléphone ------------------------ */}
      <div data-sticky-cta className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-dashed border-kraft/50 bg-paper/95 px-4 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="md:hidden">
            <p className="hand text-lg leading-none text-kraft-deep">total</p>
            <p className="display tabular text-xl">{formatPrice(total)}</p>
          </div>
          <button type="button" onClick={addToCart} disabled={!canOrder} className="btn-primary flex-1 md:w-full md:flex-none md:text-base">
            Ajouter au panier
          </button>
        </div>
      </div>

      {added ? (
        <div role="status" className="rise flex flex-wrap items-center justify-between gap-3 rounded-[1.1rem] border-2 border-dashed border-violet/40 bg-white px-5 py-4">
          <span className="flex items-center gap-3">
            <span className="inline-flex -rotate-6 rounded-md border-[3px] border-violet px-2 py-0.5 text-sm font-bold tracking-[0.18em] text-violet">C&apos;EST NOTÉ</span>
            <span className="hand text-2xl text-violet">Ajouté au panier !</span>
          </span>
          <Link href="/panier" className="inline-flex items-center gap-1 font-semibold text-night underline decoration-lilac decoration-2 underline-offset-4 hover:decoration-violet">
            Voir mon panier <ArrowIcon className="size-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/** Titre d'étape : numéro tamponné et indication manuscrite. */
function StepLegend({ n, last = false, hint, children }: { n: number; last?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <legend className="flex w-full items-center gap-3">
      <span
        className={`display grid size-11 shrink-0 place-items-center rounded-full text-lg ${
          last ? "bg-night text-white" : "-rotate-6 border-2 border-violet text-violet"
        }`}
      >
        {n}
      </span>
      <span>
        <span className="display block text-xl leading-tight">{children}</span>
        {hint ? <span className="hand block text-lg leading-tight text-violet/80">{hint}</span> : null}
      </span>
    </legend>
  );
}
