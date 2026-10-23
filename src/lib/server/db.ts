import "server-only";
import postgres from "postgres";

type Sql = postgres.Sql;

const globalForDb = globalThis as unknown as { kalimaSql?: Sql };

/** Résumé de DATABASE_URL sans le mot de passe, pour diagnostiquer une configuration. */
export function describeDatabaseUrl(url: string) {
  try {
    const u = new URL(url);
    const password = decodeURIComponent(u.password);
    return [
      `hôte=${u.hostname}`,
      `port=${u.port || "5432"}`,
      `utilisateur=${decodeURIComponent(u.username)}`,
      `base=${u.pathname.slice(1)}`,
      `mot de passe=${password.length} caractère(s)`,
      /[[\]]/.test(password) || /YOUR-PASSWORD/i.test(url) ? "crochets ou modèle non remplacé" : "",
      /[^A-Za-z0-9]/.test(password) ? "caractères spéciaux présents" : "",
    ]
      .filter(Boolean)
      .join(", ");
  } catch {
    return "adresse illisible (format attendu : postgresql://utilisateur:motdepasse@hôte:port/base)";
  }
}

function createClient(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL n'est pas configurée.");
  }
  console.info(`[base] Connexion PostgreSQL : ${describeDatabaseUrl(url)}`);
  return postgres(url, {
    max: Number(process.env.DATABASE_POOL_SIZE ?? 5),
    // Compatible avec le pooler de Supabase en mode transaction.
    prepare: false,
    idle_timeout: 20,
    // Une connexion bloquée échoue vite au lieu de suspendre la page.
    connect_timeout: 10,
    // Pas de paramètre de démarrage (search_path…) : le pooler Supabase en mode
    // transaction ne les gère pas. Le chemin est réglé dans la base (migration 004).
    onnotice: () => {},
    types: {
      // Les dates "date" restent des chaînes YYYY-MM-DD.
      date: { to: 1082, from: [1082], serialize: (v: string) => v, parse: (v: string) => v },
    },
  });
}

function client(): Sql {
  globalForDb.kalimaSql ??= createClient();
  return globalForDb.kalimaSql;
}

// Connexion ouverte à la première requête : le build n'a pas besoin de la base.
export const sql: Sql = new Proxy((() => {}) as unknown as Sql, {
  apply: (_target, thisArg, args) => Reflect.apply(client(), thisArg, args),
  get: (_target, prop) => {
    const real = client();
    const value = Reflect.get(real, prop);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export type Tx = postgres.TransactionSql;
export type Db = Sql | Tx;
