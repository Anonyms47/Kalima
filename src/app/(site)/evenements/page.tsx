import type { Metadata } from "next";
import Image from "next/image";
import { Bang } from "@/components/brand";
import { getCurrentUser } from "@/lib/server/auth";
import { EventForm } from "./event-form";

export const metadata: Metadata = {
  title: "Événements et anniversaires",
  description: "Gaufres et mini pancakes pour vos anniversaires et événements : demandez une réservation à KALIMA.",
};

const STEPS = [
  { title: "Vous envoyez votre demande", text: "Date, lieu, nombre de personnes et envies : tout part en un formulaire." },
  { title: "On vérifie et on échange", text: "KALIMA confirme la disponibilité et précise les détails avec vous sur WhatsApp." },
  { title: "Devis et acompte", text: "Vous recevez un devis. La date est réservée après le versement d'un acompte de 45 %." },
];

export default async function EventsPage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-20 sm:px-6 md:pt-16">
      <div className="grid gap-12 md:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="eyebrow"><Bang className="h-4 w-2.5 text-lilac" /> Anniversaires & événements</p>
          <h1 className="display mt-3 text-5xl sm:text-6xl">Une fête, un buffet, une surprise ?</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            KALIMA prépare des gaufres et mini pancakes en quantité pour vos moments à partager. Minimum 50 pièces par variété. Installation ou préparation sur place selon disponibilité.
          </p>
          <ol className="mt-10 space-y-6">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="display grid size-10 shrink-0 place-items-center rounded-full bg-lilac text-lg">{i + 1}</span>
                <div>
                  <h2 className="display text-xl">{step.title}</h2>
                  <p className="mt-1 text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="relative mt-10 hidden aspect-[4/5] max-w-sm overflow-hidden rounded-[2rem] md:block">
            <Image src="/photos/montage-gamme.jpg" alt="Montage de la gamme KALIMA : pots et boîtes de gaufres et mini pancakes" fill sizes="24rem" className="object-cover" />
          </div>
        </div>
        <section className="card self-start p-6 sm:p-8" aria-labelledby="formulaire">
          <h2 id="formulaire" className="display text-3xl">Demander une réservation</h2>
          <div className="mt-6">
            <EventForm defaults={{ name: [user?.firstName, user?.lastName].filter(Boolean).join(" "), phone: user?.phone ?? "", email: user?.email ?? "" }} />
          </div>
        </section>
      </div>
    </div>
  );
}
