import type { ReactNode } from "react";

/** Carte papier scotchée, comme le petit mot glissé dans les boîtes. */
export function PaperCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-[1.3rem] border border-[#efe4d2] bg-paper p-6 shadow-[var(--shadow-lift)] sm:p-8 ${className}`}>
      <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-3 rounded-sm bg-lilac/80" />
      {children}
    </div>
  );
}
