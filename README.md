# KALIMA · boutique en ligne

Site de commande de KALIMA (« Kalima! Cake and bakery ») : gaufres et mini pancakes préparés à la commande, espace client, programme ambassadeur, demandes d'événements et administration utilisable sur téléphone. Réalisation Drifty.

- **Stack** : Next.js 16 (App Router, TypeScript, Tailwind CSS 4), PostgreSQL (hébergé chez Supabase), Brevo pour les e-mails, Supabase Storage pour les photos, déploiement Vercel.
- **Principe** : toute la logique sensible (prix, stock, statuts, parrainages, récompenses) est exécutée côté serveur, dans des transactions PostgreSQL avec verrous. Le navigateur n'envoie jamais de prix.

## Sommaire

1. [Ce qui fonctionne](#ce-qui-fonctionne)
2. [Démarrer en local](#démarrer-en-local)
3. [Mise en production : services à configurer](#mise-en-production--services-à-configurer)
4. [Règles métier implémentées](#règles-métier-implémentées)
5. [Schéma de données](#schéma-de-données)
6. [Vérifications](#vérifications)
7. [Avant l'ouverture](#avant-louverture)

## Ce qui fonctionne

**Boutique** : accueil, catalogue (« Nos gourmandises »), fiche produit (format, nombre de gaufres par boîte, suppléments multiples par boîte, nombre de boîtes, détail du prix), panier, commande (livraison ou retrait, petit mot personnalisé, code ambassadeur), suivi de commande, événements et anniversaires, programme ambassadeur, notre histoire, contact, pages d'information (commande et retrait, conditions de vente, informations alimentaires, confidentialité).

**Espace client** : connexion par code e-mail, commandes et suivi, profil, espace ambassadeur (code, lien de partage, progression, box gagnées, réclamation d'une box).

**Administration** (`/admin`, accès nominatifs) : tableau de bord (à traiter, ventes), commandes (recherche, filtres, vérification du paiement, confection, livraison/retrait, annulation, remboursement, WhatsApp prérempli, historique, e-mails), produits (création, duplication en brouillon, publication, archivage, formats et prix, suppléments, stock et rupture, photos), suppléments, événements (statut, devis, acompte de 45 %, notes), ambassadeurs (filleuls, corrections tracées, récompenses), e-mails (état réel, relance), journal, paramètres, équipe.

## Démarrer en local

Prérequis : Node.js 22, PostgreSQL 16.

```bash
npm install
cp .env.example .env.local          # puis adaptez DATABASE_URL
npm run db:migrate                  # crée les tables
npm run db:seed                     # catalogue initial et paramètres
npm run staff:add -- gerante@exemple.com "Prénom" owner
npm run dev                         # http://localhost:3000
```

En local, `EMAIL_PROVIDER=log` écrit chaque e-mail (y compris les codes de connexion) dans `.outbox/`. En mode `npm run dev` sans service d'e-mail, le code de connexion s'affiche aussi dans le terminal.

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run lint` · `npm run typecheck` | Contrôles du code |
| `npm test` | Tests d'intégration (base `kalima_test`, voir `vitest.config.mts`) |
| `npm run db:migrate` · `db:seed` · `db:reset` | Base de données (`reset` refusé hors base locale) |
| `npm run staff:add -- email "Prénom" [owner\|manager]` | Accès équipe |
| `npx tsx scripts/e2e.mts` | Parcours complets dans Chromium (voir l'en-tête du script) |
| `npx tsx scripts/a11y.mts` | Audit d'accessibilité axe-core |
| `npx tsx scripts/render-emails.mts` | Aperçus des e-mails dans `docs/emails/` |

## Mise en production : services à configurer

### 1. Base de données et photos (Supabase)

1. Créez un projet Supabase (région la plus proche, par exemple Europe de l'Ouest).
2. **Base** : *Project Settings → Database → Connection string → Transaction pooler* (port 6543). Ce sera `DATABASE_URL`. Appliquez le schéma depuis un poste :
   ```bash
   DATABASE_URL="postgres://…:6543/postgres" npm run db:migrate
   DATABASE_URL="postgres://…:6543/postgres" npm run db:seed
   DATABASE_URL="postgres://…:6543/postgres" npm run staff:add -- gerante@… "Prénom" owner
   DATABASE_URL="postgres://…:6543/postgres" npm run staff:add -- associee@… "Prénom" manager
   ```
   Le site accède à la base uniquement côté serveur : aucune clé de base n'est exposée au navigateur. La migration `002_row_level_security.sql` active RLS sans politique sur toutes les tables : l'API REST publique de Supabase n'y donne donc aucun accès, tandis que le site (rôle propriétaire) fonctionne normalement. N'ajoutez pas de politique d'accès public.
3. **Photos** : *Storage → New bucket* nommé `produits`, **public**. Renseignez `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (*Project Settings → API*, clé secrète : uniquement dans Vercel) et `STORAGE_PUBLIC_HOST` (le domaine `xxxx.supabase.co`).

### 2. E-mails (Brevo) et domaine expéditeur

1. Dans Brevo : *Senders, Domains & Dedicated IPs → Domains → Add a domain*, puis ajoutez chez l'hébergeur du nom de domaine les enregistrements DNS indiqués (code Brevo, **DKIM**, **SPF**, et une politique **DMARC**, par exemple `v=DMARC1; p=none; rua=mailto:…`). Attendez la mention « Authenticated ».
2. Créez l'expéditeur (ex. `commandes@votre-domaine`) et une **clé API** (*SMTP & API → API Keys*).
3. Variables : `EMAIL_PROVIDER=brevo`, `BREVO_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME=KALIMA`, éventuellement `EMAIL_REPLY_TO`.
4. Testez : connexion par code sur votre propre adresse, puis une commande test jusqu'à « Remise ». L'administration (*E-mails*) affiche l'état réel renvoyé par Brevo.

Sans service configuré, rien n'est envoyé et chaque e-mail apparaît « Échec » avec la raison : le site n'annonce jamais un envoi qui n'a pas été accepté. La connexion par code nécessite un service d'e-mail opérationnel.

### 3. Hébergement (Vercel)

1. Importez le dépôt GitHub dans Vercel (framework détecté : Next.js).
2. Renseignez toutes les variables de `.env.example` (*Settings → Environment Variables*) : `APP_URL` (adresse publique), `SESSION_SECRET` et `CRON_SECRET` (valeurs aléatoires longues).
3. **Préproduction** : `NEXT_PUBLIC_SITE_ENV=preview` (bandeau, `noindex`, `robots.txt` bloquant). **Boutique ouverte** : `NEXT_PUBLIC_SITE_ENV=production`.
4. Tâche planifiée : `vercel.json` appelle `/api/cron` une fois par jour (limite du plan gratuit) pour libérer les réservations expirées et relancer les e-mails en échec. Sur un plan Pro, passez la fréquence à `*/10 * * * *`. Les réservations sont aussi libérées à chaque nouvelle commande et à chaque ouverture de l'administration.
5. Domaine : ajoutez-le dans Vercel, puis mettez à jour `APP_URL`.

### 4. Paiement

Le lien de paiement se renseigne dans **Administration → Paramètres → Paiement**. Le client voit le montant exact, la référence à indiquer et le lien ; il peut signaler son paiement, mais **seule l'équipe confirme** après vérification dans son application (case de vérification obligatoire, montant reçu, référence de transaction, action tracée au journal).

Le module de paiement est isolé (`orders.payment_method`, paramètre `payment.provider`) : une intégration vérifiable (API avec webhook signé) pourra remplacer la confirmation manuelle sans changer le parcours. Avant d'en brancher une, vérifiez ce que le moyen retenu permet réellement : montant prérempli, référence, notification de paiement.

## Règles métier implémentées

**Prix** : gaufres 500 FCFA l'unité, minimum 2 par boîte ; mini pancakes boîte de 10 à 2 000 FCFA, boîte de 20 à 3 000 FCFA ; sauce chocolat comprise ; suppléments (caramel, sauce blanche, banane, chocolat supplémentaire, spéculoos, Kinder Bueno, chantilly) à 500 FCFA chacun **par boîte**. Prix d'une boîte = base + suppléments ; total de la ligne = prix d'une boîte × nombre de boîtes. Les prix et les choix sont figés dans la commande.

**Brouillons** : brownies (1 500 FCFA et topping à 500 FCFA notés en note interne ; format et photos à compléter), cinnamon rolls, box famille. Invisibles et non commandables : catalogue, page (404), panier et serveur filtrent tous sur `status = 'published'`. La publication est refusée tant qu'il manque une description, un format actif avec prix ou une photo.

**Stock** (en boîtes, par produit) : vide = aucune limite ; nombre positif = stock suivi ; 0 = épuisé ; « En rupture de stock » bloque toujours et reste prioritaire. Le stock est réservé à l'enregistrement de la commande par une mise à jour conditionnelle sur des lignes verrouillées (pas de survente). Une commande non payée expire après le délai paramétré (120 min par défaut) et libère son stock, sauf si le client a signalé son paiement. Confirmer un paiement après expiration revérifie le stock.

**Commandes** : paiement intégral uniquement ; mention « Livraison non comprise… » avant validation ; aucun frais de livraison calculé ni encaissé. États : paiement en attente → confirmée (paiement vérifié) → en confection (début réel signalé) → en livraison → livrée, ou prête à retirer → retirée. L'annulation par le client n'est possible qu'avant paiement (et avant tout signalement de paiement). Chaque transition est idempotente, journalisée, et ne déclenche qu'un e-mail (index unique).

**E-mails** : paiement reçu (avec récapitulatif et montant payé), confection commencée, en route, livrée ; pour le retrait : prête à être retirée, remise. Les échecs restent visibles, avec relances automatiques espacées puis manuelles.

**Ambassadeurs** : code personnel unique ; un filleul est validé quand une commande payée portant le code est livrée ou retirée ; chaque client ne compte qu'une fois par ambassadeur ; une box tous les 5 filleuls validés (5 = 1, 10 = 2, 15 = 3) ; auto-parrainage refusé (même compte ou même numéro WhatsApp) ; les commandes de récompense ne créent pas de parrainage ; une récompense ne s'utilise qu'une fois ; box famille exclues ; remboursement = parrainage retiré et récompense non réclamée annulée (avec trace). La réclamation crée une demande que KALIMA valide. Suppléments sur la box offerte : paramètre « non défini » (box sans supplément, rien n'est promis).

**Événements** : simple demande, aucune date bloquée automatiquement ; devis et acompte de 45 % suivis dans l'administration, hors paiement du site.

## Schéma de données

Migrations SQL versionnées dans `db/migrations/` (appliquées par `npm run db:migrate`), données initiales dans `db/seed.sql`.

| Table | Contenu |
| --- | --- |
| `users`, `sessions`, `login_codes` | Comptes (e-mail vérifié), sessions (jeton haché), codes de connexion (hachés, 10 min, 5 essais) |
| `staff` | Accès équipe nominatifs (gérante, équipe) |
| `products`, `product_formats`, `product_images` | Catalogue, formats et prix (fixe ou à l'unité avec minimum), photos |
| `supplements`, `product_supplements` | Suppléments et produits concernés |
| `orders`, `order_items`, `order_events` | Commandes, lignes figées, historique des états |
| `ambassadors`, `referrals`, `rewards` | Codes, filleuls validés (clé unique ambassadeur/filleul), récompenses (unique par palier) |
| `event_requests` | Demandes d'événements, devis et acompte |
| `notifications` | File d'e-mails (unique par commande et type), tentatives, erreurs |
| `settings`, `audit_log`, `rate_limits` | Paramètres modifiables, journal des actions, limitation des demandes |

## Vérifications

- `npm test` : 25 tests d'intégration sur PostgreSQL réel (prix, minimums, suppléments, brouillons, les quatre comportements du stock, commandes simultanées sur la dernière boîte, expiration, double confirmation, isolation, parrainages et récompenses, e-mails et échecs).
- `scripts/e2e.mts` : 15 parcours dans Chromium sur mobile (commande complète, connexion par code, isolation, administration, stock, brouillons, publication, photo, événement, ambassadeur).
- `scripts/a11y.mts` : audit axe-core (WCAG 2 A/AA) des pages publiques, client et administration.

## Avant l'ouverture

Voir la liste à jour dans la description de la pull request et dans *Administration → Accueil → À configurer*.
