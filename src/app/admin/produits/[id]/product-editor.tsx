"use client";

import Image from "next/image";
import {
  deleteFormatAction,
  imageAction,
  saveFormatAction,
  setProductSupplementsAction,
  setStatusAction,
  updateProductAction,
  uploadImageAction,
} from "@/lib/actions/admin/products";
import type { Product, Supplement } from "@/lib/server/catalog";
import { ActionForm } from "../../_components/action-form";
import { Panel } from "../../_components/ui";

export function StatusControls({ product, issues }: { product: Product; issues: string[] }) {
  return (
    <ActionForm action={setStatusAction} className="space-y-3">
      {(pending) => (
        <>
          <input type="hidden" name="productId" value={product.id} />
          {product.status !== "published" && issues.length ? (
            <div className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
              <p className="font-bold">Avant de publier :</p>
              <ul className="mt-1 list-disc pl-5">{issues.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {product.status !== "published" ? (
              <button type="submit" name="status" value="published" disabled={pending || issues.length > 0} className="btn-primary btn-sm">Publier</button>
            ) : (
              <button type="submit" name="status" value="draft" disabled={pending} className="btn-ghost btn-sm">Dépublier (brouillon)</button>
            )}
            {product.status === "archived" ? (
              <button type="submit" name="status" value="draft" disabled={pending} className="btn-ghost btn-sm">Désarchiver</button>
            ) : (
              <button type="submit" name="status" value="archived" disabled={pending} className="btn-ghost btn-sm">Archiver</button>
            )}
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function GeneralForm({ product }: { product: Product }) {
  return (
    <ActionForm action={updateProductAction} className="space-y-5">
      {(pending) => (
        <>
          <input type="hidden" name="productId" value={product.id} />
          <Panel title="Informations">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="field-label">Nom</label>
                  <input id="name" name="name" defaultValue={product.name} required className="field" />
                </div>
                <div>
                  <label htmlFor="slug" className="field-label">Adresse de la page</label>
                  <div className="flex items-center rounded-2xl border border-line bg-mist pl-3 text-sm text-muted focus-within:ring-4 focus-within:ring-lilac/60">
                    /gourmandises/
                    <input id="slug" name="slug" defaultValue={product.slug} className="w-full min-w-0 rounded-r-2xl bg-white px-2 py-3 text-base text-night focus:outline-none" />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="tagline" className="field-label">Accroche courte</label>
                <input id="tagline" name="tagline" defaultValue={product.tagline} maxLength={160} className="field" />
              </div>
              <div>
                <label htmlFor="description" className="field-label">Description</label>
                <textarea id="description" name="description" defaultValue={product.description} rows={4} className="field" />
                <p className="field-hint">N&apos;indiquez que des informations validées (ingrédients, allergènes : seulement si vérifiés).</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <div>
                  <label htmlFor="includedNote" className="field-label">Ce qui est compris</label>
                  <input id="includedNote" name="includedNote" defaultValue={product.included_note} placeholder="Ex. Sauce chocolat comprise dans le prix." className="field" />
                </div>
                <div>
                  <label htmlFor="sortOrder" className="field-label">Ordre d&apos;affichage</label>
                  <input id="sortOrder" name="sortOrder" type="number" defaultValue={product.sort_order} className="field" />
                </div>
              </div>
              <div>
                <label htmlFor="internalNote" className="field-label">Note interne <span className="font-normal text-muted">(jamais affichée aux clients)</span></label>
                <textarea id="internalNote" name="internalNote" defaultValue={product.internal_note} rows={2} className="field" />
              </div>
            </div>
          </Panel>

          <Panel title="Stock et disponibilité">
            <div className="space-y-4">
              <div>
                <label htmlFor="stock" className="field-label">Quantité en stock (en boîtes)</label>
                <input id="stock" name="stock" inputMode="numeric" defaultValue={product.stock_quantity ?? ""} placeholder="Vide = sans limite définie" className="field tabular max-w-xs" />
                <ul className="field-hint list-disc space-y-0.5 pl-5">
                  <li><strong>Vide</strong> : aucune limite, le produit reste disponible.</li>
                  <li><strong>0</strong> : épuisé, la commande est bloquée.</li>
                  <li><strong>Nombre positif</strong> : stock limité, décompté à chaque commande.</li>
                </ul>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-line p-4">
                <input type="checkbox" name="manualOutOfStock" defaultChecked={product.manual_out_of_stock} className="mt-0.5 size-5 accent-[var(--color-night)]" />
                <span>
                  <strong className="block">En rupture de stock</strong>
                  <span className="text-sm text-muted">Bloque les commandes quelle que soit la quantité. Le décocher ne rend pas commandable un stock à 0.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-line p-4">
                <input type="checkbox" name="rewardEligible" defaultChecked={product.reward_eligible} disabled={product.is_family_box} className="mt-0.5 size-5 accent-[var(--color-violet)]" />
                <span>
                  <strong className="block">Proposé comme box offerte aux ambassadeurs</strong>
                  <span className="text-sm text-muted">Box individuelle uniquement (format le plus petit, sans supplément).</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-line p-4">
                <input type="checkbox" name="isFamilyBox" defaultChecked={product.is_family_box} className="mt-0.5 size-5 accent-[var(--color-violet)]" />
                <span>
                  <strong className="block">Box famille</strong>
                  <span className="text-sm text-muted">Exclue des récompenses ambassadeur.</span>
                </span>
              </label>
            </div>
          </Panel>
          <div className="sticky bottom-20 z-10 lg:bottom-4">
            <button type="submit" disabled={pending} className="btn-primary w-full shadow-[var(--shadow-lift)] sm:w-auto">
              {pending ? "Enregistrement…" : "Enregistrer les informations"}
            </button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function FormatsEditor({ product }: { product: Product }) {
  const blank = { id: "", label: "", pricing: "fixed" as const, price: 0, min_units: null, max_units: null, unit_label: "pièce", active: true, sort_order: 0 };
  return (
    <Panel title="Formats et prix">
      <p className="mb-4 text-sm text-muted">Prix fixe pour une boîte (ex. boîte de 10) ou prix à l&apos;unité avec un minimum par boîte (ex. gaufres). Les commandes passées gardent leur prix d&apos;origine.</p>
      <div className="space-y-4">
        {[...product.formats, blank].map((format) => (
          <ActionForm key={format.id || "nouveau"} action={saveFormatAction} resetOnSuccess={!format.id} className={`space-y-3 rounded-2xl border p-4 ${format.id ? "border-line" : "border-dashed border-violet/40 bg-lilac-soft/30"}`}>
            {(pending) => (
              <>
                {!format.id ? <p className="text-sm font-bold text-violet">Ajouter un format</p> : null}
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="formatId" value={format.id} />
                <div className="grid gap-3 sm:grid-cols-[2fr_1.4fr_1fr]">
                  <div>
                    <label className="field-label" htmlFor={`label-${format.id}`}>Nom du format</label>
                    <input id={`label-${format.id}`} name="label" defaultValue={format.label} placeholder="Boîte de 10" className="field" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor={`pricing-${format.id}`}>Type de prix</label>
                    <select id={`pricing-${format.id}`} name="pricing" defaultValue={format.pricing} className="field">
                      <option value="fixed">Prix de la boîte</option>
                      <option value="per_unit">Prix à l&apos;unité</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor={`price-${format.id}`}>Prix (FCFA)</label>
                    <input id={`price-${format.id}`} name="price" inputMode="numeric" defaultValue={format.price || ""} className="field tabular" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="field-label" htmlFor={`min-${format.id}`}>Minimum par boîte</label>
                    <input id={`min-${format.id}`} name="minUnits" inputMode="numeric" defaultValue={format.min_units ?? ""} placeholder="Prix à l'unité" className="field" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor={`max-${format.id}`}>Maximum <span className="font-normal text-muted">(facultatif)</span></label>
                    <input id={`max-${format.id}`} name="maxUnits" inputMode="numeric" defaultValue={format.max_units ?? ""} className="field" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor={`unit-${format.id}`}>Nom de l&apos;unité</label>
                    <input id={`unit-${format.id}`} name="unitLabel" defaultValue={format.unit_label} className="field" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" name="active" defaultChecked={format.active} className="size-5 accent-[var(--color-violet)]" /> Proposé à la vente
                  </label>
                  <div className="flex gap-2">
                    {format.id ? (
                      <button type="submit" formAction={deleteFormatAction} className="btn btn-sm text-danger hover:bg-danger-soft">Supprimer</button>
                    ) : null}
                    <button type="submit" disabled={pending} className="btn-ghost btn-sm">{format.id ? "Enregistrer" : "Ajouter"}</button>
                  </div>
                </div>
              </>
            )}
          </ActionForm>
        ))}
      </div>
    </Panel>
  );
}

export function SupplementsEditor({ product, all }: { product: Product; all: Supplement[] }) {
  const linked = new Set(product.supplements.map((s) => s.id));
  return (
    <Panel title="Suppléments proposés">
      <ActionForm action={setProductSupplementsAction}>
        {(pending) => (
          <>
            <input type="hidden" name="productId" value={product.id} />
            <div className="flex flex-wrap gap-2">
              {all.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold has-[:checked]:border-violet has-[:checked]:bg-lilac-soft">
                  <input type="checkbox" name="supplementIds" value={s.id} defaultChecked={linked.has(s.id)} className="size-4 accent-[var(--color-violet)]" />
                  {s.name}
                  {!s.active ? <span className="text-xs font-normal text-muted">(désactivé)</span> : null}
                </label>
              ))}
            </div>
            <button type="submit" disabled={pending} className="btn-ghost btn-sm">Enregistrer les suppléments</button>
          </>
        )}
      </ActionForm>
    </Panel>
  );
}

export function PhotosEditor({ product }: { product: Product }) {
  return (
    <Panel title="Photos">
      {product.images.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {product.images.map((img, index) => (
            <li key={img.id} className="overflow-hidden rounded-2xl border border-line">
              <div className="relative aspect-[4/5] bg-mist">
                <Image src={img.url} alt={img.alt} fill sizes="12rem" className="object-cover" />
                {index === 0 ? <span className="absolute top-2 left-2 rounded-full bg-night px-2 py-0.5 text-xs font-bold text-white">Principale</span> : null}
              </div>
              <form action={imageAction} className="space-y-2 p-2">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="imageId" value={img.id} />
                <label className="sr-only" htmlFor={`alt-${img.id}`}>Description de la photo</label>
                <input id={`alt-${img.id}`} name="alt" defaultValue={img.alt} className="field !rounded-xl !px-2 !py-1.5 text-xs" />
                <div className="flex flex-wrap gap-1">
                  <button name="intent" value="alt" className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-mist">Enregistrer</button>
                  {index > 0 ? <button name="intent" value="first" className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-mist">Principale</button> : null}
                  {index > 0 ? <button name="intent" value="up" aria-label="Avancer" className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-mist">←</button> : null}
                  {index < product.images.length - 1 ? <button name="intent" value="down" aria-label="Reculer" className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-mist">→</button> : null}
                  <button name="intent" value="delete" className="rounded-lg px-2 py-1 text-xs font-semibold text-danger hover:bg-danger-soft">Supprimer</button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Aucune photo pour le moment.</p>
      )}
      <ActionForm action={uploadImageAction} resetOnSuccess className="mt-5 space-y-3 rounded-2xl border border-dashed border-violet/40 bg-lilac-soft/30 p-4">
        {(pending) => (
          <>
            <input type="hidden" name="productId" value={product.id} />
            <label htmlFor="photos" className="field-label">Ajouter des photos</label>
            <input id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple required className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-night file:px-4 file:py-2 file:font-semibold file:text-white" />
            <div>
              <label htmlFor="alt" className="field-label">Description <span className="font-normal text-muted">(pour l&apos;accessibilité)</span></label>
              <input id="alt" name="alt" placeholder={`${product.name} dans une boîte kraft KALIMA`} className="field" />
            </div>
            <p className="text-xs text-muted">JPEG, PNG, WebP ou HEIC, 8 Mo maximum. Les photos sont optimisées sans être recadrées.</p>
            <button type="submit" disabled={pending} className="btn-primary btn-sm">{pending ? "Envoi…" : "Téléverser"}</button>
          </>
        )}
      </ActionForm>
    </Panel>
  );
}
