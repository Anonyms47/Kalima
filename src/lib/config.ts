// Configuration lue depuis l'environnement. Aucun secret n'est exposé au navigateur
// (seules les variables NEXT_PUBLIC_* le sont).

export const siteEnv = (process.env.NEXT_PUBLIC_SITE_ENV ?? "preview") as
  | "production"
  | "preview";

export const isProductionSite = siteEnv === "production";

export function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export const TIME_ZONE = "Africa/Dakar";
