import postgres from "postgres";

// Usage : tsx scripts/add-staff.ts email@exemple.com "Prénom" [owner|manager]
const [email, displayName, role = "manager"] = process.argv.slice(2);
if (!email || !displayName || !["owner", "manager"].includes(role)) {
  console.error('Usage : npm run staff:add -- email "Prénom" [owner|manager]');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL!, { max: 1, connection: { search_path: "public, extensions" } });
try {
  const [user] = await sql<{ id: string }[]>`
    insert into users (email, first_name) values (${email.trim().toLowerCase()}, ${displayName})
    on conflict (email) do update set updated_at = now()
    returning id`;
  await sql`
    insert into staff (user_id, display_name, role) values (${user.id}, ${displayName}, ${role})
    on conflict (user_id) do update set display_name = excluded.display_name, role = excluded.role, active = true`;
  await sql`
    insert into audit_log (actor_label, action, entity_type, entity_id, details)
    values ('Script d''installation', 'staff.added', 'staff', ${user.id}, ${sql.json({ email, role })})`;
  console.log(`Accès équipe activé pour ${email} (${role}).`);
} finally {
  await sql.end();
}
