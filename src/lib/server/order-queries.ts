import "server-only";
import type { Fulfillment, OrderStatus } from "../order-status";
import { sql } from "./db";

export type OrderItem = {
  id: string;
  product_name: string;
  format_label: string;
  units: number | null;
  unit_label: string | null;
  supplements: { name: string; price: number }[];
  box_base_price: number;
  box_price: number;
  boxes: number;
  line_total: number;
};

export type OrderEvent = {
  id: number;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  actor_label: string;
  note: string | null;
  created_at: string;
};

export type OrderDetail = {
  id: string;
  reference: string;
  user_id: string;
  kind: "standard" | "reward";
  status: OrderStatus;
  fulfillment: Fulfillment;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_area: string | null;
  customer_note: string | null;
  gift_message: string | null;
  total: number;
  referral_code: string | null;
  payment_declared_at: string | null;
  paid_at: string | null;
  paid_amount: number | null;
  payment_reference: string | null;
  refunded_amount: number | null;
  reservation_expires_at: string | null;
  created_at: string;
  items: OrderItem[];
  events: OrderEvent[];
};

async function withDetails(order: Omit<OrderDetail, "items" | "events"> | undefined): Promise<OrderDetail | null> {
  if (!order) return null;
  const [items, events] = await Promise.all([
    sql<OrderItem[]>`
      select id, product_name, format_label, units, unit_label, supplements, box_base_price, box_price, boxes, line_total
      from order_items where order_id = ${order.id} order by sort_order`,
    sql<OrderEvent[]>`
      select id, from_status, to_status, actor_label, note, created_at
      from order_events where order_id = ${order.id} order by created_at, id`,
  ]);
  return { ...order, items, events };
}

const orderColumns = () => sql`
  id, reference, user_id, kind, status, fulfillment, customer_name, customer_phone, customer_email,
  delivery_area, customer_note, gift_message, total, referral_code, payment_declared_at, paid_at,
  paid_amount, payment_reference, refunded_amount, reservation_expires_at, created_at`;

/** Une commande n'est visible que par son propriétaire. */
export async function getOrderForUser(userId: string, reference: string) {
  const [order] = await sql<Omit<OrderDetail, "items" | "events">[]>`
    select ${orderColumns()} from orders where reference = ${reference.toUpperCase()} and user_id = ${userId}`;
  return withDetails(order);
}

export async function getOrderById(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [order] = await sql<Omit<OrderDetail, "items" | "events">[]>`select ${orderColumns()} from orders where id = ${id}`;
  return withDetails(order);
}

export type OrderSummary = {
  id: string;
  reference: string;
  kind: "standard" | "reward";
  status: OrderStatus;
  fulfillment: Fulfillment;
  total: number;
  created_at: string;
  boxes: number;
  products: string;
};

export async function listOrdersForUser(userId: string) {
  return sql<OrderSummary[]>`
    select o.id, o.reference, o.kind, o.status, o.fulfillment, o.total, o.created_at,
      coalesce(sum(i.boxes), 0)::int as boxes,
      string_agg(distinct i.product_name, ', ') as products
    from orders o left join order_items i on i.order_id = o.id
    where o.user_id = ${userId}
    group by o.id order by o.created_at desc limit 100`;
}
