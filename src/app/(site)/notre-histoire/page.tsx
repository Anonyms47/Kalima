import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Bang } from "@/components/brand";
import { Note } from "@/components/note";
import { getSettings } from "@/lib/server/settings";

export const metadata: Metadata = { title: "Notre histoire" };

const VALUES = [
  { title: "Préparé à la commande", text: "Rien n'attend en vitrine : votre boîte est préparée quand vous la commandez." },
  { title: "Le soin du détail", text: "Boîtes kraft, nappage généreux, suppléments au choix : chaque boîte est présentée avec attention." },
  { title: "Un petit mot, toujours", text: "Dans chaque commande, un mot glissé à la main. Le vôtre, ou celui que nous choisissons." },
];

export default async function StoryPage() {
  const settings = await getSettings();
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-20 sm:px-6 md:pt-16">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <p className="eyebrow"><Bang className="h-4 w-2.5 text-lilac" /> Notre histoire</p>
          <h1 className="display mt-3 text-5xl sm:text-6xl">KALIMA, Cake and bakery</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Des gaufres et des mini pancakes nappés de chocolat, à composer selon vos envies. Une pâtisserie qui aime faire plaisir… et qui a toujours un mot à dire.
          </p>
          {settings.contact.instagram ? (
            <p className="mt-6">
              <a href={`https://instagram.com/${settings.contact.instagram}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-violet hover:underline">
                Suivez nos créations sur Instagram : @{settings.contact.instagram}
              </a>
            </p>
          ) : null}
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lift)]">
            <Image src="/photos/gamme-boites-ouvertes.jpg" alt="Boîtes kraft ouvertes de gaufres et pot de mini pancakes KALIMA" fill priority sizes="24rem" className="object-cover" />
          </div>
          <Note tilt="rotate-[5deg]" className="absolute -bottom-10 -left-4 w-56 !px-4 !pt-5 !pb-3">
            <span className="text-[1.35rem] leading-[1.7rem]">Un petit mot dans chaque boîte.</span>
          </Note>
        </div>
      </div>
      <section className="mt-24 grid gap-6 md:grid-cols-3" aria-label="Ce qui compte pour nous">
        {VALUES.map((value) => (
          <article key={value.title} className="card p-7">
            <Bang className="h-7 w-4 text-lilac" />
            <h2 className="display mt-4 text-2xl">{value.title}</h2>
            <p className="mt-2 leading-relaxed text-muted">{value.text}</p>
          </article>
        ))}
      </section>
      <div className="mt-14 text-center">
        <Link href="/gourmandises" className="btn-primary text-base">Composer ma commande</Link>
      </div>
    </div>
  );
}
