import type { ReactNode } from "react";

/** Ticket de caisse KALIMA : papier dentelé, en-tête et « Merci ! » manuscrit. */
export function Receipt({
  title,
  titleId,
  children,
  thanks = true,
  className = "",
}: {
  title: string;
  titleId?: string;
  children: ReactNode;
  thanks?: boolean;
  className?: string;
}) {
  return (
    <div className={`drop-shadow-[0_18px_30px_rgb(14_18_54/0.16)] ${className}`}>
      <div className="receipt px-6 pt-7 sm:px-7">
        <p className="display text-center text-2xl tracking-wide">KALIMA</p>
        <h2 id={titleId} className="mt-1 text-center text-xs tracking-[0.2em] text-muted uppercase">
          {title}
        </h2>
        <div className="mt-4 border-t border-dashed border-night/25 pt-4">{children}</div>
        {thanks ? <p className="hand mt-4 text-center text-2xl text-violet">Merci !</p> : null}
      </div>
    </div>
  );
}

/** Ligne du ticket avec points de conduite (à placer dans un <dl>). */
export function ReceiptLine({ label, value, detail, muted = false }: { label: ReactNode; value: ReactNode; detail?: ReactNode; muted?: boolean }) {
  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 ${muted ? "text-muted" : ""}`}>
      {/* Points de conduite dans le <dt> : un <dl> n'accepte que des <dt> et des <dd>. */}
      <dt className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="min-w-0 truncate">{label}</span>
        <span aria-hidden className="min-w-4 flex-1 translate-y-[-0.3em] border-b border-dotted border-night/30" />
      </dt>
      <dd className="tabular shrink-0">{value}</dd>
      {detail ? <dd className="mt-0.5 basis-full text-xs leading-snug text-muted">{detail}</dd> : null}
    </div>
  );
}

/** Ligne du total, séparée par des tirets. */
export function ReceiptTotal({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-dashed border-night/25 pt-3">
      <dt className="text-sm font-bold tracking-[0.14em] uppercase">{label}</dt>
      <dd className="display tabular text-3xl" aria-live="polite">
        {value}
      </dd>
    </div>
  );
}
