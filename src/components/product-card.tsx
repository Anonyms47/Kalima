import Image from "next/image";
import Link from "next/link";
import { availability, availabilityLabel } from "@/lib/availability";
import { formatPrice } from "@/lib/format";
import { startingPrice } from "@/lib/pricing";
import type { PublicProduct } from "@/lib/server/catalog";
import { ArrowIcon } from "./icons";

export function ProductCard({ product, priority = false, index = 0 }: { product: PublicProduct; priority?: boolean; index?: number }) {
  const image = product.images[0];
  const a = availability(product);
  const minPrice = Math.min(...product.formats.map(startingPrice));
  const unitFormat = product.formats.find((f) => f.pricing === "per_unit");

  return (
    <Link
      href={`/gourmandises/${product.slug}`}
      className="group card flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-mist">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 30rem, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-[50%_62%] transition duration-700 group-hover:scale-[1.03]"
          />
        ) : null}
        <span
          className={`absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${a.orderable ? "bg-white/95 text-success" : "bg-night text-white"}`}
        >
          {availabilityLabel(a)}
        </span>
        <span className={`absolute right-4 bottom-4 ${index % 2 ? "rotate-2" : "-rotate-2"} kraft-tag shadow-sm`}>
          {unitFormat ? `${formatPrice(unitFormat.price)} / ${unitFormat.unit_label}` : `dès ${formatPrice(minPrice)}`}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5 sm:p-6">
        <h3 className="display text-[1.75rem] text-night">{product.name}</h3>
        {product.tagline ? <p className="text-[0.97rem] leading-relaxed text-muted">{product.tagline}</p> : null}
        <p className="mt-1 text-sm text-night/80">
          {product.formats.map((f) => (f.pricing === "per_unit" ? `Minimum ${f.min_units} par boîte` : f.label)).join(" · ")}
        </p>
        <span className="mt-auto inline-flex items-center gap-2 pt-3 font-semibold text-violet">
          Composer ma boîte
          <ArrowIcon className="size-5 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
