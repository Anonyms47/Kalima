import type { Metadata } from "next";
import Image from "next/image";
import { getCurrentUser } from "@/lib/server/auth";
import { EventForm } from "./event-form";

export const metadata: Metadata = {
  title: "Événements et anniversaires",
  description: "Gaufres et mini pancakes pour vos anniversaires et événements : demandez une réservation à KALIMA.",
};

const STEPS = [
  { title: "Vous envoyez votre demande", note: "date, lieu, nombre de personnes et envies" },
  { title: "On vérifie et on échange", note: "disponibilité et détails sur WhatsApp" },
  { title: "Devis, puis acompte", note: "la date est réservée après un acompte de 45 %" },
];

export default async function EventsPage() {
  const user = await getCurrentUser();
  return (
    <div data-hide-footer-cta className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-6 md:pt-14">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="hand -rotate-2 text-3xl text-violet">anniversaires &amp; événements</p>
          <h1 className="display mt-1 text-5xl leading-[1.02] sm:text-6xl">Une fête, un buffet, une surprise ?</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-night/75">
            KALIMA prépare des gaufres et mini pancakes en quantité pour vos moments à partager. Installation ou préparation sur place selon disponibilité.
          </p>
          <p className="kraft-label pointer-events-none mt-6 !min-h-11 -rotate-2 !text-base">50 pièces minimum par variété</p>

          <ol className="mt-10 space-y-5">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  className={`display grid size-11 shrink-0 place-items-center rounded-full text-lg ${
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

          <figure className="relative mt-12 hidden w-72 rotate-[-3deg] bg-white p-3 pb-12 shadow-[var(--shadow-lift)] lg:block">
            <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-3 rounded-sm bg-lilac/80" />
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image src="/photos/montage-gamme.jpg" alt="Montage de la gamme KALIMA : pots et boîtes de gaufres et mini pancakes" fill sizes="18rem" className="object-cover" />
            </div>
            <figcaption className="hand absolute right-4 bottom-3 text-2xl text-night/80">pour vos tablées</figcaption>
          </figure>
        </div>

        {/* Carton-réponse à double filet kraft, comme un faire-part. */}
        <section aria-labelledby="formulaire" className="self-start bg-paper p-2 shadow-[var(--shadow-lift)] lg:rotate-[0.6deg]">
          <div className="border-2 border-double border-kraft px-5 py-8 sm:px-8">
            <div className="text-center">
              <p className="text-xs font-bold tracking-[0.22em] text-kraft-deep uppercase">Carton-réponse</p>
              <h2 id="formulaire" className="display mt-2 text-3xl sm:text-4xl">Demander une réservation</h2>
              <p className="hand mt-1 text-xl text-violet">on revient vers vous sur WhatsApp</p>
            </div>
            <div className="mt-8">
              <EventForm defaults={{ name: [user?.firstName, user?.lastName].filter(Boolean).join(" "), phone: user?.phone ?? "", email: user?.email ?? "" }} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
