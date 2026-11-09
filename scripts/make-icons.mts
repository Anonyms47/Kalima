// Génère les icônes de l'application (favicon, écran d'accueil, Google) à partir de la marque.
// Usage : tsx scripts/make-icons.mts [dossier de sortie]
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright-core";
import sharp from "sharp";

const out = process.argv[2] ?? "icons-out";
await mkdir(out, { recursive: true });
const fontBold = (await readFile("assets/fonts/Fredoka-Bold.ttf")).toString("base64");

// Le « ! » lilas de la marque (même tracé que le logo), penché comme dans « Kalima! ».
const bang = `<g fill="#DCBFDB"><g transform="rotate(12 12 24)"><path d="M8.2 2.6c2.6-1.3 6.8-1.1 8.6.4 1.6 1.4 1.4 4.4 1 8.2l-1.6 15.4c-.3 2.6-1.7 3.9-4 3.9s-3.6-1.3-3.9-3.8L6.4 11.4c-.5-4.1-.6-7.5 1.8-8.8Z"/><path d="M12.3 35.2c2.8 0 5 2.1 5 4.8s-2.2 5-5.1 5-5-2.2-5-4.9 2.3-4.9 5.1-4.9Z"/></g></g>`;

/** `radius` : coins arrondis (icône normale) ; 0 : pleine page (iOS et Android arrondissent eux-mêmes). `scale` : taille du motif. */
const html = (radius: number, scale: number) => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:F;src:url(data:font/ttf;base64,${fontBold});font-weight:700}
html,body{margin:0;background:transparent}
.i{position:relative;width:512px;height:512px;background:#0E1236;border-radius:${radius}px;overflow:hidden}
.m{position:absolute;inset:0;transform:scale(${scale});transform-origin:50% 50%}
.k{position:absolute;left:96px;top:44px;font:700 400px/1 F;color:#FFFDF8}
svg{position:absolute;left:304px;top:70px;width:150px;height:300px}
</style><div class="i"><div class="m"><div class="k">K</div>
<svg viewBox="0 0 24 48">${bang}</svg></div></div>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome" });
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
async function render(radius: number, scale: number) {
  await page.setContent(html(radius, scale));
  await page.evaluate(() => document.fonts.ready);
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: 512, height: 512 } });
}
const rounded = await render(112, 1);
const full = await render(0, 1);
const safe = await render(0, 0.78); // zone de sécurité des icônes « maskable » Android
await browser.close();

const png = (buf: Buffer, size: number) => sharp(buf).resize(size, size).png().toBuffer();
await writeFile(join(out, "icon.png"), await png(rounded, 512));
await writeFile(join(out, "apple-icon.png"), await png(full, 180));
await writeFile(join(out, "icon-192.png"), await png(rounded, 192));
await writeFile(join(out, "icon-512.png"), await png(rounded, 512));
await writeFile(join(out, "icon-maskable-512.png"), await png(safe, 512));

// favicon.ico : 48 px (la taille que Google demande), 32 et 16, en PNG dans le conteneur ICO.
const sizes = [48, 32, 16];
const images = await Promise.all(sizes.map((s) => png(rounded, s)));
const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = images.map((img, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i], 0);
  e.writeUInt8(sizes[i], 1);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(img.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += img.length;
  return e;
});
await writeFile(join(out, "favicon.ico"), Buffer.concat([header, ...entries, ...images]));
console.log("icônes écrites dans", out);
