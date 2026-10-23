import type { ReactNode } from "react";
import { Bang } from "./brand";

export function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-20 sm:px-6 md:pt-16">
      <p className="eyebrow"><Bang className="h-4 w-2.5 text-lilac" /> {eyebrow}</p>
      <h1 className="display mt-3 text-5xl">{title}</h1>
      {intro ? <p className="mt-4 text-lg leading-relaxed text-muted">{intro}</p> : null}
      <div className="mt-10 space-y-8 text-[1.02rem] leading-relaxed [&_h2]:display [&_h2]:text-2xl [&_h2]:text-night [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-1.5">
        {children}
      </div>
    </div>
  );
}

export function PendingContent({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line bg-white px-5 py-4 text-muted">{children}</p>;
}
