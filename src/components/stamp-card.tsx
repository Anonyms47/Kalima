import { Bang } from "./brand";
import { GiftIcon } from "./icons";

const SLOTS = 5;

/** Carte ambassadeur à tampons : un tampon par ami servi, la box au bout. */
export function StampCard({
  stamps,
  code,
  caption,
  className = "",
}: {
  stamps: number;
  code?: string;
  caption?: string;
  className?: string;
}) {
  const filled = Math.max(0, Math.min(SLOTS, stamps));
  return (
    <div className={`relative overflow-hidden rounded-[1.4rem] bg-violet p-6 text-white shadow-[var(--shadow-lift)] sm:p-7 ${className}`}>
      <Bang className="pointer-events-none absolute -top-4 -right-2 h-32 w-16 text-lilac/20" />
      {/* Libellé et légende sur une ligne, code en dessous : un long code (KALICHEIKH) garde toute la largeur. */}
      <div className="relative flex items-baseline justify-between gap-3">
        <p className="text-xs font-bold tracking-[0.2em] text-lilac uppercase">Carte ambassadeur</p>
        <p className="hand shrink-0 text-xl leading-none text-lilac">{caption ?? "1 tampon = 1 ami servi"}</p>
      </div>
      {code ? (
        <p className="display tabular relative mt-2 text-[clamp(1.6rem,8vw,2.1rem)] leading-none tracking-[0.1em] break-all">{code}</p>
      ) : (
        <p className="display relative mt-2 text-[1.7rem] leading-tight">KALIMA</p>
      )}
      <ol className="relative mt-7 flex items-center gap-1.5 sm:gap-2.5" aria-label={`${filled} tampon${filled > 1 ? "s" : ""} sur ${SLOTS}`}>
        {Array.from({ length: SLOTS }, (_, i) => (
          <li
            key={i}
            className={`grid size-10 shrink-0 place-items-center rounded-full sm:size-12 ${
              i < filled ? `${i % 2 ? "rotate-[14deg]" : "-rotate-12"} border-2 border-lilac text-lilac` : "border-2 border-dashed border-white/35"
            }`}
          >
            {i < filled ? <span className="hand text-lg leading-none">K!</span> : <span className="sr-only">tampon à venir</span>}
          </li>
        ))}
        <li className="grid size-10 shrink-0 place-items-center rounded-full bg-kraft text-night sm:size-12" aria-label="box offerte">
          <GiftIcon />
        </li>
      </ol>
    </div>
  );
}
