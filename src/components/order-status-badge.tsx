import { STATUS_LABELS, type OrderStatus } from "@/lib/order-status";

const TONES: Record<OrderStatus, string> = {
  awaiting_payment: "bg-warning-soft text-warning",
  expired: "bg-mist text-muted",
  reward_requested: "bg-lilac-soft text-violet-deep",
  confirmed: "bg-lilac-soft text-violet-deep",
  in_production: "bg-kraft-soft text-kraft-deep",
  out_for_delivery: "bg-violet text-white",
  ready_for_pickup: "bg-violet text-white",
  delivered: "bg-success-soft text-success",
  picked_up: "bg-success-soft text-success",
  cancelled: "bg-mist text-muted",
  refunded: "bg-mist text-muted",
};

export function OrderStatusBadge({ status, className = "" }: { status: OrderStatus; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${TONES[status]} ${className}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
