import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

// Usage : tsx scripts/db.ts migrate | seed | reset
const command = process.argv[2];
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });
const root = path.join(import.meta.dirname, "..", "db");

async function migrate() {
  await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const applied = new Set((await sql<{ name: string }[]>`select name from schema_migrations`).map((r) => r.name));
  const files = (await readdir(path.join(root, "migrations"))).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const content = await readFile(path.join(root, "migrations", file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`insert into schema_migrations (name) values (${file})`;
    });
    console.log(`Migration appliquée : ${file}`);
  }
}

async function seed() {
  await sql.unsafe(await readFile(path.join(root, "seed.sql"), "utf8"));
  console.log("Données initiales chargées.");
}

async function reset() {
  if (process.env.NODE_ENV === "production" || !/localhost|127\.0\.0\.1/.test(url!)) {
    throw new Error("reset refusé : base non locale.");
  }
  await sql.unsafe("drop schema if exists extensions cascade; drop schema public cascade; create schema public;");
}

try {
  if (command === "migrate") await migrate();
  else if (command === "seed") await seed();
  else if (command === "reset") {
    await reset();
    await migrate();
    await seed();
  } else {
    console.error("Commande inconnue. Utilisez migrate, seed ou reset.");
    process.exitCode = 1;
  }
} finally {
  await sql.end();
}
