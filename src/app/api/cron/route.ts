import { processNotificationQueue } from "@/lib/server/notifications";
import { expireStaleOrders } from "@/lib/server/orders";

// Tâche planifiée (Vercel Cron) : libère les réservations expirées et relance les e-mails.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Non autorisé", { status: 401 });
  }
  const expired = await expireStaleOrders();
  const outcomes = await processNotificationQueue(50);
  return Response.json({
    expired,
    sent: outcomes.filter((o) => o.status === "sent").length,
    failed: outcomes.filter((o) => o.status === "failed").length,
  });
}
