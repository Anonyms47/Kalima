import type { Metadata } from "next";
import Link from "next/link";
import { Bang } from "@/components/brand";
import { GiftIcon } from "@/components/icons";
import { Note } from "@/components/note";
import { getCurrentUser } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "Programme ambassadeur",
  description: "Partagez votre code KALIMA : 5 nouveaux clients servis grâce à vous = 1 box offerte.",
};

const RULES = [
  "Votre code personnel est unique. Vos proches le saisissent lors de leur commande.",
  "Un filleul est validé quand sa commande est payée puis livrée ou retirée.",
  "Chaque client ne compte qu'une fois pour vous, même s'il commande plusieurs fois.",
  "5 filleuls validés = 1 box individuelle au choix ; 10 = 2 box ; 15 = 3 box, et ainsi de suite.",
  "Les box famille ne font pas partie des récompenses.",
  "Votre propre code ne peut pas être utilisé pour vos commandes. Le code ne donne pas de réduction au filleul.",
  "Les commandes annulées ou remboursées ne comptent pas.",
];

export default async function AmbassadorsPage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-20 sm:px-6 md:pt-16">
      <div className="grid items-start gap-12 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="eyebrow"><Bang className="h-4 w-2.5 text-lilac" /> Programme ambassadeur</p>
          <h1 className="display mt-3 text-5xl sm:text-6xl">5 amis régalés, 1 box offerte</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
            Vous aimez KALIMA et vous en parlez autour de vous ? Recevez une box individuelle au choix chaque fois que cinq nouveaux clients ont été servis grâce à vous.
          </p>
          <Link href={user ? "/compte/ambassadeur" : "/connexion?suite=/compte/ambassadeur"} className="btn-primary mt-8 text-base">
            <GiftIcon /> {user ? "Mon espace ambassadeur" : "Obtenir mon code"}
          </Link>
        </div>
        <Note tilt="rotate-[2deg]" className="md:mt-10">
          Votre code + 5 nouveaux gourmands = une box rien que pour vous.
        </Note>
      </div>
      <section className="mt-16 rounded-[2rem] bg-white p-7 sm:p-10" aria-labelledby="regles">
        <h2 id="regles" className="display text-3xl">Les règles, simplement</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {RULES.map((rule) => (
            <li key={rule} className="flex gap-3">
              <Bang className="mt-1 h-5 w-3 shrink-0 text-lilac" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">
          La réclamation d&apos;une box se fait depuis votre espace : KALIMA valide la demande puis organise la remise avec vous. Les éventuels frais de livraison se conviennent sur WhatsApp.
        </p>
      </section>
    </div>
  );
}
