# Kalima

Application web construite avec [Next.js](https://nextjs.org) 16 (App Router, TypeScript, Tailwind CSS) et [Supabase](https://supabase.com) pour l'authentification et la base de données.

## Ce qui est inclus

- **Page d'accueil** (`/`)
- **Connexion / inscription** par e-mail et mot de passe (`/login`)
- **Tableau de bord protégé** (`/dashboard`), réservé aux utilisateurs connectés
- **Confirmation d'e-mail** (`/auth/confirm`)
- Rafraîchissement automatique de la session via `src/proxy.ts`

## Démarrage

1. Installez les dépendances :

   ```bash
   npm install
   ```

2. Créez un projet sur [supabase.com](https://supabase.com), puis copiez le fichier d'exemple :

   ```bash
   cp .env.example .env.local
   ```

   Renseignez `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Supabase > Project Settings > API).

3. Pour que le lien de confirmation par e-mail fonctionne, dans Supabase > Authentication > Email Templates > « Confirm signup », remplacez le lien par :

   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
   ```

   et réglez **Site URL** (Authentication > URL Configuration) sur l'adresse du site (`http://localhost:3000` en local).

4. Lancez le serveur de développement :

   ```bash
   npm run dev
   ```

   Le site est disponible sur [http://localhost:3000](http://localhost:3000).

Sans les variables Supabase, le site s'affiche quand même, mais la connexion indique que Supabase n'est pas configuré.

## Scripts

| Commande        | Rôle                              |
| --------------- | --------------------------------- |
| `npm run dev`   | Serveur de développement          |
| `npm run build` | Build de production               |
| `npm start`     | Lance le build de production      |
| `npm run lint`  | Vérifie le code avec ESLint       |

## Déploiement

Le plus simple est [Vercel](https://vercel.com/new) : importez le dépôt GitHub et ajoutez les deux variables d'environnement Supabase dans les réglages du projet. Pensez à mettre à jour la **Site URL** dans Supabase avec l'adresse de production.

## Structure

```
src/
├── app/
│   ├── page.tsx            # Accueil
│   ├── login/              # Connexion, inscription, actions serveur
│   ├── dashboard/          # Page protégée
│   └── auth/confirm/       # Confirmation d'e-mail
├── lib/
│   ├── auth.ts             # Récupération de l'utilisateur connecté
│   └── supabase/           # Clients Supabase (navigateur, serveur, proxy)
└── proxy.ts                # Rafraîchit la session à chaque requête
```
