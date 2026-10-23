import "server-only";
import postgres from "postgres";

type Sql = postgres.Sql;

const globalForDb = globalThis as unknown as { kalimaSql?: Sql };

function createClient(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL n'est pas configurée.");
  }
  return postgres(url, {
    max: Number(process.env.DATABASE_POOL_SIZE ?? 5),
    // Compatible avec le pooler de Supabase en mode transaction.
    prepare: false,
    idle_timeout: 20,
    // Les types d'extension (citext) sont dans le schéma « extensions ».
    connection: { search_path: "public, extensions" },
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
