"use client";

import Link from "next/link";
import { useState } from "react";
import { Bang } from "@/components/brand";
import { useCart } from "@/components/cart/cart-context";
import { CheckIcon } from "@/components/icons";
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

  return (
    <div className="mt-8 space-y-7">
      {/* 1. Format ------------------------------------------------------- */}
      <fieldset>
        <legend className="display flex items-center gap-2 text-xl">
          <span className="grid size-7 place-items-center rounded-full bg-night text-sm text-white">1</span>
          {perUnit && product.formats.length === 1 ? "Votre boîte" : "Choisissez le format"}
        </legend>
        {product.formats.length > 1 ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {product.formats.map((f) => (
              <label
                key={f.id}
                className="relative cursor-pointer rounded-2xl border-2 border-line bg-white p-4 transition hover:border-violet/50 has-[:checked]:border-violet has-[:checked]:bg-lilac-soft/60 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-lilac"
              >
                <input type="radio" name="format" value={f.id} checked={f.id === format.id} onChange={() => setFormatId(f.id)} className="sr-only" />
                <span className="display block text-lg">{f.label}</span>
                <span className="tabular mt-1 block font-semibold text-violet">
                  {f.pricing === "per_unit" ? `${formatPrice(f.price)} / ${f.unit_label}` : formatPrice(f.price)}
                </span>
              </label>
            ))}
          </div>
        ) : null}
        {perUnit ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
            <div>
              <p className="font-semibold">Nombre de {format.unit_label}s dans la boîte</p>
              <p className="text-sm text-muted">
                {formatPrice(format.price)} l&apos;unité · minimum {range.min}
              </p>
            </div>
            <Stepper value={effectiveUnits ?? range.min} min={range.min} max={range.max} onChange={setUnits} label={`${format.unit_label}s par boîte`} />
          </div>
        ) : null}
      </fieldset>

      {/* 2. Suppléments ------------------------------------------------- */}
      {product.supplements.length ? (
        <fieldset>
          <legend className="display flex items-center gap-2 text-xl">
            <span className="grid size-7 place-items-center rounded-full bg-night text-sm text-white">2</span>
            Des suppléments ?
          </legend>
          <p className="mt-1 text-sm text-muted">Facultatif · 500 FCFA chacun, appliqué à chaque boîte de cette sélection.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.supplements.map((s) => {
              const on = selected.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.id)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-line bg-white px-4 text-[0.95rem] font-semibold transition hover:border-violet/50 aria-pressed:border-violet aria-pressed:bg-violet aria-pressed:text-white"
                >
                  {on ? <CheckIcon className="size-4" /> : <span aria-hidden className="text-violet">+</span>}
                  {s.name}
                  <span className={`tabular text-xs ${on ? "text-white/80" : "text-muted"}`}>{formatPrice(s.price)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {/* 3. Nombre de boîtes ------------------------------------------- */}
      <fieldset>
        <legend className="display flex items-center gap-2 text-xl">
          <span className="grid size-7 place-items-center rounded-full bg-night text-sm text-white">{product.supplements.length ? 3 : 2}</span>
          Combien de boîtes identiques ?
        </legend>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Stepper value={Math.min(boxes, maxBoxes)} min={1} max={Math.max(1, maxBoxes)} onChange={setBoxes} label="Nombre de boîtes" />
          {availability.orderable && availability.maxBoxes !== null ? (
            <p className="text-sm font-semibold text-warning">Plus que {availability.maxBoxes} boîte{availability.maxBoxes > 1 ? "s" : ""} disponible{availability.maxBoxes > 1 ? "s" : ""}</p>
          ) : null}
        </div>
      </fieldset>

      {/* Détail du prix ------------------------------------------------- */}
      <div className="rounded-[1.4rem] border border-kraft/40 bg-paper p-5">
        <dl className="tabular space-y-1.5 text-[0.95rem]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{perUnit ? `${effectiveUnits} ${format.unit_label}s × ${formatPrice(format.price)}` : format.label}</dt>
            <dd>{formatPrice(base)}</dd>
          </div>
          {chosen.map((s) => (
            <div key={s.id} className="flex justify-between gap-4">
              <dt className="text-muted">+ {s.name}</dt>
              <dd>{formatPrice(s.price)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-dashed border-kraft/50 pt-2 font-semibold">
            <dt>Prix d&apos;une boîte</dt>
            <dd>{formatPrice(oneBox)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 pt-1">
            <dt className="font-semibold">
              Total · {boxes} boîte{boxes > 1 ? "s" : ""}
            </dt>
            <dd className="display text-[1.7rem] text-night">{formatPrice(oneBox * Math.min(boxes, maxBoxes))}</dd>
          </div>
        </dl>
      </div>

      {!availability.orderable ? (
        <p className="rounded-2xl bg-night px-5 py-4 font-semibold text-white">
          {availability.reason === "manual" ? "En rupture de stock pour le moment." : "Épuisé pour le moment."} Revenez bientôt !
        </p>
      ) : !ordersOpen ? (
        <p className="rounded-2xl bg-warning-soft px-5 py-4 font-semibold text-warning">Les commandes en ligne sont momentanément fermées.</p>
      ) : null}

      {/* Barre d'action, fixée en bas sur téléphone ------------------------ */}
      <div data-sticky-cta className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="md:hidden">
            <p className="text-xs text-muted">Total</p>
            <p className="display tabular text-xl">{formatPrice(oneBox * Math.min(boxes, maxBoxes))}</p>
          </div>
          <button type="button" onClick={addToCart} disabled={!canOrder} className="btn-primary flex-1 md:w-full md:flex-none md:text-base">
            Ajouter au panier
          </button>
        </div>
      </div>

      {added ? (
        <div role="status" className="rise flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-success-soft px-5 py-4 text-success">
          <span className="flex items-center gap-2 font-semibold">
            <Bang className="h-5 w-3 text-success" /> Ajouté au panier !
          </span>
          <Link href="/panier" className="font-semibold underline underline-offset-4">
            Voir mon panier
          </Link>
        </div>
      ) : null}
    </div>
  );
}
