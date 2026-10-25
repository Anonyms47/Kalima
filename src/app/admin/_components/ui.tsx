import Link from "next/link";
import type { ReactNode } from "react";
import { Bang } from "@/components/brand";
import { BackIcon } from "@/components/icons";

export function AdminHeader({
  title,
  kicker,
  subtitle,
  back,
  actions,
}: {
  title: string;
  kicker?: string;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <header className="mb-7">
      {back ? (
        <Link href={back.href} className="group mb-2 inline-flex min-h-10 items-center gap-1.5 text-violet">
          <BackIcon className="size-4 transition group-hover:-translate-x-0.5" />
          <span className="hand text-xl">{back.label.toLowerCase()}</span>
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {kicker ? <p className="hand -rotate-1 text-2xl text-violet">{kicker}</p> : null}
          <h1 className="display text-3xl leading-tight sm:text-[2.6rem]">{title}</h1>
          {subtitle ? <div className="mt-1 text-night/70">{subtitle}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

/** Fiche de travail. `focus` met en avant ce qui est à faire maintenant. */
export function Panel({
  title,
  hint,
  children,
  className = "",
  actions,
  focus = false,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  focus?: boolean;
}) {
  return (
    <section
      className={`relative rounded-[1.3rem] p-5 sm:p-6 ${
        focus ? "border-2 border-violet bg-white shadow-[var(--shadow-lift)]" : "border border-line/80 bg-white shadow-[var(--shadow-soft)]"
      } ${className}`}
    >
      {focus ? <span aria-hidden className="absolute -top-3 left-8 h-6 w-20 -rotate-3 rounded-sm bg-lilac/80" /> : null}
      {title ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {hint ? <p className="hand text-lg leading-none text-violet">{hint}</p> : null}
            <h2 className="display flex items-center gap-2 text-xl">
              {focus ? <Bang className="h-5 w-3 text-violet" /> : null}
              {title}
            </h2>
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[1.3rem] border-2 border-dashed border-kraft/50 bg-paper px-5 py-10 text-center">
      <p className="hand text-2xl text-kraft-deep">{children}</p>
    </div>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "success" | "warning" | "danger" | "violet" | "night" }) {
  const tones = {
    muted: "bg-mist text-muted",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    violet: "bg-lilac-soft text-violet-deep",
    night: "bg-night text-white",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${tones[tone]}`}>{children}</span>;
}

/** Petit compteur rond (onglets, menu). */
export function Count({ value, tone = "violet" }: { value: number; tone?: "violet" | "light" }) {
  if (value <= 0) return null;
  return (
    <span
      className={`tabular grid min-w-6 place-items-center rounded-full px-1.5 text-xs leading-6 font-bold ${
        tone === "violet" ? "bg-violet text-white" : "bg-lilac text-night"
      }`}
    >
      {value}
    </span>
  );
}
