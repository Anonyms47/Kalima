import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";

// Audit d'accessibilité automatique (axe-core) des pages publiques.
// Usage : BASE_URL=http://localhost:3200 tsx scripts/a11y.mts
const BASE = process.env.BASE_URL ?? "http://localhost:3200";
const require = createRequire(import.meta.url);
const axeSource = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");
const privatePages = (process.env.A11Y_PRIVATE ?? "").split(",").filter(Boolean);
const pages = [...privatePages, "/", "/gourmandises", "/gourmandises/gaufres", "/gourmandises/mini-pancakes", "/panier", "/connexion", "/evenements", "/box-famille", "/ambassadeurs", "/notre-histoire", "/contact", "/infos/commande-et-retrait", "/infos/confidentialite"];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome" });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
// Session facultative (jeton de test) pour auditer l'espace client et l'administration.
if (process.env.A11Y_SESSION) await context.addCookies([{ name: "kalima_session", value: process.env.A11Y_SESSION, url: BASE }]);
const page = await context.newPage();
let total = 0;
for (const path of pages) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.addScriptTag({ content: axeSource });
  const violations = await page.evaluate(async () => {
    // @ts-expect-error axe injecté dans la page
    const result = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "best-practice"] });
    return result.violations.map((v: { id: string; impact: string; help: string; nodes: { target: string[] }[] }) => ({ id: v.id, impact: v.impact, help: v.help, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
  });
  total += violations.length;
  console.log(`${violations.length ? "✗" : "✔"} ${path}${violations.length ? "" : " : aucun problème détecté"}`);
  for (const v of violations) console.log(`   - [${v.impact}] ${v.id} : ${v.help}\n     ${v.targets.join(" | ")}`);
}
await browser.close();
process.exitCode = total ? 1 : 0;
