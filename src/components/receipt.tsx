import type { ReactNode } from "react";
import { Logo } from "./brand";

/** Code-barres décoratif, toujours le même pour une même référence. */
export function Barcode({ seed, className = "" }: { seed: string; className?: string }) {
  const bars: number[] = [];
  for (const char of `*${seed}*`) {
    const code = char.charCodeAt(0);
    bars.push((code % 3) + 1, ((code >> 2) % 2) + 1, ((code >> 3) % 3) + 1, 1);
  }
  return (
    <span aria-hidden className={`flex h-10 items-stretch justify-center gap-[2px] ${className}`}>
      {bars.map((width, index) => (
        <span key={index} className={index % 2 ? "" : "bg-night/85"} style={{ width: `${width}px` }} />
      ))}
    </span>
  );
}

/** Ticket de caisse KALIMA : logo, papier thermique dentelé, code-barres et « Merci ! » manuscrit. */
export function Receipt({
  title,
  titleId,
  meta,
  children,
  barcode = "KALIMA",
  thanks = true,
  className = "",
}: {
  title: string;
  titleId?: string;
  meta?: ReactNode;
  children: ReactNode;
  barcode?: string | null;
  thanks?: boolean;
  className?: string;
}) {
  return (
    <div className={`drop-shadow-[0_18px_30px_rgb(14_18_54/0.16)] ${className}`}>
      <div className="receipt bg-gradient-to-b from-paper via-paper to-[#f6efe2] px-6 pt-6 sm:px-7">
        <Logo className="mx-auto h-10 w-auto" />
        <h2 id={titleId} className="mt-3 text-center text-xs font-semibold tracking-[0.22em] text-night/70 uppercase">
          {title}
        </h2>
        {meta ? <p className="tabular mt-1 text-center text-xs text-muted">{meta}</p> : null}
        <div className="mt-4 border-t border-dashed border-night/25 pt-4">{children}</div>
        {barcode ? (
          <div className="mt-6 border-t border-dashed border-night/25 pt-4 text-center">
            <Barcode seed={barcode} />
            <p className="tabular mt-1 text-[0.65rem] tracking-[0.35em] text-night/60">{barcode}</p>
          </div>
        ) : null}
        {thanks ? <p className="hand mt-2 text-center text-2xl text-violet">Merci !</p> : null}
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

/** Tampon « PAYÉ » apposé une fois le paiement vérifié. */
export function PaidStamp({ date }: { date: string }) {
  return (
    <p className="mt-4 flex justify-center">
      <span className="inline-flex -rotate-6 flex-col items-center rounded-lg border-[3px] border-success/80 px-4 py-1 text-success">
        <span className="display text-xl tracking-[0.2em]">PAYÉ</span>
        <span className="text-[0.7rem] font-semibold">vérifié le {date}</span>
      </span>
    </p>
  );
}
