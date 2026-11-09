import { createHash, randomBytes } from "node:crypto";
import postgres from "postgres";

// Usage : npm run login:link -- email@exemple.com [/admin]
// Crée un lien de connexion à usage unique (15 min) pour un compte existant,
// utile tant que l'envoi des codes par e-mail ne fonctionne pas.
const [rawEmail, next = "/admin"] = process.argv.slice(2);
if (!rawEmail) {
  console.error("Usage : npm run login:link -- email@exemple.com [/admin]");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
try {
  const email = rawEmail.trim().toLowerCase();
  const [user] = await sql<{ id: string }[]>`select id from users where email = ${email}`;
  if (!user) throw new Error(`Aucun compte pour ${email}. Pour l'équipe, utilisez d'abord npm run staff:add.`);
  const token = randomBytes(32).toString("base64url");
  await sql`
    insert into login_links (token_hash, user_id, expires_at)
    values (${createHash("sha256").update(token).digest("hex")}, ${user.id}, now() + interval '15 minutes')`;
  await sql`
    insert into audit_log (actor_label, action, entity_type, entity_id, details)
    values ('Script d''installation', 'login_link.created', 'user', ${user.id}, ${sql.json({ email })})`;
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  console.log(`${base}/connexion/lien?t=${token}&suite=${encodeURIComponent(next)}`);
} finally {
  await sql.end();
}
