"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_LINKS, SECONDARY_LINKS } from "./admin-links";

function active(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administration" className="sticky top-20 hidden w-56 shrink-0 self-start lg:block">
      <ul className="space-y-1">
        {ADMIN_LINKS.filter((l) => !l.mobileOnly).map((link) => (
          <li key={link.href}>
            <Link href={link.href} aria-current={active(pathname, link.href) ? "page" : undefined} className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-night/75 transition hover:bg-white aria-[current=page]:bg-night aria-[current=page]:text-white">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={link.icon} /></svg>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 mb-2 px-3 text-xs font-bold tracking-widest text-muted uppercase">Gestion</p>
      <ul className="space-y-1">
        {SECONDARY_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} aria-current={active(pathname, link.href) ? "page" : undefined} className="block rounded-xl px-3 py-2 text-[0.95rem] font-medium text-night/75 transition hover:bg-white aria-[current=page]:bg-white aria-[current=page]:font-bold aria-[current=page]:text-night">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AdminTabBar({ badges }: { badges: Record<string, number> }) {
  const pathname = usePathname();
  const secondaryActive = SECONDARY_LINKS.some((l) => active(pathname, l.href));
  return (
    <nav aria-label="Administration" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="grid grid-cols-5">
        {ADMIN_LINKS.map((link) => {
          const isActive = link.href === "/admin/plus" ? secondaryActive || pathname === "/admin/plus" : active(pathname, link.href);
          const badge = badges[link.href] ?? 0;
          return (
            <li key={link.href}>
              <Link href={link.href} aria-current={isActive ? "page" : undefined} className="relative flex flex-col items-center gap-0.5 py-2.5 text-[0.7rem] font-semibold text-muted aria-[current=page]:text-night">
                <span className="relative grid h-8 w-12 place-items-center rounded-full transition [[aria-current=page]_&]:bg-lilac-soft">
                  <svg viewBox="0 0 24 24" className="size-[1.35rem]" fill="none" stroke="currentColor" strokeWidth={link.mobileOnly ? 3 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={link.icon} /></svg>
                  {badge > 0 ? <span className="absolute -top-1 right-0 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[0.65rem] font-bold text-white">{badge}</span> : null}
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
