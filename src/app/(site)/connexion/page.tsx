import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Bang } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { PaperCard } from "@/components/paper-card";
import { getCurrentUser, safeNext } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Connexion" };

const BENEFITS = [
  { title: "Suivre vos commandes", note: "paiement, confection, livraison ou retrait" },
  { title: "Devenir ambassadeur", note: "5 filleuls livrés, 1 box offerte" },
  { title: "Sans mot de passe", note: "un code par e-mail, et c'est tout" },
];

function Benefits({ className = "" }: { className?: string }) {
  return (
    <ul className={`space-y-4 ${className}`}>
      {BENEFITS.map((item) => (
        <li key={item.title} className="flex gap-3">
          <Bang className="mt-1 h-5 w-3 shrink-0 text-lilac" />
          <span>
            <span className="block font-semibold text-night">{item.title}</span>
            <span className="hand block text-xl leading-tight text-violet/80">{item.note}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function LoginPage({ searchParams }: PageProps<"/connexion">) {
  const { suite } = await searchParams;
  const next = safeNext(typeof suite === "string" ? suite : null, "/compte");
  if (await getCurrentUser()) redirect(next);

  return (
    <div data-hide-footer-cta className="mx-auto grid w-full max-w-5xl gap-10 px-4 pt-8 pb-16 sm:px-6 md:grid-cols-[1fr_minmax(0,27rem)] md:items-center md:gap-14 md:py-20">
      <div>
        <p className="hand -rotate-2 text-3xl text-violet">re-bonjour !</p>
        <h1 className="display mt-1 text-4xl sm:text-5xl">Connexion</h1>
        <p className="mt-3 max-w-md text-lg leading-relaxed text-night/75">
          Votre espace KALIMA : vos commandes, votre carte ambassadeur. Pas encore de compte ? Il se crée à la première connexion.
        </p>

        <div className="mt-10 hidden items-start gap-8 md:flex">
          <figure className="relative w-44 shrink-0 -rotate-[4deg] bg-white p-2 pb-9 shadow-[var(--shadow-lift)]">
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image src="/photos/gaufres-chantilly.jpg" alt="Boîte KALIMA de gaufres au chocolat et chantilly" fill sizes="11rem" className="object-cover" />
            </div>
            <figcaption className="hand absolute bottom-1.5 left-3 text-lg text-night/80">elle vous attend</figcaption>
          </figure>
          <Benefits className="pt-2" />
        </div>
      </div>

      <div className="relative">
        <p aria-hidden className="hand absolute -top-11 right-4 hidden rotate-2 text-xl text-kraft-deep md:block">
          le code arrive comme un petit mot ↓
        </p>
        <PaperCard className="md:rotate-[0.6deg]">
          <LoginForm next={next} />
        </PaperCard>
      </div>

      {/* Sur téléphone, les avantages passent sous le formulaire. */}
      <Benefits className="md:hidden" />
    </div>
  );
}
