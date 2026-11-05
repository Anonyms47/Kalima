import { timingSafeEqual } from "node:crypto";
import { sql } from "@/lib/server/db";
import { processNotificationQueue } from "@/lib/server/notifications";
import { expireStaleOrders } from "@/lib/server/orders";

// Tâche planifiée (Vercel Cron) : libère les réservations expirées et relance les e-mails.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return new Response("Non autorisé", { status: 401 });
  }
  // Données techniques périmées : sessions, codes et liens de connexion, compteurs de limites.
  await sql`delete from sessions where expires_at < now() - interval '1 day'`;
  await sql`delete from login_codes where expires_at < now() - interval '1 day'`;
  await sql`delete from login_links where expires_at < now() - interval '1 day'`;
  await sql`delete from rate_limits where window_start < now() - interval '2 days'`;
  const expired = await expireStaleOrders();
  const outcomes = await processNotificationQueue(50);
  return Response.json({
    expired,
    sent: outcomes.filter((o) => o.status === "sent").length,
    failed: outcomes.filter((o) => o.status === "failed").length,
  });
}
