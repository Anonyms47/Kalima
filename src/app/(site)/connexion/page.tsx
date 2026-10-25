import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bang } from "@/components/brand";
import { BagIcon, GiftIcon, CheckIcon } from "@/components/icons";
import { LoginForm } from "@/components/login-form";
import { Note } from "@/components/note";
import { getCurrentUser, safeNext } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Connexion" };

const BENEFITS = [
  { icon: BagIcon, title: "Suivre vos commandes", text: "Paiement, préparation, livraison ou retrait : chaque étape en un coup d'œil." },
  { icon: GiftIcon, title: "Devenir ambassadeur", text: "Votre code à partager, et une box offerte tous les 5 filleuls livrés." },
  { icon: CheckIcon, title: "Sans mot de passe", text: "Un code reçu par e-mail suffit. Le compte se crée à la première connexion." },
];

export default async function LoginPage({ searchParams }: PageProps<"/connexion">) {
  const { suite } = await searchParams;
  const next = safeNext(typeof suite === "string" ? suite : null, "/compte");
  if (await getCurrentUser()) redirect(next);

  return (
    <div data-hide-footer-cta className="mx-auto grid w-full max-w-5xl gap-10 px-4 pt-8 pb-16 sm:px-6 md:grid-cols-[1fr_minmax(0,27rem)] md:items-center md:gap-14 md:py-20">
      <div>
        <p className="eyebrow"><Bang className="h-4 w-2.5 text-lilac" /> Mon espace KALIMA</p>
        <h1 className="display mt-3 text-4xl sm:text-5xl">Connexion</h1>
        <p className="mt-3 max-w-md text-lg leading-relaxed text-muted">Retrouvez vos commandes et votre programme ambassadeur.</p>

        <ul className="mt-8 hidden space-y-5 md:block">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lilac-soft text-violet">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-semibold text-night">{title}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
        <Note className="mt-10 hidden max-w-xs md:block" tilt="rotate-[-2deg]">
          Un code, et vous voilà chez vous.
        </Note>
      </div>

      <div className="card p-6 sm:p-8">
        <LoginForm next={next} />
      </div>

      {/* Sur téléphone, les avantages passent sous le formulaire. */}
      <ul className="space-y-4 md:hidden">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-lilac-soft text-violet">
              <Icon className="size-5" />
            </span>
            <span>
              <span className="block font-semibold text-night">{title}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
