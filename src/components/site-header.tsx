"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bang, Logo } from "./brand";
import { useCart } from "./cart/cart-context";
import { BagIcon, CloseIcon, MenuIcon, UserIcon } from "./icons";

const NAV = [
  { href: "/gourmandises", label: "Nos gourmandises" },
  { href: "/evenements", label: "Événements" },
  { href: "/ambassadeurs", label: "Ambassadeurs" },
  { href: "/notre-histoire", label: "Notre histoire" },
];

export function SiteHeader({ signedIn, isStaff }: { signedIn: boolean; isStaff: boolean }) {
  const pathname = usePathname();
  const { count, ready, lastAdded } = useCart();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cloud/85 backdrop-blur-md">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-full focus:bg-night focus:px-4 focus:py-2 focus:text-white">
        Aller au contenu
      </a>
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="KALIMA, accueil" onClick={() => setOpen(false)}>
          <Logo className="h-10 w-auto sm:h-11" priority />
        </Link>

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="group relative rounded-full px-4 py-2 text-[0.95rem] font-semibold text-night/80 transition hover:text-night aria-[current=page]:text-night"
                >
                  {item.label}
                  <span className="absolute inset-x-4 -bottom-0.5 h-[3px] origin-left scale-x-0 rounded-full bg-lilac transition-transform duration-300 group-hover:scale-x-100 group-aria-[current=page]:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          {isStaff ? (
            <Link href="/admin" className="btn-ghost btn-sm hidden sm:inline-flex">
              Administration
            </Link>
          ) : null}
          <Link
            href={signedIn ? "/compte" : "/connexion"}
            className="grid size-11 place-items-center rounded-full text-night transition hover:bg-mist"
            aria-label={signedIn ? "Mon compte" : "Se connecter"}
          >
            <UserIcon />
          </Link>
          <Link
            href="/panier"
            className="relative grid size-11 place-items-center rounded-full bg-night text-white transition hover:bg-night-soft"
            aria-label={ready && count > 0 ? `Panier, ${count} boîte${count > 1 ? "s" : ""}` : "Panier"}
          >
            <BagIcon className="size-[1.35rem]" />
            {ready && count > 0 ? (
              <span key={lastAdded} className="pop tabular absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-lilac px-1 text-[0.72rem] font-bold text-night ring-2 ring-cloud">
                {count}
              </span>
            ) : null}
          </Link>
          <button
            ref={menuButton}
            type="button"
            className="grid size-11 place-items-center rounded-full text-night transition hover:bg-mist lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="menu-mobile" className="fixed inset-x-0 top-[4.25rem] bottom-0 z-40 overflow-y-auto bg-cloud lg:hidden">
          <nav aria-label="Menu" className="mx-auto flex max-w-6xl flex-col px-5 pt-6 pb-10">
            <ul className="flex flex-col">
              {NAV.map((item, index) => (
                <li key={item.href} className="rise border-b border-line" style={{ animationDelay: `${index * 45}ms` }}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="display flex items-center justify-between py-5 text-[2rem] text-night"
                  >
                    {item.label}
                    {isActive(item.href) ? <Bang className="h-7 w-4 text-lilac" /> : null}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 grid gap-3">
              <Link href={signedIn ? "/compte" : "/connexion"} onClick={() => setOpen(false)} className="btn-ghost">
                <UserIcon className="size-5" />
                {signedIn ? "Mon compte" : "Se connecter"}
              </Link>
              {isStaff ? (
                <Link href="/admin" onClick={() => setOpen(false)} className="btn-ghost">
                  Administration
                </Link>
              ) : null}
              <Link href="/contact" onClick={() => setOpen(false)} className="btn-ghost">
                Nous contacter
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
