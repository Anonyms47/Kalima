"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bang, Logo } from "./brand";
import { useCart } from "./cart/cart-context";
import { ArrowIcon, BagIcon, ClockIcon, CloseIcon, MenuIcon, UserIcon, WhatsappIcon } from "./icons";

const NAV = [
  { href: "/gourmandises", label: "Nos gourmandises", hint: "Gaufres et mini pancakes" },
  { href: "/evenements", label: "Événements", hint: "Pour vos fêtes, dès 50 pièces" },
  { href: "/ambassadeurs", label: "Ambassadeurs", hint: "5 filleuls livrés, 1 box offerte" },
  { href: "/notre-histoire", label: "Notre histoire", hint: "La maison KALIMA" },
  { href: "/contact", label: "Contact", hint: "WhatsApp, Instagram, retrait" },
];

type Props = {
  signedIn: boolean;
  isStaff: boolean;
  whatsapp: string | null;
  hours: string;
};

export function SiteHeader({ signedIn, isStaff, whatsapp, hours }: Props) {
  const pathname = usePathname();
  const { count, ready, lastAdded } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Haut du menu mobile : bas réel du header (le bandeau de préproduction peut le décaler).
  const [menuTop, setMenuTop] = useState(68);
  const headerRef = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Le menu se referme quand la page change (liens, retour arrière).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

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
    firstLink.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const hasItems = ready && count > 0;
  const solid = scrolled || open;

  return (
    <header ref={headerRef} className="sticky top-0 z-40">
      {/* Fond flou sur un calque à part : un backdrop-filter sur le header lui-même
          enfermerait le menu mobile (position fixe) dans la hauteur du header. */}
      <div
        aria-hidden
        className={`absolute inset-0 border-b transition duration-300 ${
          solid
            ? "border-line/80 bg-cloud/90 shadow-[0_10px_30px_-22px_rgb(14_18_54/0.45)] backdrop-blur-md"
            : "border-transparent bg-cloud"
        }`}
      />
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 focus:rounded-full focus:bg-night focus:px-4 focus:py-2 focus:text-white">
        Aller au contenu
      </a>

      <div className="relative mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="shrink-0 transition hover:-rotate-2" aria-label="KALIMA, accueil">
          <Logo className="h-10 w-auto sm:h-11" priority />
        </Link>

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-0.5 rounded-full bg-mist/80 p-1 ring-1 ring-line/70">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[0.93rem] font-semibold text-night/70 transition hover:bg-white/70 hover:text-night aria-[current=page]:bg-white aria-[current=page]:text-night aria-[current=page]:shadow-[var(--shadow-soft)]"
                >
                  {isActive(item.href) ? <Bang className="h-3.5 w-2 text-lilac" /> : null}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          {isStaff ? (
            <Link href="/admin" className="btn-ghost btn-sm hidden xl:inline-flex">
              Administration
            </Link>
          ) : null}
          <Link
            href={signedIn ? "/compte" : "/connexion"}
            aria-current={isActive("/compte") || isActive("/connexion") ? "page" : undefined}
            className="grid size-11 place-items-center rounded-full text-night transition hover:bg-mist aria-[current=page]:bg-mist"
            aria-label={signedIn ? "Mon compte" : "Se connecter"}
          >
            <UserIcon />
          </Link>
          <Link
            href="/panier"
            className="relative inline-flex size-11 items-center justify-center gap-2 rounded-full bg-night text-white shadow-[0_8px_20px_-10px_rgb(14_18_54/0.6)] transition hover:bg-night-soft active:translate-y-px sm:w-auto sm:px-4"
            aria-label={hasItems ? `Panier, ${count} boîte${count > 1 ? "s" : ""}` : "Panier"}
          >
            <BagIcon className="size-[1.3rem]" />
            <span className="hidden text-sm font-semibold sm:inline">Panier</span>
            {hasItems ? (
              <span
                key={lastAdded}
                className="pop tabular absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-lilac px-1 text-[0.72rem] font-bold text-night ring-2 ring-cloud sm:static sm:min-w-6 sm:ring-0"
              >
                {count}
              </span>
            ) : null}
          </Link>
          <button
            ref={menuButton}
            type="button"
            className="grid size-11 place-items-center rounded-full text-night transition hover:bg-mist aria-expanded:bg-mist lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => {
              setMenuTop(Math.max(0, headerRef.current?.getBoundingClientRect().bottom ?? 68));
              setOpen((v) => !v);
            }}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="menu-mobile" style={{ top: menuTop }} className="fixed inset-x-0 bottom-0 z-40 overflow-y-auto bg-cloud lg:hidden">
          <nav aria-label="Menu" className="mx-auto flex min-h-full max-w-xl flex-col px-4 pt-4 pb-8 sm:px-6">
            <ul className="grid gap-2">
              {NAV.map((item, index) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href} className="rise" style={{ animationDelay: `${index * 40}ms` }}>
                    <Link
                      ref={index === 0 ? firstLink : undefined}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-4 transition hover:border-violet/40 aria-[current=page]:border-night aria-[current=page]:bg-night aria-[current=page]:text-white"
                    >
                      <span>
                        <span className="display block text-[1.45rem]">{item.label}</span>
                        <span className="mt-0.5 block text-sm text-muted group-aria-[current=page]:text-cloud/70">{item.hint}</span>
                      </span>
                      {active ? (
                        <Bang className="h-7 w-4 shrink-0 text-lilac" />
                      ) : (
                        <ArrowIcon className="size-5 shrink-0 text-violet transition group-hover:translate-x-0.5" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="rise mt-4 grid grid-cols-2 gap-2" style={{ animationDelay: `${NAV.length * 40}ms` }}>
              <Link href={signedIn ? "/compte" : "/connexion"} onClick={() => setOpen(false)} className="btn-ghost btn-sm">
                <UserIcon className="size-5" />
                {signedIn ? "Mon compte" : "Se connecter"}
              </Link>
              <Link href="/panier" onClick={() => setOpen(false)} className="btn-ghost btn-sm">
                <BagIcon className="size-5" />
                Panier{hasItems ? ` (${count})` : ""}
              </Link>
              {isStaff ? (
                <Link href="/admin" onClick={() => setOpen(false)} className="btn-ghost btn-sm col-span-2">
                  Administration
                </Link>
              ) : null}
            </div>

            <div className="rise mt-auto pt-8" style={{ animationDelay: `${(NAV.length + 1) * 40}ms` }}>
              <div className="rounded-[var(--radius-card)] bg-night p-5 text-cloud">
                <p className="hand text-xl text-lilac">Une question avant de commander ?</p>
                {hours ? (
                  <p className="mt-1 flex items-center gap-2 text-sm text-cloud/75">
                    <ClockIcon className="size-4 shrink-0" /> {hours}
                  </p>
                ) : null}
                {whatsapp ? (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-4 w-full">
                    <WhatsappIcon /> Écrire sur WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
