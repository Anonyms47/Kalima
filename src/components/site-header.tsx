"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bang, Logo } from "./brand";
import { useCart } from "./cart/cart-context";
import { Squiggle } from "./doodles";
import { BagIcon, InstagramIcon, UserIcon, WhatsappIcon } from "./icons";

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
  instagram: string;
  hours: string;
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Trois traits qui se croisent en « X » à l'ouverture. */
function BurgerIcon({ open }: { open: boolean }) {
  const bar = "absolute left-0 h-[2px] rounded-full bg-current transition duration-300 ease-[var(--ease-out-soft)] motion-reduce:transition-none";
  return (
    <span aria-hidden className="relative block h-3.5 w-5">
      <span className={`${bar} top-0 w-5 ${open ? "translate-y-[6px] rotate-45" : ""}`} />
      <span className={`${bar} top-[6px] w-5 ${open ? "scale-x-0 opacity-0" : ""}`} />
      <span className={`${bar} top-[12px] ${open ? "w-5 -translate-y-[6px] -rotate-45" : "w-3.5"}`} />
    </span>
  );
}

export function SiteHeader({ signedIn, isStaff, whatsapp, instagram, hours }: Props) {
  const pathname = usePathname();
  const { count, ready, lastAdded } = useCart();
  const [open, setOpen] = useState(false);
  const [openings, setOpenings] = useState(0);
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
    const close = () => {
      setOpen(false);
      menuButton.current?.focus();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      // La tabulation reste dans l'en-tête et le menu tant qu'il est ouvert.
      if (event.key === "Tab" && headerRef.current) {
        const items = [...headerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    // Passage en affichage ordinateur : le menu mobile n'a plus lieu d'être.
    const desktop = window.matchMedia("(min-width: 64rem)");
    const onDesktop = () => desktop.matches && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    firstLink.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
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
            className="grid size-11 place-items-center rounded-full text-night transition hover:bg-mist aria-expanded:bg-night aria-expanded:text-white lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => {
              setMenuTop(Math.max(0, headerRef.current?.getBoundingClientRect().bottom ?? 68));
              if (!open) setOpenings((n) => n + 1);
              setOpen((v) => !v);
            }}
          >
            <BurgerIcon open={open} />
          </button>
        </div>
      </div>

      {/* La visibilité ne s'anime qu'à la fermeture : à l'ouverture, le menu doit être
          visible tout de suite pour recevoir le focus. */}
      <div
        id="menu-mobile"
        inert={!open}
        style={{ top: menuTop }}
        className={`fixed inset-x-0 bottom-0 z-40 flex flex-col bg-paper duration-300 ease-[var(--ease-out-soft)] motion-reduce:transition-none lg:hidden ${
          open ? "visible translate-y-0 opacity-100 transition-[opacity,transform]" : "invisible -translate-y-2 opacity-0 transition-[opacity,transform,visibility]"
        }`}
      >
        {/* La clé rejoue l'apparition échelonnée à chaque ouverture. */}
        <nav key={openings} aria-label="Menu" className="mx-auto w-full max-w-xl flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-6 sm:px-6">
          <p aria-hidden className="hand rise -rotate-2 text-2xl text-kraft-deep">On va où ?</p>
          <ul className="mt-1 divide-y-2 divide-dotted divide-kraft/35">
            {NAV.map((item, index) => {
              const active = isActive(item.href);
              return (
                <li key={item.href} className="rise" style={{ animationDelay: `${(index + 1) * 40}ms` }}>
                  <Link
                    ref={index === 0 ? firstLink : undefined}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className="group flex items-center justify-between gap-4 py-3 [@media(max-height:700px)]:py-1.5"
                  >
                    <span className="min-w-0">
                      <span className="display relative inline-block text-[1.9rem] leading-tight text-night [@media(max-height:700px)]:text-[1.6rem]">
                        {item.label}
                        {active ? <Squiggle className="absolute -bottom-1.5 left-0 h-2.5 w-full text-lilac" /> : null}
                      </span>
                      <span className="hand block text-xl leading-tight text-violet/75">{item.hint}</span>
                    </span>
                    {active ? (
                      <Bang className="h-8 w-4 shrink-0 text-lilac" />
                    ) : (
                      <span aria-hidden className="hand shrink-0 text-3xl text-violet/50 transition group-hover:translate-x-1 group-hover:text-violet">
                        →
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="rise mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.95rem] font-semibold" style={{ animationDelay: `${(NAV.length + 1) * 40}ms` }}>
            <Link href={signedIn ? "/compte" : "/connexion"} onClick={() => setOpen(false)} className="inline-flex items-center gap-1.5 text-night underline decoration-lilac decoration-2 underline-offset-4">
              <UserIcon className="size-5" />
              {signedIn ? "Mon compte" : "Se connecter"}
            </Link>
            {isStaff ? (
              <>
                <Bang className="h-4 w-2.5 text-lilac" />
                <Link href="/admin" onClick={() => setOpen(false)} className="text-night underline decoration-lilac decoration-2 underline-offset-4">
                  Administration
                </Link>
              </>
            ) : null}
            {instagram ? (
              <>
                <Bang className="h-4 w-2.5 text-lilac" />
                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-night underline decoration-lilac decoration-2 underline-offset-4">
                  <InstagramIcon /> @{instagram}
                </a>
              </>
            ) : null}
          </p>
        </nav>

        {whatsapp ? (
          <div className="border-t-2 border-dashed border-kraft/60 bg-kraft-soft px-5 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] sm:px-6">
            <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
              <p className="leading-tight">
                <span className="hand block text-2xl text-kraft-deep">Une question ?</span>
                {hours ? <span className="text-xs text-night/70">{hours}</span> : null}
              </p>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-whatsapp btn-sm shrink-0">
                <WhatsappIcon /> Écrivez-nous
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
