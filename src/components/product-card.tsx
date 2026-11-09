import Image from "next/image";
import Link from "next/link";
import { availability } from "@/lib/availability";
import { formatPrice } from "@/lib/format";
import { startingPrice } from "@/lib/pricing";
import type { PublicProduct } from "@/lib/server/catalog";

/** Carte produit : polaroïd scotché, étiquette kraft du prix, formats à points de conduite. */
export function ProductCard({ product, priority = false, index = 0, headingLevel = 3 }: { product: PublicProduct; priority?: boolean; index?: number; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const image = product.images[0];
  const a = availability(product);
  const unitFormat = product.formats.find((f) => f.pricing === "per_unit");
  const minPrice = product.formats.length ? Math.min(...product.formats.map(startingPrice)) : null;
  const price = unitFormat ? `${formatPrice(unitFormat.price)} / ${unitFormat.unit_label}` : minPrice !== null ? `dès ${formatPrice(minPrice)}` : null;
  const tilt = index % 2 ? "rotate-[1.5deg]" : "-rotate-[1.5deg]";
  const limited = a.orderable && a.maxBoxes !== null && a.maxBoxes <= 5 ? a.maxBoxes : null;

  return (
    <Link href={`/gourmandises/${product.slug}`} className="group block" aria-label={`${product.name}${a.orderable ? "" : ", épuisé pour le moment"}`}>
      <div className={`relative bg-white p-3 pb-12 shadow-[var(--shadow-lift)] transition duration-500 ease-[var(--ease-out-soft)] group-hover:-translate-y-1 group-hover:rotate-0 ${tilt}`}>
        <span aria-hidden className="absolute -top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 -rotate-3 rounded-sm bg-lilac/80" />
        <div className="relative aspect-square overflow-hidden bg-mist sm:aspect-[4/5]">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 30rem, (min-width: 640px) 50vw, 100vw"
              className={`object-cover object-[50%_62%] transition duration-700 group-hover:scale-[1.03] ${a.orderable ? "" : "grayscale-[60%]"}`}
            />
          ) : null}
          {!a.orderable ? (
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-lg border-[3px] border-danger bg-white/85 px-4 py-1 text-center">
              <span className="display block text-xl tracking-[0.18em] text-danger">ÉPUISÉ</span>
              <span className="block text-xs font-semibold text-danger">pour le moment</span>
            </span>
          ) : limited !== null ? (
            <span className="absolute top-4 left-4 -rotate-6 rounded-lg border-[3px] border-violet bg-white/90 px-3 py-0.5 text-sm font-bold text-violet">
              plus que {limited} boîte{limited > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
        <p className="hand absolute bottom-2.5 left-4 text-2xl text-night/80">{product.name.toLowerCase()}</p>
        {price ? (
          <span
            className={`kraft-label pointer-events-none absolute right-2 bottom-8 sm:-right-3 !min-h-11 !pr-5 !pl-9 !text-base shadow-sm ${index % 2 ? "-rotate-3" : "rotate-3"}`}
          >
            {price}
          </span>
        ) : null}
      </div>

      <div className="mt-7 px-1">
        <Heading className="display text-[1.8rem] leading-tight text-night">{product.name}</Heading>
        {product.tagline ? <p className="mt-1 text-[0.97rem] leading-relaxed text-night/70">{product.tagline}</p> : null}
        <ul className="mt-3 space-y-1.5 text-[0.95rem]">
          {product.formats.map((format) => (
            <li key={format.id} className="flex items-baseline gap-2">
              <span className="shrink-0">
                {format.pricing === "per_unit" ? `La ${format.unit_label}` : format.label}
                {format.pricing === "per_unit" && format.min_units && format.min_units > 1 ? (
                  <span className="ml-1.5 text-sm text-muted">({format.min_units} min. par boîte)</span>
                ) : null}
              </span>
              <span aria-hidden className="min-w-4 flex-1 translate-y-[-0.3em] border-b border-dotted border-night/30" />
              <span className="tabular shrink-0 font-semibold">{formatPrice(format.price)}</span>
            </li>
          ))}
        </ul>
        <span className="hand mt-4 inline-flex items-center gap-1 text-2xl text-violet transition group-hover:translate-x-1">
          {a.orderable ? "je compose ma boîte →" : "voir la fiche →"}
        </span>
      </div>
    </Link>
  );
}
