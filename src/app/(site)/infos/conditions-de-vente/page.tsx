import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, PendingContent } from "@/components/info-page";
import { getSettings } from "@/lib/server/settings";

export const metadata: Metadata = { title: "Conditions de vente" };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <InfoPage eyebrow="Infos" title="Conditions de vente">
      {s.sales_terms ? (
        <div className="whitespace-pre-line">{s.sales_terms}</div>
      ) : (
        <>
          <section>
            <h2>L&apos;essentiel</h2>
            <ul>
              <li>Les prix sont indiqués en FCFA ; la sauce chocolat est comprise.</li>
              <li>Chaque supplément coûte 500 FCFA par boîte.</li>
              <li>Le paiement est intégral ; la livraison n&apos;est pas comprise et se convient sur WhatsApp.</li>
              <li>Les prix, formats et suppléments sont figés au moment de la commande.</li>
            </ul>
            <p>
              Le détail du déroulement d&apos;une commande est présenté sur la page{" "}
              <Link href="/infos/commande-et-retrait" className="font-semibold text-violet hover:underline">Commande, livraison et retrait</Link>.
            </p>
          </section>
          <PendingContent>La version complète des conditions de vente est en cours de rédaction par KALIMA.</PendingContent>
        </>
      )}
    </InfoPage>
  );
}
