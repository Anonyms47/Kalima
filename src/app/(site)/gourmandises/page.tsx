import type { Metadata } from "next";
import { ScribbleEnvelope } from "@/components/doodles";
import Link from "next/link";
import { ArrowIcon, WhatsappIcon } from "@/components/icons";
import { Note } from "@/components/note";
import { ProductCard } from "@/components/product-card";
import { listPublishedProducts } from "@/lib/server/catalog";
import { getSettings } from "@/lib/server/settings";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Nos gourmandises",
  description: "Gaufres et mini pancakes nappés de chocolat, à composer avec vos suppléments préférés.",
};

export default async function CataloguePage() {
  const [products, settings] = await Promise.all([listPublishedProducts(), getSettings()]);
  const wa = whatsappUrl(settings.contact.whatsapp_number, "Bonjour KALIMA, je souhaiterais une commande particulière :");

  return (
    <div data-hide-footer-cta className="mx-auto w-full max-w-6xl px-4 pt-10 pb-20 sm:px-6 md:pt-16">
      <header className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <p className="hand -rotate-2 text-3xl text-violet">la carte du moment</p>
          <h1 className="display mt-1 text-5xl sm:text-6xl">Nos gourmandises</h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-night/75">
            Tout est préparé à la commande et nappé de sauce chocolat, comprise dans le prix. Ajoutez autant de suppléments que vous voulez : 500 FCFA chacun, par boîte.
          </p>
        </div>
        <Note tilt="rotate-[2deg]" className="hidden max-w-xs justify-self-end md:block">
          Plusieurs boîtes ? Chacune peut avoir ses suppléments.
        </Note>
      </header>

      {products.length ? (
        <div className="mt-14 grid gap-x-10 gap-y-16 sm:grid-cols-2">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 2} index={index} headingLevel={2} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-[1.4rem] border-2 border-dashed border-kraft/60 bg-paper p-10 text-center">
          <p className="hand text-4xl text-violet">la carte se prépare…</p>
          <p className="mt-2 text-muted">Aucune gourmandise n&apos;est disponible en ligne pour le moment. Revenez très vite !</p>
        </div>
      )}

      {/* Box famille : composée par le client, prix donné sur WhatsApp. */}
      <section aria-labelledby="box-famille" className="mt-20 overflow-hidden rounded-[1.6rem] bg-night text-white shadow-[var(--shadow-lift)]">
        <div className="grid items-center gap-8 p-7 sm:p-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="hand -rotate-2 text-2xl text-lilac">sucré &amp; salé, pour toute la tablée</p>
            <h2 id="box-famille" className="display mt-1 text-4xl">La box famille</h2>
            <p className="mt-3 max-w-md leading-relaxed text-white/80">
              Composez votre box à votre goût, côté sucré comme côté salé, puis envoyez-la sur WhatsApp : on vous répond avec le prix.
            </p>
            <Link href="/box-famille" className="kraft-label mt-6">
              Je compose ma box <ArrowIcon className="size-5" />
            </Link>
          </div>
          <ul aria-hidden className="flex flex-wrap gap-2.5 md:justify-end">
            {[...settings.family_box.sweet, ...settings.family_box.salty].map((item, index) => (
              <li key={item} className={`hand rounded-lg border-2 border-dashed border-lilac/50 px-3 py-1 text-xl text-lilac ${index % 2 ? "rotate-2" : "-rotate-2"}`}>
                {item.toLowerCase()}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {wa ? (
        /* Commande spéciale : un petit mot épinglé, comme une demande glissée sous la porte. */
        <aside className="relative mx-auto mt-20 max-w-3xl">
          <div className="note-card !px-7 !pt-9 !pb-7 rotate-[-0.6deg] sm:!px-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="hand flex items-center gap-3 text-3xl text-violet">
                  <ScribbleEnvelope className="h-8 w-11 shrink-0 text-kraft-deep" /> Une envie particulière ?
                </h2>
                <p className="mt-2 max-w-md leading-relaxed text-night/80">
                  Mélange gaufres et pancakes, emballage spécial… Ces demandes se font directement avec KALIMA, qui vous propose un prix adapté.
                </p>
              </div>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp shrink-0">
                <WhatsappIcon className="size-5" /> Écrire sur WhatsApp
              </a>
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
