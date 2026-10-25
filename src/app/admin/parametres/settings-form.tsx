"use client";

import { saveSettingsAction } from "@/lib/actions/admin/other";
import type { Settings } from "@/lib/server/settings";
import { ActionForm } from "../_components/action-form";
import { Panel } from "../_components/ui";

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      {children}
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  return (
    <ActionForm action={saveSettingsAction} className="space-y-5">
      {(pending) => (
        <>
          <Panel title="Paiement">
            <div className="space-y-4">
              <Field id="paymentLink" label="Lien de paiement" hint="Affiché au client avec le montant et la référence à indiquer. Vérifiez ce que ce lien permet réellement (montant, confirmation) avant de l'activer : la confirmation reste manuelle.">
                <input id="paymentLink" name="paymentLink" type="url" defaultValue={settings.payment.link} placeholder="https://…" className="field" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="paymentLabel" label="Nom du moyen de paiement">
                  <input id="paymentLabel" name="paymentLabel" defaultValue={settings.payment.label} placeholder="Ex. Wave" className="field" />
                </Field>
                <Field id="reservationMinutes" label="Durée de réservation du stock (minutes)" hint="Délai laissé au client pour payer avant de libérer les boîtes réservées.">
                  <input id="reservationMinutes" name="reservationMinutes" type="number" min={15} defaultValue={settings.reservation_minutes} className="field" />
                </Field>
              </div>
              <Field id="paymentInstructions" label="Instructions de paiement (facultatif)">
                <textarea id="paymentInstructions" name="paymentInstructions" rows={2} defaultValue={settings.payment.instructions} className="field" />
              </Field>
              <label className="flex items-start gap-3 rounded-xl border border-line p-4">
                <input type="checkbox" name="ordersOpen" defaultChecked={settings.orders_open} className="mt-0.5 size-5 accent-[var(--color-violet)]" />
                <span><strong className="block">Commandes en ligne ouvertes</strong><span className="text-sm text-muted">Décochez pour suspendre temporairement les commandes.</span></span>
              </label>
            </div>
          </Panel>

          <Panel title="Coordonnées">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="phone" label="Téléphone affiché"><input id="phone" name="phone" defaultValue={settings.contact.phone} className="field" /></Field>
              <Field id="whatsappNumber" label="Numéro WhatsApp (avec indicatif)" hint="Ex. 221709262207 : utilisé pour les messages préremplis."><input id="whatsappNumber" name="whatsappNumber" defaultValue={settings.contact.whatsapp_number} className="field" /></Field>
              <Field id="whatsappLink" label="Lien WhatsApp professionnel"><input id="whatsappLink" name="whatsappLink" defaultValue={settings.contact.whatsapp_link} className="field" /></Field>
              <Field id="instagram" label="Instagram"><input id="instagram" name="instagram" defaultValue={settings.contact.instagram} className="field" /></Field>
              <Field id="snapchat" label="Snapchat"><input id="snapchat" name="snapchat" defaultValue={settings.contact.snapchat} placeholder="Nom d'utilisateur" className="field" /></Field>
              <Field id="contactEmail" label="E-mail de contact (facultatif)"><input id="contactEmail" name="contactEmail" type="email" defaultValue={settings.contact.email} className="field" /></Field>
              <Field id="hours" label="Horaires"><input id="hours" name="hours" defaultValue={settings.hours} className="field" /></Field>
              <Field id="pickupArea" label="Zone de retrait"><input id="pickupArea" name="pickupArea" defaultValue={settings.pickup.area} className="field" /></Field>
              <Field id="pickupMapUrl" label="Lien Google Maps du lieu de retrait" hint="Dans Google Maps : Partager, puis Copier le lien. Affiché au client et dans l'e-mail « prête à retirer »."><input id="pickupMapUrl" name="pickupMapUrl" type="url" defaultValue={settings.pickup.map_url} placeholder="https://maps.app.goo.gl/…" className="field" /></Field>
              <Field id="pickupDetails" label="Instructions de retrait" hint="Adresse précise ou repère, affichés au client et dans l'e-mail « prête à retirer »."><input id="pickupDetails" name="pickupDetails" defaultValue={settings.pickup.details} className="field" /></Field>
            </div>
          </Panel>

          <Panel title="Textes du site">
            <div className="space-y-4">
              <Field id="announcement" label="Bandeau d'annonce (facultatif)"><input id="announcement" name="announcement" defaultValue={settings.announcement} className="field" /></Field>
              <Field id="homeNote" label="Petit mot de la page d'accueil"><input id="homeNote" name="homeNote" defaultValue={settings.home_note} className="field" /></Field>
              <Field id="foodInfo" label="Informations alimentaires validées" hint="Ingrédients et allergènes. Ne publiez que des informations vérifiées sur les recettes et les étiquettes.">
                <textarea id="foodInfo" name="foodInfo" rows={4} defaultValue={settings.food_info} className="field" />
              </Field>
              <Field id="salesTerms" label="Conditions de vente complètes">
                <textarea id="salesTerms" name="salesTerms" rows={6} defaultValue={settings.sales_terms} className="field" />
              </Field>
            </div>
          </Panel>

          <Panel title="Box famille" hint="à composer, puis sur WhatsApp">
            <p className="mb-4 text-sm text-muted">
              Le client choisit les quantités de chaque produit, puis envoie sa composition sur WhatsApp : vous lui proposez le prix. Un produit par ligne.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="familySweet" label="Côté sucré">
                <textarea id="familySweet" name="familySweet" rows={6} defaultValue={settings.family_box.sweet.join("\n")} className="field" />
              </Field>
              <Field id="familySalty" label="Côté salé">
                <textarea id="familySalty" name="familySalty" rows={6} defaultValue={settings.family_box.salty.join("\n")} className="field" />
              </Field>
            </div>
          </Panel>

          <Panel title="Ambassadeurs">
            <Field id="rewardPolicy" label="Suppléments sur les box offertes" hint="Tant que ce point n'est pas décidé, la box est remise sans supplément et rien n'est promis.">
              <select id="rewardPolicy" name="rewardPolicy" defaultValue={settings.reward_supplements_policy} className="field">
                <option value="undecided">Non défini (box sans supplément, conditions à préciser)</option>
                <option value="not_included">Suppléments non compris</option>
              </select>
            </Field>
          </Panel>

          <div className="sticky bottom-20 z-10 lg:bottom-4">
            <button type="submit" disabled={pending} className="btn-primary w-full shadow-[var(--shadow-lift)] sm:w-auto">{pending ? "Enregistrement…" : "Enregistrer les paramètres"}</button>
          </div>
        </>
      )}
    </ActionForm>
  );
}
