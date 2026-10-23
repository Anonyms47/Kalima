import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";
import { getSettings } from "@/lib/server/settings";

export const metadata: Metadata = { title: "Commande, livraison et retrait" };

export default async function OrderInfoPage() {
  const s = await getSettings();
  return (
    <InfoPage eyebrow="Infos pratiques" title="Commande, livraison et retrait">
      <section>
        <h2>Commander</h2>
        <p>Composez votre boîte, ajoutez vos suppléments, puis validez votre commande avec votre e-mail. Tout est préparé à la commande.</p>
        <p>Pour un mélange gaufres et pancakes ou un emballage particulier, contactez-nous directement : nous vous proposons un prix adapté.</p>
      </section>
      <section>
        <h2>Payer</h2>
        <ul>
          <li>Le paiement se fait en une fois, pour la totalité des produits.</li>
          <li>Votre commande est confirmée lorsque KALIMA a vérifié la réception du paiement.</li>
          <li>Tant que le paiement n&apos;est pas vérifié, vos boîtes sont réservées pendant un temps limité.</li>
        </ul>
      </section>
      <section>
        <h2>Livraison</h2>
        <p>Livraison non comprise. Les modalités seront convenues sur WhatsApp après votre commande. Les frais de livraison ne sont ni calculés ni encaissés sur le site.</p>
      </section>
      <section>
        <h2>Retrait</h2>
        <p>
          {s.pickup.area ? `Le retrait se fait à ${s.pickup.area}. ` : ""}
          {s.pickup.details || "L'adresse exacte et le moment du retrait vous sont communiqués après votre commande."}
        </p>
      </section>
      <section>
        <h2>Délais</h2>
        <p>Chaque commande est préparée à la demande. Le moment de la remise se convient avec vous ; aucun délai n&apos;est garanti automatiquement.{s.hours ? ` Horaires : ${s.hours.toLowerCase()}.` : ""}</p>
      </section>
      <section>
        <h2>Annulation</h2>
        <p>Vous pouvez annuler en ligne tant que le paiement n&apos;a pas été effectué. Une fois le paiement vérifié, la commande est prise en charge : pour tout incident, contactez KALIMA, qui étudie chaque situation.</p>
      </section>
    </InfoPage>
  );
}
