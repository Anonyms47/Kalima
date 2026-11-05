import type { Metadata, Viewport } from "next";
import { Caveat, DM_Sans, Fredoka } from "next/font/google";
import { CartProvider } from "@/components/cart/cart-context";
import { appUrl, isProductionSite } from "@/lib/config";
import "./globals.css";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], weight: ["500", "600", "700"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["500", "600", "700"] });

// Boutique alimentée par la base de données : rendu à chaque requête.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: "KALIMA · Gaufres et mini pancakes",
    template: "%s · KALIMA",
  },
  description:
    "Gaufres et mini pancakes préparés à la commande, nappés de chocolat, avec un petit mot glissé dans chaque boîte. Commandez en ligne, livraison ou retrait.",
  robots: isProductionSite ? undefined : { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "fr_SN",
    siteName: "KALIMA",
    images: [{ url: "/photos/gamme-boites-et-pot.jpg", width: 1080, height: 1350 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f8ff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${fredoka.variable} ${dmSans.variable} ${caveat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {!isProductionSite ? (
          <aside aria-label="Préproduction" className="bg-warning-soft px-4 py-2 text-center text-[0.8rem] leading-snug font-medium text-warning print:hidden">
            Site de préproduction : les commandes ne sont pas réelles et aucun paiement n&apos;est encaissé.
          </aside>
        ) : null}
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
