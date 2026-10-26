import { Bang } from "@/components/brand";
import { CheckIcon } from "@/components/icons";
import { trackingSteps, type Fulfillment, type OrderStatus } from "@/lib/order-status";

/** Frise de tampons : où en est la commande, d'un coup d'œil. */
export function OrderProgress({ status, fulfillment, reached }: { status: OrderStatus; fulfillment: Fulfillment; reached: OrderStatus[] }) {
  const steps = trackingSteps(fulfillment);
  const seen = new Set(reached);
  if (seen.has("reward_requested")) seen.add("awaiting_payment");
  const currentIndex = steps.reduce((acc, step, index) => (seen.has(step.status) ? index : acc), 0);
  const stopped = status === "cancelled" || status === "refunded" || status === "expired";
  const finished = status === "delivered" || status === "picked_up";

  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Progression de la commande">
      {steps.map((step, index) => {
        const done = stopped ? seen.has(step.status) : index < currentIndex || finished;
        const current = index === currentIndex && !stopped && !finished;
        return (
          <li key={step.status} className="flex min-w-0 flex-col items-center gap-1.5 text-center">
            <span className="relative flex w-full items-center justify-center">
              {index > 0 ? (
                <span aria-hidden className={`absolute right-1/2 left-[-50%] top-1/2 mr-5 ml-5 border-t-2 ${done || current ? "border-violet/60" : "border-dotted border-kraft/60"}`} />
              ) : null}
              <span
                className={`relative grid size-10 place-items-center rounded-full ${
                  current
                    ? "bg-night text-white shadow-[0_8px_18px_-8px_rgb(14_18_54/0.7)]"
                    : done
                      ? `${index % 2 ? "rotate-[10deg]" : "-rotate-12"} border-2 border-violet bg-white text-violet`
                      : "border-2 border-dashed border-night/20 bg-white"
                }`}
              >
                {current ? <Bang className="h-5 w-3 text-lilac" /> : done ? <CheckIcon className="size-5" /> : null}
              </span>
            </span>
            <span className={`text-[0.68rem] leading-tight font-semibold sm:text-xs ${current ? "text-night" : done ? "text-violet" : "text-muted"}`}>
              {step.label}
              {current ? <span className="sr-only"> (étape actuelle)</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
