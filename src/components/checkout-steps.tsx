import { CheckIcon } from "./icons";

const STEPS = ["Panier", "Vos informations", "Paiement"];

/** Fil d'étapes de la commande (1 = panier, 2 = informations, 3 = paiement). */
export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label={`Étape ${current} sur ${STEPS.length}`}>
      <ol className="flex items-center gap-2 text-sm font-semibold">
        {STEPS.map((label, index) => {
          const step = index + 1;
          const done = step < current;
          const active = step === current;
          return (
            <li key={label} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs ${
                  active ? "bg-night text-white" : done ? "bg-lilac text-night" : "bg-mist text-muted"
                }`}
              >
                {done ? <CheckIcon className="size-4" /> : step}
              </span>
              <span className={`${active ? "text-night" : "hidden text-muted sm:inline"}`}>{label}</span>
              {step < STEPS.length ? <span aria-hidden className="h-px w-5 bg-line sm:w-8" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
