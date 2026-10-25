import "server-only";
import type { OrderStatus } from "../order-status";
import { sql } from "./db";
import type { EventStatus } from "./events";
import type { FamilyBoxItem, FamilyBoxStatus } from "./family-box";

// ---------------------------------------------------------------------------
// Tableau de bord
// ---------------------------------------------------------------------------

export type DashboardCounts = {
  payments_to_check: number;
  payments_declared: number;
  rewards_to_validate: number;
  to_start: number;
  in_production: number;
  out_or_ready: number;
  new_events: number;
  new_family_boxes: number;
  failed_notifications: number;
};

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const [row] = await sql<DashboardCounts[]>`
    select
      count(*) filter (where status = 'awaiting_payment')::int as payments_to_check,
      count(*) filter (where status = 'awaiting_payment' and payment_declared_at is not null)::int as payments_declared,
      count(*) filter (where status = 'reward_requested')::int as rewards_to_validate,
      count(*) filter (where status = 'confirmed')::int as to_start,
      count(*) filter (where status = 'in_production')::int as in_production,
      count(*) filter (where status in ('out_for_delivery', 'ready_for_pickup'))::int as out_or_ready,
      (select count(*) from event_requests where status = 'new')::int as new_events,
      (select count(*) from family_box_requests where status = 'new')::int as new_family_boxes,
      (select count(*) from notifications where status = 'failed')::int as failed_notifications
    from orders`;
  return row;
}

export type SalesIndicators = {
  paid_orders: number;
  paid_total: number;
  refunds_count: number;
  refunds_total: number;
  average_basket: number;
  products: { product_name: string; boxes: number }[];
};

/**
 * Indicateurs de vente sur une période. « Ventes encaissées » = montants dont le
 * paiement a été vérifié (produits uniquement, hors livraison) : ce n'est pas un bénéfice.
 */
export async function getSalesIndicators(days: number): Promise<SalesIndicators> {
  const [totals] = await sql<Omit<SalesIndicators, "products" | "average_basket">[]>`
    select
      count(*) filter (where kind = 'standard')::int as paid_orders,
      coalesce(sum(paid_amount) filter (where kind = 'standard'), 0)::int as paid_total,
      count(*) filter (where status = 'refunded')::int as refunds_count,
      coalesce(sum(refunded_amount) filter (where status = 'refunded'), 0)::int as refunds_total
    from orders
    where paid_at >= now() - make_interval(days => ${days})`;
  const products = await sql<{ product_name: string; boxes: number }[]>`
    select i.product_name, sum(i.boxes)::int as boxes
    from order_items i join orders o on o.id = i.order_id
    where o.paid_at >= now() - make_interval(days => ${days}) and o.status <> 'refunded'
    group by i.product_name order by boxes desc`;
  return {
    ...totals,
    average_basket: totals.paid_orders ? Math.round(totals.paid_total / totals.paid_orders) : 0,
    products,
  };
}

// ---------------------------------------------------------------------------
// Commandes
// ---------------------------------------------------------------------------

export const ORDER_FILTERS = {
  verifier: { label: "Paiements à vérifier", statuses: ["awaiting_payment", "reward_requested"] },
  preparer: { label: "À préparer", statuses: ["confirmed", "in_production"] },
  remise: { label: "Livraison / retrait", statuses: ["out_for_delivery", "ready_for_pickup"] },
  terminees: { label: "Terminées", statuses: ["delivered", "picked_up"] },
  closes: { label: "Annulées / expirées", statuses: ["cancelled", "expired", "refunded"] },
  toutes: { label: "Toutes", statuses: [] },
} as const satisfies Record<string, { label: string; statuses: OrderStatus[] }>;

export type OrderFilter = keyof typeof ORDER_FILTERS;

export type AdminOrderRow = {
  id: string;
  reference: string;
  kind: "standard" | "reward";
  status: OrderStatus;
  fulfillment: "delivery" | "pickup";
  customer_name: string;
  customer_phone: string;
  total: number;
  payment_declared_at: string | null;
  created_at: string;
  summary: string;
};

export async function listAdminOrders(filter: OrderFilter, search: string) {
  const statuses = ORDER_FILTERS[filter].statuses as readonly string[];
  const q = search.trim();
  return sql<AdminOrderRow[]>`
    select o.id, o.reference, o.kind, o.status, o.fulfillment, o.customer_name, o.customer_phone, o.total,
      o.payment_declared_at, o.created_at,
      coalesce(string_agg(i.boxes || ' × ' || i.product_name, ', ' order by i.sort_order), '') as summary
    from orders o left join order_items i on i.order_id = o.id
    where true
      ${statuses.length ? sql`and o.status = any(${statuses as string[]})` : sql``}
      ${q ? sql`and (o.reference ilike ${"%" + q + "%"} or o.customer_name ilike ${"%" + q + "%"} or o.customer_phone ilike ${"%" + q + "%"} or o.customer_email ilike ${"%" + q + "%"})` : sql``}
    group by o.id
    order by (o.payment_declared_at is not null and o.status = 'awaiting_payment') desc, o.created_at desc
    limit 200`;
}

export type NotificationRow = {
  id: string;
  order_id: string | null;
  order_reference: string | null;
  kind: string;
  recipient: string;
  subject: string;
  status: "pending" | "sending" | "sent" | "failed";
  attempts: number;
  provider: string | null;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
};

export async function listNotifications({ orderId, onlyFailed = false }: { orderId?: string; onlyFailed?: boolean } = {}) {
  return sql<NotificationRow[]>`
    select n.id, n.order_id, o.reference as order_reference, n.kind, n.recipient, n.subject, n.status, n.attempts,
      n.provider, n.last_error, n.created_at, n.sent_at
    from notifications n left join orders o on o.id = n.order_id
    where true
      ${orderId ? sql`and n.order_id = ${orderId}` : sql``}
      ${onlyFailed ? sql`and n.status = 'failed'` : sql``}
    order by n.created_at desc limit 200`;
}

// ---------------------------------------------------------------------------
// Événements
// ---------------------------------------------------------------------------

export type EventRow = {
  id: string;
  reference: string;
  name: string;
  phone: string;
  email: string;
  occasion: string;
  event_date: string;
  location: string;
  guests: number | null;
  products_wanted: string;
  details: string | null;
  status: EventStatus;
  quote_amount: number | null;
  deposit_amount: number | null;
  deposit_paid_at: string | null;
  internal_notes: string;
  created_at: string;
};

export async function listEventRequests(open: boolean) {
  return sql<EventRow[]>`
    select * from event_requests
    where ${open ? sql`status not in ('declined', 'completed')` : sql`status in ('declined', 'completed')`}
    order by ${open ? sql`event_date asc` : sql`event_date desc`} limit 200`;
}

export async function getEventRequest(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await sql<EventRow[]>`select * from event_requests where id = ${id}`;
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Box famille
// ---------------------------------------------------------------------------

export type FamilyBoxRow = {
  id: string;
  reference: string;
  name: string;
  phone: string;
  items: FamilyBoxItem[];
  guests: number | null;
  wanted_date: string | null;
  note: string | null;
  status: FamilyBoxStatus;
  price: number | null;
  paid_at: string | null;
  internal_notes: string;
  created_at: string;
};

export async function listFamilyBoxRequests(open: boolean) {
  return sql<FamilyBoxRow[]>`
    select * from family_box_requests
    where ${open ? sql`status not in ('delivered', 'cancelled')` : sql`status in ('delivered', 'cancelled')`}
    order by created_at desc limit 200`;
}

export async function getFamilyBoxRequest(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await sql<FamilyBoxRow[]>`select * from family_box_requests where id = ${id}`;
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Ambassadeurs
// ---------------------------------------------------------------------------

export type AmbassadorRow = {
  user_id: string;
  code: string;
  active: boolean;
  email: string;
  name: string | null;
  validated: number;
  rewards_available: number;
  rewards_requested: number;
  rewards_delivered: number;
  created_at: string;
};

export async function listAmbassadors() {
  return sql<AmbassadorRow[]>`
    select a.user_id, a.code, a.active, u.email, nullif(trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')), '') as name,
      (select count(*) from referrals r where r.ambassador_user_id = a.user_id and r.revoked_at is null)::int as validated,
      (select count(*) from rewards w where w.ambassador_user_id = a.user_id and w.status = 'available')::int as rewards_available,
      (select count(*) from rewards w where w.ambassador_user_id = a.user_id and w.status = 'requested')::int as rewards_requested,
      (select count(*) from rewards w where w.ambassador_user_id = a.user_id and w.status = 'delivered')::int as rewards_delivered,
      a.created_at
    from ambassadors a join users u on u.id = a.user_id
    order by validated desc, a.created_at desc limit 500`;
}

export async function getAmbassadorDetail(userId: string) {
  if (!/^[0-9a-f-]{36}$/.test(userId)) return null;
  const [amb] = await sql<{ user_id: string; code: string; active: boolean; email: string; name: string | null; phone: string | null }[]>`
    select a.user_id, a.code, a.active, u.email, nullif(trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')), '') as name, u.phone
    from ambassadors a join users u on u.id = a.user_id where a.user_id = ${userId}`;
  if (!amb) return null;
  const referrals = await sql<
    { referred_user_id: string; referred_name: string | null; order_reference: string; qualified_at: string; revoked_at: string | null; revoked_reason: string | null }[]
  >`
    select r.referred_user_id, o.customer_name as referred_name, o.reference as order_reference, r.qualified_at, r.revoked_at, r.revoked_reason
    from referrals r join orders o on o.id = r.qualifying_order_id
    where r.ambassador_user_id = ${userId} order by r.qualified_at desc`;
  const rewards = await sql<
    { id: string; tier: number; status: string; product_name: string | null; order_id: string | null; order_reference: string | null; created_at: string; requested_at: string | null; delivered_at: string | null; note: string | null }[]
  >`
    select w.id, w.tier, w.status, p.name as product_name, w.order_id, o.reference as order_reference, w.created_at, w.requested_at, w.delivered_at, w.note
    from rewards w left join products p on p.id = w.product_id left join orders o on o.id = w.order_id
    where w.ambassador_user_id = ${userId} order by w.tier`;
  return { ...amb, referrals, rewards };
}

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

export type AuditRow = { id: number; actor_label: string; action: string; entity_type: string; entity_id: string | null; details: Record<string, unknown>; created_at: string };

export async function listAudit(limit = 200) {
  return sql<AuditRow[]>`select id, actor_label, action, entity_type, entity_id, details, created_at from audit_log order by created_at desc limit ${limit}`;
}
