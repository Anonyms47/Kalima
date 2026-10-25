import { trackingSteps, type Fulfillment, type OrderStatus } from "@/lib/order-status";
import { formatDate } from "@/lib/format";
import { Bang } from "./brand";
import { CheckIcon } from "./icons";

type Event = { to_status: OrderStatus; created_at: string };

/** Suivi en tampons : étapes passées tamponnées, étape actuelle en bleu nuit, à venir en pointillés. */
export function OrderTimeline({ status, fulfillment, events }: { status: OrderStatus; fulfillment: Fulfillment; events: Event[] }) {
  const steps = trackingSteps(fulfillment);
  const reached = new Map<OrderStatus, string>();
  for (const e of events) if (!reached.has(e.to_status)) reached.set(e.to_status, e.created_at);
  if (reached.has("reward_requested")) reached.set("awaiting_payment", reached.get("reward_requested")!);
  const currentIndex = steps.reduce((acc, step, index) => (reached.has(step.status) ? index : acc), 0);
  const stopped = status === "cancelled" || status === "refunded" || status === "expired";

  return (
    <ol className="relative">
      {steps.map((step, index) => {
        const done = stopped ? reached.has(step.status) : index < currentIndex;
        const current = index === currentIndex && !stopped;
        const date = reached.get(step.status);
        return (
          <li key={step.status} className="relative flex gap-4 pb-7 last:pb-0">
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className={`absolute top-11 left-[1.3rem] h-[calc(100%-2.75rem)] border-l-2 ${index < currentIndex && !stopped ? "border-solid border-violet/60" : "border-dotted border-kraft/60"}`}
              />
            ) : null}
            <span
              className={`relative grid size-11 shrink-0 place-items-center rounded-full ${
                current
                  ? "bg-night text-white shadow-[0_8px_18px_-8px_rgb(14_18_54/0.7)]"
                  : done
                    ? `${index % 2 ? "rotate-[10deg]" : "-rotate-12"} border-2 border-violet bg-white text-violet`
                    : "border-2 border-dashed border-night/20 bg-white"
              }`}
            >
              {current ? <Bang className="h-5 w-3 text-lilac" /> : done ? <CheckIcon className="size-5" /> : null}
            </span>
            <div className="pt-2">
              <p className={current ? "display text-xl text-night" : done ? "font-semibold text-night" : "font-semibold text-muted"}>
                {step.label}
                {current ? <span className="sr-only"> (étape actuelle)</span> : null}
              </p>
              {date && (done || current) ? <p className="hand text-lg leading-tight text-violet/80">{formatDate(date)}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
