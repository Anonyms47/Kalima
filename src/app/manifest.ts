import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KALIMA · Cake and bakery",
    short_name: "KALIMA",
    description: "Gaufres et mini pancakes préparés à la commande, livraison ou retrait.",
    start_url: "/",
    display: "standalone",
    lang: "fr",
    background_color: "#f8f8ff",
    theme_color: "#0e1236",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
