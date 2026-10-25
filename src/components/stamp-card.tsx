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
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-lilac uppercase">Carte ambassadeur</p>
          {code ? (
            <p className="display tabular mt-2 text-[2.1rem] leading-none tracking-[0.12em]">{code}</p>
          ) : (
            <p className="display mt-2 text-[1.7rem] leading-tight">KALIMA</p>
          )}
        </div>
        <p className="hand shrink-0 text-xl text-lilac">{caption ?? "1 tampon = 1 ami servi"}</p>
      </div>
      <ol className="relative mt-7 flex flex-wrap items-center gap-2.5" aria-label={`${filled} tampon${filled > 1 ? "s" : ""} sur ${SLOTS}`}>
        {Array.from({ length: SLOTS }, (_, i) => (
          <li
            key={i}
            className={`grid size-12 place-items-center rounded-full ${
              i < filled ? `${i % 2 ? "rotate-[14deg]" : "-rotate-12"} border-2 border-lilac text-lilac` : "border-2 border-dashed border-white/35"
            }`}
          >
            {i < filled ? <span className="hand text-lg leading-none">K!</span> : <span className="sr-only">tampon à venir</span>}
          </li>
        ))}
        <li className="grid size-12 place-items-center rounded-full bg-kraft text-night" aria-label="box offerte">
          <GiftIcon />
        </li>
      </ol>
    </div>
  );
}
