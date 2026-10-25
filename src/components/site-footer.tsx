import Link from "next/link";
import type { Settings } from "@/lib/server/settings";
import { whatsappUrl } from "@/lib/whatsapp";
import { Bang, Logo } from "./brand";
import { ArrowIcon, ClockIcon, InstagramIcon, PhoneIcon, PinIcon, WhatsappIcon } from "./icons";

const shopLinks = [
  { href: "/gourmandises", label: "Nos gourmandises" },
  { href: "/box-famille", label: "Box famille" },
  { href: "/evenements", label: "Événements" },
  { href: "/ambassadeurs", label: "Ambassadeurs" },
  { href: "/notre-histoire", label: "Notre histoire" },
  { href: "/contact", label: "Contact" },
];

const infoLinks = [
  { href: "/infos/commande-et-retrait", label: "Livraison et retrait" },
  { href: "/infos/conditions-de-vente", label: "Conditions de vente" },
  { href: "/infos/informations-alimentaires", label: "Infos alimentaires" },
  { href: "/infos/confidentialite", label: "Confidentialité" },
];

function LinkList({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-lilac uppercase">
        <Bang className="h-3.5 w-2" /> {title}
      </p>
      <ul className="space-y-0.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="-mx-1 inline-flex min-h-10 items-center rounded-lg px-1 text-[0.95rem] text-cloud/85 transition hover:text-white focus-visible:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter({ settings }: { settings: Settings }) {
  const { contact, hours, pickup } = settings;
  const wa = contact.whatsapp_link || whatsappUrl(contact.whatsapp_number);
  const tel = contact.phone.replace(/[^\d+]/g, "");
  const iconLink =
    "grid size-11 place-items-center rounded-full bg-white/10 text-cloud transition hover:bg-lilac hover:text-night";

  // Sur téléphone, la barre « Ajouter au panier » fixe ne masque pas le bas du pied de page.
  return (
    <footer className="mt-auto bg-night text-cloud max-md:[body:has([data-sticky-cta])_&]:pb-24">
      {/* Appel à commander, masqué sur le panier qui a déjà son bouton. */}
      <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 md:pt-16 [body:has([data-hide-footer-cta])_&]:hidden">
        <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-violet px-6 py-8 sm:px-10 md:flex md:items-center md:justify-between md:gap-8 md:py-10">
          <Bang className="pointer-events-none absolute -top-6 right-4 h-40 w-20 text-lilac/25 md:right-10" />
          <div className="relative">
            <p className="hand text-2xl text-lilac">Une petite envie ?</p>
            <p className="display mt-1 max-w-md text-[1.7rem] text-white md:text-[2rem]">
              Composez votre boîte, on y glisse le petit mot.
            </p>
          </div>
          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row md:mt-0 md:shrink-0">
            <Link href="/gourmandises" className="btn bg-white text-night hover:bg-cloud active:translate-y-px">
              Commander <ArrowIcon />
            </Link>
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn border border-white/30 text-white hover:bg-white/10">
                <WhatsappIcon /> Nous écrire
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.25fr_0.8fr_0.9fr_1.15fr] md:gap-8 md:py-14">
        {/* Marque */}
        <div>
          <Link href="/" aria-label="Accueil KALIMA" className="inline-block -rotate-2 rounded-2xl bg-cloud px-4 py-3 shadow-[var(--shadow-lift)] transition hover:rotate-0">
            <Logo className="h-11 w-auto" />
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cloud/70">
            Gaufres et mini pancakes préparés à la commande, avec un petit mot glissé dans chaque boîte.
          </p>
          <div className="mt-5 flex gap-2">
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={iconLink} aria-label="WhatsApp KALIMA">
                <WhatsappIcon />
              </a>
            ) : null}
            {contact.instagram ? (
              <a
                href={`https://instagram.com/${contact.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className={iconLink}
                aria-label={`Instagram @${contact.instagram}`}
              >
                <InstagramIcon />
              </a>
            ) : null}
          </div>
        </div>

        {/* Liens : deux colonnes côte à côte sur téléphone */}
        <div className="grid grid-cols-2 gap-6 md:contents">
          <LinkList title="Boutique" links={shopLinks} />
          <LinkList title="Infos" links={infoLinks} />
        </div>

        {/* Contact */}
        <div className="rounded-[var(--radius-card)] bg-white/5 p-5 ring-1 ring-white/10 md:bg-transparent md:p-0 md:ring-0">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-lilac uppercase">
            <Bang className="h-3.5 w-2" /> Nous trouver
          </p>
          <ul className="space-y-3 text-[0.95rem] text-cloud/85">
            {contact.phone ? (
              <li>
                <a href={`tel:${tel}`} className="inline-flex items-center gap-3 transition hover:text-white">
                  <PhoneIcon className="size-5 shrink-0 text-lilac" />
                  {contact.phone}
                </a>
              </li>
            ) : null}
            {hours ? (
              <li className="flex items-start gap-3">
                <ClockIcon className="mt-0.5 size-5 shrink-0 text-lilac" />
                <span>{hours}</span>
              </li>
            ) : null}
            {pickup.area ? (
              <li className="flex items-start gap-3">
                <PinIcon className="mt-0.5 size-5 shrink-0 text-lilac" />
                <span>
                  Retrait à {pickup.area}
                  <span className="block text-sm text-cloud/60">Livraison convenue sur WhatsApp</span>
                </span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1.5 px-4 py-5 text-center text-xs text-cloud/55 sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <p>© {new Date().getFullYear()} KALIMA · Cake and bakery · Dakar</p>
          <p>
            Site réalisé par <span className="font-semibold text-cloud/80">Drifty</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
