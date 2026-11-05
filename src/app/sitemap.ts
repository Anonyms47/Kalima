import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/config";
import { listPublishedProducts } from "@/lib/server/catalog";

// Pages publiques seulement : le compte, le panier et l'administration n'ont rien à faire dans Google.
const PAGES = ["", "/gourmandises", "/box-famille", "/evenements", "/notre-histoire", "/ambassadeurs", "/infos", "/contact"];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const products = await listPublishedProducts();
  return [
    ...PAGES.map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...products.map((p) => ({ url: `${base}/gourmandises/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
