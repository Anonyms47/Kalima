import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

// Usage : tsx scripts/screenshots.mts http://localhost:3000 /chemin1 /chemin2 …
// Variables : SHOT_DIR (dossier de sortie), SHOT_COOKIE (cookie de session facultatif).
const [base = "http://localhost:3000", ...paths] = process.argv.slice(2);
const dir = process.env.SHOT_DIR ?? "screenshots";
await mkdir(dir, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome" });
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1366, height: 900 },
];
for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.name === "mobile" ? 2 : 1, locale: "fr-FR" });
  if (process.env.SHOT_COOKIE) {
    await context.addCookies([{ name: "kalima_session", value: process.env.SHOT_COOKIE, url: base }]);
  }
  const page = await context.newPage();
  for (const path of paths) {
    await page.goto(base + path, { waitUntil: "networkidle" });
    // Fait défiler la page pour charger les images différées.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const file = `${dir}/${vp.name}${path.replace(/[/?=&]/g, "_") || "_accueil"}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(`${file}${overflow > 0 ? `  ⚠ débordement horizontal ${overflow}px` : ""}`);
  }
  await context.close();
}
await browser.close();
