import { mkdir, writeFile } from "node:fs/promises";
import { renderLoginCodeEmail, renderOrderEmail, type OrderEmailData, type OrderEmailKind } from "../src/lib/emails/templates";

// Génère des aperçus HTML des e-mails dans docs/emails (données d'exemple).
const ctx = { appUrl: process.env.APP_URL ?? "https://kalima.example", contactPhone: "+221 70 926 22 07", instagram: "kalimaaa_0", whatsappUrl: "https://wa.me/221709262207" };
const base: OrderEmailData = {
  firstName: "Awa",
  reference: "KAL-EXEMPLE",
  trackingUrl: `${ctx.appUrl}/compte/commandes/KAL-EXEMPLE`,
  fulfillment: "delivery",
  kind: "standard",
  total: 7000,
  paidAmount: 7000,
  items: [
    { product_name: "Gaufres", format_label: "Boîte de gaufres", units: 3, unit_label: "gaufre", supplements: [{ name: "Chantilly", price: 500 }], box_price: 2000, boxes: 2, line_total: 4000 },
    { product_name: "Mini pancakes", format_label: "Boîte de 20", units: null, unit_label: null, supplements: [], box_price: 3000, boxes: 1, line_total: 3000 },
  ],
  pickupArea: "Dalifort",
  pickupDetails: "",
  giftMessage: "Joyeux anniversaire !",
};
await mkdir("docs/emails", { recursive: true });
const cases: [string, OrderEmailKind, Partial<OrderEmailData>][] = [
  ["1-paiement-recu", "payment_confirmed", {}],
  ["2-confection-commencee", "production_started", {}],
  ["3-en-route", "out_for_delivery", {}],
  ["4-livree", "delivered", {}],
  ["5-retrait-pret", "ready_for_pickup", { fulfillment: "pickup" }],
  ["6-retrait-remis", "picked_up", { fulfillment: "pickup" }],
  ["7-box-offerte-confirmee", "payment_confirmed", { kind: "reward", total: 0, paidAmount: 0 }],
];
const index: string[] = [];
for (const [file, kind, override] of cases) {
  const email = renderOrderEmail(kind, { ...base, ...override }, ctx);
  await writeFile(`docs/emails/${file}.html`, email.html);
  await writeFile(`docs/emails/${file}.txt`, `Objet : ${email.subject}\n\n${email.text}\n`);
  index.push(`- [${email.subject}](${file}.html)`);
}
const code = renderLoginCodeEmail("482913", ctx);
await writeFile("docs/emails/0-code-de-connexion.html", code.html);
await writeFile("docs/emails/0-code-de-connexion.txt", `Objet : ${code.subject}\n\n${code.text}\n`);
await writeFile("docs/emails/README.md", `# Modèles d'e-mails KALIMA\n\nAperçus générés avec des données d'exemple (\`npx tsx scripts/render-emails.mts\`). Les textes sont dans \`src/lib/emails/templates.ts\`.\n\n- [${code.subject}](0-code-de-connexion.html)\n${index.join("\n")}\n`);
console.log("Aperçus générés dans docs/emails/");
