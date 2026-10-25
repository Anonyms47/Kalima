import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, type MenuProduct } from "@/components/site-header";
import { availability } from "@/lib/availability";
import { formatPrice } from "@/lib/format";
import { startingPrice } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/server/auth";
import { listPublishedProducts } from "@/lib/server/catalog";
import { getSettings } from "@/lib/server/settings";
import { whatsappUrl } from "@/lib/whatsapp";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [user, settings, catalog] = await Promise.all([getCurrentUser(), getSettings(), listPublishedProducts()]);
  // Raccourcis du menu mobile : les deux premiers produits publiés, prix affiché comme sur la carte.
  const menuProducts: MenuProduct[] = catalog.slice(0, 2).map((product) => {
    const unitFormat = product.formats.find((f) => f.pricing === "per_unit");
    const price = unitFormat
      ? `${formatPrice(unitFormat.price)} / ${unitFormat.unit_label}`
      : product.formats.length
        ? `dès ${formatPrice(Math.min(...product.formats.map(startingPrice)))}`
        : "";
    return {
      slug: product.slug,
      name: product.name,
      image: product.images[0]?.url ?? null,
      alt: product.images[0]?.alt ?? "",
      price,
      orderable: availability(product).orderable,
    };
  });
  return (
    <>
      <SiteHeader
        signedIn={Boolean(user)}
        isStaff={Boolean(user?.staff)}
        whatsapp={settings.contact.whatsapp_link || whatsappUrl(settings.contact.whatsapp_number)}
        instagram={settings.contact.instagram}
        hours={settings.hours}
        products={menuProducts}
      />
      {settings.announcement ? (
        <aside aria-label="Annonce" className="bg-night px-4 py-2.5 text-center text-sm font-medium text-white">{settings.announcement}</aside>
      ) : null}
      <main id="contenu" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
