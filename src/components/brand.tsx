import Image from "next/image";

/** Logo officiel « Kalima! Cake and bakery » (proportions d'origine 316 × 162). */
export function Logo({ className = "h-11 w-auto", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/logo-kalima.png"
      alt="Kalima! Cake and bakery"
      width={316}
      height={162}
      priority={priority}
      className={className}
    />
  );
}

/** Le point d'exclamation lilas du logo, utilisé comme motif discret. */
export function Bang({ className = "h-5 w-3", title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 48"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      fill="currentColor"
    >
      {title ? <title>{title}</title> : null}
      <g transform="rotate(12 12 24)">
        <path d="M8.2 2.6c2.6-1.3 6.8-1.1 8.6.4 1.6 1.4 1.4 4.4 1 8.2l-1.6 15.4c-.3 2.6-1.7 3.9-4 3.9s-3.6-1.3-3.9-3.8L6.4 11.4c-.5-4.1-.6-7.5 1.8-8.8Z" />
        <path d="M12.3 35.2c2.8 0 5 2.1 5 4.8s-2.2 5-5.1 5-5-2.2-5-4.9 2.3-4.9 5.1-4.9Z" />
      </g>
    </svg>
  );
}
