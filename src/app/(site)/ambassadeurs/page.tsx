import type { Metadata } from "next";
import Link from "next/link";
import { Bang } from "@/components/brand";
import { CurlyArrow } from "@/components/doodles";
import { ArrowIcon } from "@/components/icons";
import { PaperCard } from "@/components/paper-card";
import { StampCard } from "@/components/stamp-card";
import { getCurrentUser } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "Programme ambassadeur",
  description: "Partagez votre code KALIMA : 5 nouveaux clients servis grâce à vous = 1 box offerte.",
};

const STEPS = [
  { title: "Vous partagez votre code", note: "par WhatsApp, de vive voix, comme vous voulez" },
  { title: "Vos proches commandent", note: "ils saisissent votre code à la commande" },
  { title: "Un tampon par ami servi", note: "et au 5ᵉ, une box vous attend" },
];

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
  const cta = user ? { href: "/compte/ambassadeur", label: "Mon espace ambassadeur" } : { href: "/connexion?suite=/compte/ambassadeur", label: "Obtenir mon code" };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-6 md:pt-14">
      <section className="grid items-center gap-14 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="hand -rotate-2 text-3xl text-violet">le programme ambassadeur</p>
          <h1 className="display mt-1 text-5xl leading-[1.02] sm:text-6xl">5 amis servis, 1 box offerte</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-night/75">
            Vous aimez KALIMA et vous en parlez autour de vous ? Chaque fois que cinq nouveaux clients ont été servis grâce à vous, une box individuelle de votre choix vous attend.
          </p>
          <Link href={cta.href} className="kraft-label mt-8">
            {cta.label} <ArrowIcon className="size-5" />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-md pt-10 pb-12">
          <StampCard stamps={3} caption="exemple" className="rotate-[-2deg]" />
          <p aria-hidden className="hand absolute top-0 left-2 -rotate-3 text-xl text-violet">chaque ami servi, un tampon</p>
          <p aria-hidden className="hand absolute right-0 bottom-0 flex items-end gap-1 text-xl text-kraft-deep">
            <CurlyArrow className="h-10 w-12 -scale-y-100 rotate-[200deg] text-kraft-deep/70" />
            au 5ᵉ, la box est pour vous
          </p>
        </div>
      </section>

      <section aria-labelledby="comment" className="mt-20">
        <h2 id="comment" className="display text-3xl sm:text-4xl">Comment ça marche</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span
                className={`display grid size-12 shrink-0 place-items-center rounded-full text-lg ${
                  index === 2 ? "bg-night text-white" : "-rotate-6 border-2 border-violet text-violet"
                }`}
              >
                {index + 1}
              </span>
              <span className="pt-1">
                <span className="block font-semibold text-night">{step.title}</span>
                <span className="hand block text-xl leading-tight text-violet/80">{step.note}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="regles" className="mt-20 grid gap-10 md:grid-cols-[1fr_1.4fr] md:items-start">
        <div>
          <h2 id="regles" className="display text-3xl sm:text-4xl">Le règlement, simplement</h2>
          <p className="mt-4 max-w-sm leading-relaxed text-night/75">
            La box se réclame depuis votre espace : KALIMA valide la demande puis organise la remise avec vous. Les éventuels frais de livraison se conviennent sur WhatsApp.
          </p>
        </div>
        <PaperCard className="rotate-[0.6deg]">
          <ol className="space-y-3.5">
            {RULES.map((rule, index) => (
              <li key={rule} className="flex gap-3">
                <span className="hand w-6 shrink-0 text-2xl leading-6 text-violet">{index + 1}.</span>
                <span className="leading-relaxed">{rule}</span>
              </li>
            ))}
          </ol>
          <p className="hand mt-5 flex items-center justify-end gap-2 text-2xl text-night/70">
            <Bang className="h-5 w-3 text-lilac" /> l&apos;équipe KALIMA
          </p>
        </PaperCard>
      </section>
    </div>
  );
}
