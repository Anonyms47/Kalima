import type { MetadataRoute } from "next";
import { appUrl, isProductionSite } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  if (!isProductionSite) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/compte", "/commande", "/api", "/connexion"] },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
