// Traits dessinés à la main, comme les annotations au feutre sur les boîtes.

type DoodleProps = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Flèche courbe, pointe en bas à droite. */
export function CurlyArrow({ className = "h-14 w-20" }: DoodleProps) {
  return (
    <svg viewBox="0 0 80 56" className={className} {...stroke}>
      <path d="M4 8c14-6 32-4 40 8 6 9 2 18-6 17-7-1-6-11 3-14 12-4 22 6 28 24" />
      <path d="M60 36l9 8 4-12" />
    </svg>
  );
}

/** Flèche simple légèrement tremblée, pointe vers la gauche. */
export function SketchArrow({ className = "h-8 w-16" }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 32" className={className} {...stroke}>
      <path d="M60 18c-14 2-30 1-52-3" />
      <path d="M16 6 7 15l11 7" />
    </svg>
  );
}

/** Soulignement en vague, à placer sous un mot. */
export function Squiggle({ className = "h-3 w-40" }: DoodleProps) {
  return (
    <svg viewBox="0 0 160 12" preserveAspectRatio="none" className={className} {...stroke}>
      <path d="M2 8c10-6 18-6 26 0s16 6 26 0 18-6 26 0 16 6 26 0 18-6 26 0 14 4 24-2" />
    </svg>
  );
}

/** Petit cœur griffonné. */
export function ScribbleHeart({ className = "size-6" }: DoodleProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} {...stroke}>
      <path d="M16 27C6 20 3 14 5 9c2-4 8-5 11 1 3-6 9-5 11-1 2 5-1 11-11 18Z" />
    </svg>
  );
}

/** Enveloppe griffonnée, pour le code envoyé par e-mail. */
export function ScribbleEnvelope({ className = "h-10 w-14" }: DoodleProps) {
  return (
    <svg viewBox="0 0 56 40" className={className} {...stroke}>
      <path d="M4 7c16-1 32-2 48 0 1 9 1 18-1 27-15 2-31 2-46 0-2-9-2-18-1-27Z" />
      <path d="M5 8c8 7 15 12 23 15 8-3 15-9 23-15" />
      <path d="M6 33c6-6 11-10 15-12M50 33c-6-6-10-9-14-11" />
    </svg>
  );
}
