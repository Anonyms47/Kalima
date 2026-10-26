import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Confidentialité" };

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Infos" title="Confidentialité" intro="Ce que le site KALIMA enregistre, pourquoi, et qui peut le voir.">
      <section>
        <h2>Les données enregistrées</h2>
        <ul>
          <li>Votre adresse e-mail, pour vous connecter et recevoir le suivi de vos commandes.</li>
          <li>Votre nom et votre numéro WhatsApp, pour organiser la livraison ou le retrait.</li>
          <li>Le contenu de vos commandes, votre petit mot et vos éventuelles précisions.</li>
          <li>Pour les ambassadeurs : votre code et le nombre de filleuls validés.</li>
          <li>Pour les événements : les informations transmises dans le formulaire de demande.</li>
        </ul>
      </section>
      <section>
        <h2>Qui y a accès</h2>
        <p>Seule l&apos;équipe KALIMA, avec des accès nominatifs, consulte ces informations pour traiter les commandes. Un ambassadeur ne voit jamais le nom ni les coordonnées de ses filleuls : seulement un compteur.</p>
        <p>Les e-mails sont envoyés par un prestataire d&apos;envoi, et les données sont hébergées par un prestataire d&apos;hébergement de base de données.</p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>Le site utilise un cookie de session pour vous garder connecté et, si vous arrivez par le lien d&apos;un ambassadeur, un cookie qui mémorise son code pendant 30 jours. Votre panier est conservé dans votre navigateur. Aucun cookie publicitaire n&apos;est utilisé.</p>
      </section>
      <section>
        <h2>Vos demandes</h2>
        <p>Pour consulter, corriger ou supprimer vos informations, contactez KALIMA sur WhatsApp ou par la page Contact.</p>
      </section>
    </InfoPage>
  );
}
