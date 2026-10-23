import type { ReactNode } from "react";

/**
 * Signature KALIMA : le petit mot glissé dans chaque commande.
 * Le texte manuscrit reste court ; le reste est en police lisible.
 */
export function Note({
  children,
  signature,
  tilt = "-rotate-[1.5deg]",
  className = "",
}: {
  children: ReactNode;
  signature?: string;
  tilt?: string;
  className?: string;
}) {
  return (
    <figure className={`note-card ${tilt} ${className}`}>
      <blockquote className="hand text-[1.6rem] leading-[2rem] text-violet">{children}</blockquote>
      {signature ? <figcaption className="hand mt-2 text-right text-xl text-night/80">— {signature}</figcaption> : null}
    </figure>
  );
}
