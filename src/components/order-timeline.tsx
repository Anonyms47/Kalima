import { trackingSteps, type Fulfillment, type OrderStatus } from "@/lib/order-status";
import { formatDate } from "@/lib/format";
import { Bang } from "./brand";
import { CheckIcon } from "./icons";

type Event = { to_status: OrderStatus; created_at: string };

export function OrderTimeline({ status, fulfillment, events }: { status: OrderStatus; fulfillment: Fulfillment; events: Event[] }) {
  const steps = trackingSteps(fulfillment);
  const reached = new Map<OrderStatus, string>();
  for (const e of events) if (!reached.has(e.to_status)) reached.set(e.to_status, e.created_at);
  if (reached.has("reward_requested")) reached.set("awaiting_payment", reached.get("reward_requested")!);
  const currentIndex = steps.reduce((acc, step, index) => (reached.has(step.status) ? index : acc), 0);
  const stopped = status === "cancelled" || status === "refunded" || status === "expired";

  return (
    <ol className="relative space-y-0">
      {steps.map((step, index) => {
        const done = stopped ? reached.has(step.status) : index < currentIndex;
        const current = index === currentIndex && !stopped;
        const date = reached.get(step.status);
        return (
          <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0">
            {index < steps.length - 1 ? (
              <span aria-hidden className={`absolute top-9 left-[1.05rem] h-[calc(100%-2.25rem)] w-0.5 ${index < currentIndex && !stopped ? "bg-violet" : "bg-line"}`} />
            ) : null}
            <span
              className={`relative grid size-9 shrink-0 place-items-center rounded-full border-2 ${
                current ? "border-violet bg-violet text-white" : done ? "border-violet bg-white text-violet" : "border-line bg-white text-line"
              }`}
            >
              {current ? <Bang className="h-4 w-2.5 text-lilac" /> : done ? <CheckIcon className="size-4" /> : <span className="size-2 rounded-full bg-line" />}
            </span>
            <div className="pt-1.5">
              <p className={`font-semibold ${done || current ? "text-night" : "text-muted"}`}>
                {step.label}
                {current ? <span className="sr-only"> (étape actuelle)</span> : null}
              </p>
              {date && (done || current) ? <p className="text-sm text-muted">{formatDate(date)}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
