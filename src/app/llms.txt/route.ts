import { appUrl } from "@/lib/config";
import { listPublishedProducts } from "@/lib/server/catalog";
import { getSettings } from "@/lib/server/settings";

// Présentation de KALIMA en texte simple, pour les assistants et moteurs à IA qui cherchent qui nous sommes.
// Tout vient du site : produits publiés et coordonnées saisies dans l'administration.
export const dynamic = "force-dynamic";

export async function GET() {
  const base = appUrl();
  const [products, settings] = await Promise.all([listPublishedProducts().catch(() => []), getSettings()]);
  const { contact, pickup } = settings;
  const lines = [
    "# KALIMA, Cake and bakery",
    "",
    "> Gaufres et mini pancakes préparés à la commande à Dakar (Sénégal), nappés de sauce chocolat, avec un petit mot glissé dans chaque boîte. Commande en ligne, livraison ou retrait.",
    "",
    "KALIMA est une pâtisserie artisanale qui vend uniquement en ligne et sur commande : il n'y a pas de boutique ouverte au public.",
    pickup.area ? `Retrait : ${[pickup.area, pickup.details].filter(Boolean).join(", ")}.` : "",
    "",
    "## Gourmandises",
    ...(products.length
      ? products.map((p) => `- [${p.name}](${base}/gourmandises/${p.slug})${p.tagline ? ` : ${p.tagline}` : ""}`)
      : [`- [Toutes les gourmandises](${base}/gourmandises)`]),
    "",
    "## Commander",
    `- [Catalogue et commande en ligne](${base}/gourmandises)`,
    `- [Box famille sur mesure](${base}/box-famille)`,
    `- [Événements et grandes commandes](${base}/evenements)`,
    `- [Commande, livraison et retrait](${base}/infos/commande-et-retrait)`,
    `- [Informations alimentaires](${base}/infos/informations-alimentaires)`,
    "",
    "## Contact",
    contact.email ? `- E-mail : ${contact.email}` : "",
    contact.whatsapp_number ? `- WhatsApp : ${contact.whatsapp_number}` : "",
    contact.instagram ? `- Instagram : https://instagram.com/${contact.instagram}` : "",
    contact.snapchat ? `- Snapchat : https://www.snapchat.com/add/${contact.snapchat}` : "",
    `- [Notre histoire](${base}/notre-histoire)`,
    "",
  ];
  return new Response(lines.filter((l, i, all) => l !== "" || all[i - 1] !== "").join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
