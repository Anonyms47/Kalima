"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bang } from "@/components/brand";
import { ADMIN_LINKS, SECONDARY_LINKS } from "./admin-links";
import { Count } from "./ui";

function active(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function Icon({ d, className = "size-5", bold = false }: { d: string; className?: string; bold?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={bold ? 3 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

/** Carnet de l'atelier : les quatre pages du quotidien, puis le reste. */
export function AdminSidebar({ badges, signOut }: { badges: Record<string, number>; signOut: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Administration" className="sticky top-24 hidden w-60 shrink-0 self-start lg:block">
      <div className="relative rounded-[1.4rem] border border-[#efe4d2] bg-paper p-3 shadow-[var(--shadow-soft)]">
        <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-2 rounded-sm bg-lilac/80" />
        <ul className="space-y-1 pt-2">
          {ADMIN_LINKS.filter((l) => !l.mobileOnly).map((link) => {
            const isActive = active(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className="group flex min-h-12 items-center gap-3 rounded-2xl px-3 font-semibold text-night/75 transition hover:bg-kraft-soft/70 hover:text-night aria-[current=page]:bg-night aria-[current=page]:text-white aria-[current=page]:shadow-[0_10px_22px_-12px_rgb(14_18_54/0.8)]"
                >
                  <Icon d={link.icon} />
                  <span className="flex-1">{link.label}</span>
                  {isActive ? <Bang className="h-4 w-2.5 text-lilac" /> : <Count value={badges[link.href] ?? 0} />}
                  {badges[link.href] ? <span className="sr-only"> ({badges[link.href]} à traiter)</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="hand mt-4 border-t-2 border-dotted border-kraft/40 px-3 pt-3 text-xl text-kraft-deep">et le reste…</p>
        <ul className="mt-1 space-y-0.5">
          {SECONDARY_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active(pathname, link.href) ? "page" : undefined}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-[0.95rem] font-medium text-night/75 transition hover:bg-kraft-soft/70 hover:text-night aria-[current=page]:bg-white aria-[current=page]:font-bold aria-[current=page]:text-night aria-[current=page]:shadow-[var(--shadow-soft)]"
              >
                {link.label}
                <Count value={badges[link.href] ?? 0} />
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-3 border-t-2 border-dotted border-kraft/40 px-1 pt-3">{signOut}</div>
      </div>
    </nav>
  );
}

export function AdminTabBar({ badges }: { badges: Record<string, number> }) {
  const pathname = usePathname();
  const secondaryActive = SECONDARY_LINKS.some((l) => active(pathname, l.href));
  const secondaryBadge = SECONDARY_LINKS.reduce((sum, l) => sum + (badges[l.href] ?? 0), 0);
  return (
    <nav aria-label="Administration" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-dashed border-kraft/50 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="grid grid-cols-5">
        {ADMIN_LINKS.map((link) => {
          const isMore = link.href === "/admin/plus";
          const isActive = isMore ? secondaryActive || pathname === "/admin/plus" : active(pathname, link.href);
          const badge = isMore ? secondaryBadge : (badges[link.href] ?? 0);
          return (
            <li key={link.href}>
              <Link href={link.href} aria-current={isActive ? "page" : undefined} className="relative flex flex-col items-center gap-0.5 py-2.5 text-[0.7rem] font-semibold text-muted aria-[current=page]:text-night">
                <span className="relative grid h-8 w-12 place-items-center rounded-full transition [[aria-current=page]_&]:bg-night [[aria-current=page]_&]:text-white">
                  <Icon d={link.icon} className="size-[1.35rem]" bold={link.mobileOnly} />
                  {badge > 0 ? (
                    <span className="absolute -top-1.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-violet px-1 text-[0.65rem] leading-5 font-bold text-white ring-2 ring-paper">{badge}</span>
                  ) : null}
                </span>
                {link.short}
                {badge > 0 ? <span className="sr-only"> ({badge} à traiter)</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
