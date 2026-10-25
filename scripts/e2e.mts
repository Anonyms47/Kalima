// Parcours complets dans un vrai navigateur (préproduction, e-mails en mode « log »).
// Usage : BASE_URL=http://localhost:3200 tsx scripts/e2e.mts
// Prérequis : base réinitialisée (npm run db:reset), serveur lancé avec EMAIL_PROVIDER=log,
// et un accès équipe créé : npm run staff:add -- gerante.test@kalima.test "Gérante test" owner
import assert from "node:assert/strict";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3200";
const SHOTS = process.env.SHOT_DIR ?? "screenshots/e2e";
const OUTBOX = path.join(process.cwd(), ".outbox");
const CHROME = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome";
const stamp = Date.now();
const customer = `client.test.${stamp}@kalima.test`;
const intruder = `autre.test.${stamp}@kalima.test`;
const staffEmail = process.env.STAFF_EMAIL ?? "gerante.test@kalima.test";

await mkdir(SHOTS, { recursive: true });
const results: string[] = [];
const ok = (label: string) => {
  results.push(`✔ ${label}`);
  console.log(`✔ ${label}`);
};

async function outbox() {
  const files = (await readdir(OUTBOX).catch(() => [])).filter((f) => f.endsWith(".json")).sort();
  return Promise.all(files.map(async (f) => JSON.parse(await readFile(path.join(OUTBOX, f), "utf8")) as { to: string; subject: string; text: string }));
}

async function latestCode(email: string) {
  for (let i = 0; i < 20; i++) {
    const mails = (await outbox()).filter((m) => m.to === email && m.subject.includes("code de connexion"));
    const last = mails.at(-1);
    if (last) return last.subject.match(/(\d{6})/)![1];
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Aucun code reçu pour ${email}`);
}

async function login(page: Page, email: string, next = "/compte") {
  await page.goto(`${BASE}/connexion?suite=${encodeURIComponent(next)}`);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByRole("button", { name: "Recevoir mon code" }).click();
  await page.getByLabel("Entrez le code reçu").waitFor();
  // Le formulaire se valide seul au 6e chiffre.
  await page.getByLabel("Entrez le code reçu").fill(await latestCode(email));
  await page.waitForURL((url) => url.pathname === next);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

const browser = await chromium.launch({ executablePath: CHROME });
const mobile = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "fr-FR", hasTouch: true, isMobile: true };

try {
  // 1. Brouillon inaccessible -------------------------------------------------
  {
    const response = await fetch(`${BASE}/gourmandises/brownies`);
    assert.equal(response.status, 404);
    const catalogue = await (await fetch(`${BASE}/gourmandises`)).text();
    assert.ok(!catalogue.includes("Brownies") && !catalogue.includes("Cinnamon") && !catalogue.includes("Box famille"));
    ok("Les brouillons n'apparaissent pas au catalogue et leur page répond 404");
  }

  // 2. Parcours client sur téléphone -------------------------------------------
  const clientContext = await browser.newContext(mobile);
  const page = await clientContext.newPage();
  let reference = "";
  {
    await page.goto(`${BASE}/gourmandises/gaufres`);
    await page.getByRole("button", { name: "Augmenter : gaufres par boîte" }).click();
    await page.getByRole("button", { name: /Chantilly/ }).click();
    await page.getByRole("button", { name: "Augmenter : Nombre de boîtes" }).click();
    // 3 gaufres × 500 + chantilly 500 = 2 000 par boîte, × 2 boîtes = 4 000.
    await assert.doesNotReject(page.getByText("4 000 FCFA").first().waitFor());
    await shot(page, "01-fiche-gaufres-configuree");
    await page.getByRole("button", { name: "Ajouter au panier" }).click();
    await page.getByRole("status").getByText("Ajouté au panier").waitFor();
    ok("Fiche produit : format, suppléments et nombre de boîtes calculés (4 000 FCFA)");

    await page.goto(`${BASE}/gourmandises/mini-pancakes`);
    await page.getByText("Boîte de 20").click();
    await page.getByRole("button", { name: "Ajouter au panier" }).click();
    await page.goto(`${BASE}/panier`);
    await page.getByText("7 000 FCFA").first().waitFor();
    await page.getByText("Livraison non comprise. Les modalités seront convenues sur WhatsApp après votre commande.").waitFor();
    await shot(page, "02-panier");
    ok("Panier : total recalculé par le serveur (4 000 + 3 000 = 7 000 FCFA) et mention livraison");

    await page.getByRole("link", { name: "Passer commande" }).click();
    await page.waitForURL(`${BASE}/commande`);
    await page.getByLabel("Adresse e-mail").fill(customer);
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByLabel("Entrez le code reçu").fill("000000");
    await page.getByText("Code incorrect.").waitFor();
    ok("Connexion : un code erroné est refusé");
    await page.getByLabel("Entrez le code reçu").fill(await latestCode(customer));
    await page.getByRole("heading", { name: "Vos informations" }).waitFor();

    await page.getByLabel("Nom", { exact: true }).fill("Awa Test");
    await page.getByLabel("Numéro WhatsApp").fill("77 000 11 22");
    await page.getByText("Retrait", { exact: true }).click();
    await page.getByText("J'écris mon message").click();
    await page.getByLabel("Votre petit mot").fill("Joyeux anniversaire Fatou !");
    await page.getByText("7 000 FCFA").first().waitFor();
    await shot(page, "03-commande");
    await page.getByRole("button", { name: "Valider ma commande" }).click();
    await page.waitForURL(/\/compte\/commandes\/KA-\d{2}-\d{4}/);
    reference = page.url().match(/(KA-\d{2}-\d{4})/)![1];
    await page.getByText("Réglez votre commande").waitFor();
    await page.getByText("Le paiement en ligne n'est pas encore activé").waitFor();
    await shot(page, "04-suivi-paiement-en-attente");
    ok(`Commande ${reference} enregistrée, en attente de paiement (aucun encaissement simulé)`);

    await page.goto(`${BASE}/panier`);
    await page.getByText("Votre panier est vide").waitFor();
    ok("Le panier est vidé après la commande");
  }

  // 3. Isolation des comptes -----------------------------------------------------
  {
    const other = await browser.newContext(mobile);
    const otherPage = await other.newPage();
    await login(otherPage, intruder);
    const response = await otherPage.goto(`${BASE}/compte/commandes/${reference}`);
    assert.equal(response?.status(), 404);
    await otherPage.goto(`${BASE}/admin`);
    await otherPage.waitForURL(/\/compte\?acces=refuse/);
    ok("Un autre client ne voit pas la commande (404) et n'accède pas à l'administration");
    await other.close();
  }

  // 4. Administration ------------------------------------------------------------
  const staffContext = await browser.newContext(mobile);
  const admin = await staffContext.newPage();
  {
    await login(admin, staffEmail, "/admin");
    await admin.getByRole("heading", { name: /Bonjour/ }).waitFor();
    await shot(admin, "05-admin-accueil");
    await admin.goto(`${BASE}/admin/commandes?q=${reference}`);
    await admin.getByRole("link", { name: new RegExp(reference) }).click();
    await admin.getByRole("heading", { name: reference }).waitFor();
    await admin.getByText("Joyeux anniversaire Fatou !").waitFor();
    await shot(admin, "06-admin-commande");

    await admin.getByLabel("Montant reçu (FCFA)").fill("6500");
    await admin.getByRole("checkbox").check();
    await admin.getByRole("button", { name: "Confirmer le paiement" }).click();
    await admin.getByText("Le montant reçu diffère du total").waitFor();
    ok("Un montant différent du total exige une explication");

    // Après envoi, React réinitialise le formulaire : la case de vérification est à recocher.
    await admin.getByLabel("Montant reçu (FCFA)").fill("7000");
    await admin.getByRole("checkbox").check();
    await admin.getByRole("button", { name: "Confirmer le paiement" }).click();
    await admin.getByText("e-mail accepté par le service d'envoi").waitFor();
    await admin.reload();
    for (const [button, label] of [
      ["La confection commence", "Confection commencée"],
      ["Prête à être retirée", "Prête au retrait"],
      ["Remise au client", "Remise"],
    ] as const) {
      await admin.getByRole("button", { name: button }).click();
      await admin.getByText(/e-mail accepté|Étape enregistrée/).first().waitFor();
      await admin.reload();
      void label;
    }
    await admin.getByText("Enregistrer un remboursement…").waitFor();
    await shot(admin, "07-admin-commande-terminee");

    const mails = (await outbox()).filter((m) => m.to === customer && !m.subject.includes("code"));
    const subjects = mails.map((m) => m.subject);
    assert.equal(mails.length, 4, `4 e-mails attendus, reçus : ${subjects.join(" | ")}`);
    assert.ok(subjects[0].startsWith("Paiement reçu, commande confirmée"));
    assert.ok(mails[0].text.includes("Montant payé : 7 000 FCFA"));
    assert.ok(subjects[1].startsWith("On prépare votre commande"));
    assert.ok(subjects[2].startsWith("Votre commande est prête à être retirée"));
    assert.ok(subjects[3].startsWith("Merci pour votre visite"));
    ok("Retrait : 4 e-mails dans l'ordre (paiement, confection, prête, remise) avec le montant payé");

    await page.goto(`${BASE}/compte/commandes/${reference}`);
    await page.getByText("Retirée", { exact: true }).first().waitFor();
    await shot(page, "08-suivi-client-termine");
    ok("Le client voit sa commande retirée dans son suivi");
  }

  // 5. Stock et rupture depuis l'administration --------------------------------
  {
    await admin.goto(`${BASE}/admin/produits`);
    await admin.getByRole("link", { name: "Mini pancakes" }).first().click();
    await admin.getByLabel("Quantité en stock (en boîtes)").fill("0");
    await admin.getByRole("button", { name: "Enregistrer les informations" }).click();
    await admin.getByText("Produit enregistré.").waitFor();
    await page.goto(`${BASE}/gourmandises/mini-pancakes`);
    await page.getByText("Épuisé pour le moment.").first().waitFor();
    assert.ok(await page.getByRole("button", { name: "Ajouter au panier" }).isDisabled());
    await admin.getByLabel("Quantité en stock (en boîtes)").fill("");
    await admin.getByRole("button", { name: "Enregistrer les informations" }).click();
    await admin.getByText("Produit enregistré.").waitFor();
    await page.reload();
    assert.ok(await page.getByRole("button", { name: "Ajouter au panier" }).isEnabled());
    ok("Stock 0 = épuisé (commande bloquée) ; champ vide = sans limite, de nouveau disponible");
  }

  // 6. Brouillon : publication refusée tant que c'est incomplet ------------------
  {
    await admin.goto(`${BASE}/admin/produits`);
    await admin.getByRole("link", { name: "Brownies" }).first().click();
    await admin.getByText("Avant de publier").waitFor();
    assert.ok(await admin.getByRole("button", { name: "Publier" }).isDisabled());
    await shot(admin, "09-admin-brouillon");
    ok("Un brouillon incomplet ne peut pas être publié");
  }

  // 7. Événement -----------------------------------------------------------------
  {
    await page.goto(`${BASE}/evenements`);
    await page.getByRole("button", { name: "Demander une réservation" }).click();
    await page.getByText("Quelques informations manquent").waitFor();
    await page.getByLabel("Occasion").selectOption("Anniversaire");
    const future = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    await page.getByLabel("Date").fill(future);
    await page.getByLabel("Lieu").fill("Dakar (test)");
    await page.getByLabel("Personnes").fill("40");
    await page.getByLabel("Produits et quantités souhaités").fill("60 gaufres, 50 mini pancakes (test)");
    await page.getByRole("button", { name: "Demander une réservation" }).click();
    await page.getByText("Ce n'est pas encore une réservation").waitFor();
    await shot(page, "10-evenement-envoye");
    await admin.goto(`${BASE}/admin/evenements`);
    await admin.getByText("Anniversaire · Awa Test").first().waitFor();
    ok("Demande d'événement : validation des champs, envoi, visible dans l'administration");
  }

  // 8. Ambassadeur ----------------------------------------------------------------
  {
    await page.goto(`${BASE}/compte/ambassadeur`);
    await page.getByRole("button", { name: "Obtenir mon code" }).click();
    await page.getByText("Mon code personnel").waitFor();
    const code = (await page.locator("p.display.tabular").first().textContent())!.trim();
    assert.match(code, /^K[A-Z0-9]{6}$/);
    await shot(page, "11-espace-ambassadeur");
    ok(`Espace ambassadeur : code ${code} attribué, progression affichée`);
  }

  // 9. Duplication, photo, publication puis archivage ---------------------------
  {
    await admin.goto(`${BASE}/admin/produits`);
    await admin.getByRole("link", { name: "Gaufres" }).first().click();
    await admin.getByRole("button", { name: "Dupliquer en brouillon" }).click();
    await admin.getByRole("heading", { name: "Gaufres (copie)" }).waitFor();
    const slug = await admin.getByLabel("Adresse de la page").inputValue();
    assert.equal((await fetch(`${BASE}/gourmandises/${slug}`)).status, 404);
    await admin.getByLabel("Ajouter des photos").setInputFiles(path.join(process.cwd(), "public/photos/gaufre-chocolat.jpg"));
    await admin.getByRole("button", { name: "Téléverser" }).click();
    await admin.getByText("Photo ajoutée.").waitFor();
    const uploaded = await admin.locator('img[src*="media"], img[src*="%2Fmedia%2F"]').count();
    assert.ok(uploaded >= 1, "la photo téléversée doit s'afficher");
    await admin.getByRole("button", { name: "Publier" }).click();
    await admin.getByText("Produit publié").waitFor();
    assert.equal((await fetch(`${BASE}/gourmandises/${slug}`)).status, 200);
    await admin.getByRole("button", { name: "Archiver" }).click();
    await admin.getByText("Produit archivé").waitFor();
    assert.equal((await fetch(`${BASE}/gourmandises/${slug}`)).status, 404);
    ok("Duplication en brouillon, photo optimisée, publication puis archivage (page retirée)");
  }

  await clientContext.close();
  await staffContext.close();
} finally {
  await browser.close();
}

console.log(`\n${results.length} vérifications réussies.`);
