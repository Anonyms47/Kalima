export type OrderStatus =
  | "awaiting_payment"
  | "expired"
  | "reward_requested"
  | "confirmed"
  | "in_production"
  | "out_for_delivery"
  | "delivered"
  | "ready_for_pickup"
  | "picked_up"
  | "cancelled"
  | "refunded";

export type Fulfillment = "delivery" | "pickup";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: "Paiement en attente",
  expired: "Réservation expirée",
  reward_requested: "Récompense à valider",
  confirmed: "Confirmée",
  in_production: "En confection",
  out_for_delivery: "En livraison",
  delivered: "Livrée",
  ready_for_pickup: "Prête à retirer",
  picked_up: "Retirée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

/** Étapes affichées dans le suivi, selon le mode de réception. */
export function trackingSteps(fulfillment: Fulfillment): { status: OrderStatus; label: string }[] {
  const common = [
    { status: "awaiting_payment" as const, label: "Commande enregistrée" },
    { status: "confirmed" as const, label: "Paiement vérifié" },
    { status: "in_production" as const, label: "En confection" },
  ];
  return fulfillment === "delivery"
    ? [...common, { status: "out_for_delivery", label: "En route" }, { status: "delivered", label: "Livrée" }]
    : [...common, { status: "ready_for_pickup", label: "Prête à retirer" }, { status: "picked_up", label: "Retirée" }];
}

/** Transitions autorisées pour l'équipe. */
export const STAFF_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  awaiting_payment: ["confirmed", "cancelled"],
  expired: ["confirmed", "cancelled"],
  reward_requested: ["confirmed", "cancelled"],
  confirmed: ["in_production", "cancelled"],
  in_production: ["out_for_delivery", "ready_for_pickup", "cancelled"],
  out_for_delivery: ["delivered"],
  ready_for_pickup: ["picked_up"],
  delivered: ["refunded"],
  picked_up: ["refunded"],
  cancelled: ["refunded"],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus, fulfillment: Fulfillment) {
  if (!STAFF_TRANSITIONS[from].includes(to)) return false;
  if (to === "out_for_delivery" || to === "delivered") return fulfillment === "delivery";
  if (to === "ready_for_pickup" || to === "picked_up") return fulfillment === "pickup";
  return true;
}

export const PAID_STATUSES: OrderStatus[] = [
  "confirmed",
  "in_production",
  "out_for_delivery",
  "delivered",
  "ready_for_pickup",
  "picked_up",
];

export const COMPLETED_STATUSES: OrderStatus[] = ["delivered", "picked_up"];
