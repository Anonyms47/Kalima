import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackIcon, CheckIcon } from "@/components/icons";
import { availability } from "@/lib/availability";
import { getPublishedProduct } from "@/lib/server/catalog";
import { getSettings } from "@/lib/server/settings";
import { ProductConfigurator } from "./product-configurator";
import { ProductGallery } from "./product-gallery";

export async function generateMetadata({ params }: PageProps<"/gourmandises/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) return { title: "Gourmandise introuvable" };
  return {
    title: product.name,
    description: product.tagline || product.description.slice(0, 150),
    openGraph: product.images[0] ? { images: [{ url: product.images[0].url }] } : undefined,
  };
}

export default async function ProductPage({ params }: PageProps<"/gourmandises/[slug]">) {
  const { slug } = await params;
  // Un brouillon ou un produit archivé n'existe pas publiquement : 404.
  const [product, settings] = await Promise.all([getPublishedProduct(slug), getSettings()]);
  if (!product) notFound();

  return (
    <div data-hide-footer-cta className="mx-auto w-full max-w-6xl px-4 pt-6 pb-32 sm:px-6 md:pt-10 md:pb-20">
      <Link href="/gourmandises" className="group inline-flex min-h-11 items-center gap-2 text-violet">
        <BackIcon className="size-4 transition group-hover:-translate-x-0.5" />
        <span className="hand text-2xl">toute la carte</span>
      </Link>
      <div className="mt-6 grid gap-12 md:grid-cols-[1fr_1.05fr] md:gap-14">
        <ProductGallery images={product.images} name={product.name} />
        <div>
          <p className="hand -rotate-2 text-3xl text-violet">préparé à la commande</p>
          <h1 className="display mt-1 text-5xl sm:text-6xl">{product.name}</h1>
          {product.tagline ? <p className="mt-3 text-lg font-medium text-night/80">{product.tagline}</p> : null}
          {product.description ? <p className="mt-4 leading-relaxed text-night/75">{product.description}</p> : null}
          {product.included_note ? (
            <p className="mt-6 inline-flex -rotate-2 items-center gap-2 rounded-lg border-[3px] border-success/70 px-3 py-1.5 text-sm font-bold text-success">
              <CheckIcon className="size-4" /> {product.included_note}
            </p>
          ) : null}
          <ProductConfigurator
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              image: product.images[0]?.url ?? null,
              formats: product.formats,
              supplements: product.supplements,
            }}
            availability={availability(product)}
            ordersOpen={settings.orders_open}
          />
        </div>
      </div>
    </div>
  );
}
