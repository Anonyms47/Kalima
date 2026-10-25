import type { Metadata } from "next";
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
    <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-20 sm:px-6 md:pt-16">
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
        <div className="mt-12 rounded-[2rem] border border-dashed border-line bg-white p-10 text-center">
          <p className="display text-2xl">La carte se prépare…</p>
          <p className="mt-2 text-muted">Aucune gourmandise n&apos;est disponible en ligne pour le moment. Revenez très vite !</p>
        </div>
      )}

      {wa ? (
        <aside className="mt-16 flex flex-col gap-4 rounded-[1.6rem] border-2 border-dashed border-kraft/60 bg-kraft-soft p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <h2 className="hand text-3xl text-kraft-deep">Une envie particulière ?</h2>
            <p className="mt-1 max-w-lg text-night/80">
              Mélange gaufres et pancakes, emballage spécial… Ces demandes se font directement avec KALIMA, qui vous propose un prix adapté.
            </p>
          </div>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0">
            Écrire sur WhatsApp
          </a>
        </aside>
      ) : null}
    </div>
  );
}
