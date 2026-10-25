import { Squiggle } from "./doodles";
import { CheckIcon } from "./icons";

const STEPS = ["Panier", "Vos informations", "Paiement"];

/** Fil d'étapes de la commande, en tampons (1 = panier, 2 = informations, 3 = paiement). */
export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label={`Étape ${current} sur ${STEPS.length}`}>
      <ol className="flex items-center gap-2 sm:gap-3">
        {STEPS.map((label, index) => {
          const step = index + 1;
          const done = step < current;
          const active = step === current;
          return (
            <li key={label} className="flex items-center gap-2 sm:gap-3" aria-current={active ? "step" : undefined}>
              <span
                className={`display grid size-8 shrink-0 place-items-center rounded-full text-sm ${
                  active
                    ? "bg-night text-white shadow-[0_6px_14px_-6px_rgb(14_18_54/0.6)]"
                    : done
                      ? "-rotate-12 border-2 border-violet text-violet"
                      : "border-2 border-dashed border-night/25 text-muted"
                }`}
              >
                {done ? <CheckIcon className="size-4" /> : step}
              </span>
              <span
                className={
                  active
                    ? "display relative text-[1.05rem] text-night"
                    : done
                      ? "hand hidden text-xl text-violet sm:inline"
                      : "hidden text-sm font-semibold text-muted sm:inline"
                }
              >
                {label}
                {active ? <Squiggle className="absolute -bottom-1.5 left-0 h-2 w-full text-lilac" /> : null}
              </span>
              {step < STEPS.length ? <span aria-hidden className="w-5 border-t-2 border-dotted border-kraft/60 sm:w-10" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
