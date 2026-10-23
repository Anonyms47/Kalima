import Link from "next/link";
import type { Settings } from "@/lib/server/settings";
import { whatsappUrl } from "@/lib/whatsapp";
import { Bang, Logo } from "./brand";
import { InstagramIcon, WhatsappIcon } from "./icons";

export function SiteFooter({ settings }: { settings: Settings }) {
  const wa = settings.contact.whatsapp_link || whatsappUrl(settings.contact.whatsapp_number);
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo className="h-12 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Gaufres et mini pancakes préparés à la commande, avec un petit mot glissé dans chaque boîte.
          </p>
          <div className="mt-5 flex gap-2">
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="grid size-11 place-items-center rounded-full bg-mist text-night transition hover:bg-lilac-soft" aria-label="WhatsApp KALIMA">
                <WhatsappIcon />
              </a>
            ) : null}
            {settings.contact.instagram ? (
              <a href={`https://instagram.com/${settings.contact.instagram}`} target="_blank" rel="noopener noreferrer" className="grid size-11 place-items-center rounded-full bg-mist text-night transition hover:bg-lilac-soft" aria-label={`Instagram @${settings.contact.instagram}`}>
                <InstagramIcon />
              </a>
            ) : null}
          </div>
        </div>
        <nav aria-label="Boutique">
          <p className="eyebrow mb-3">
            <Bang className="h-3.5 w-2 text-lilac" /> Boutique
          </p>
          <ul className="space-y-2.5 text-[0.95rem]">
            <li><Link className="hover:text-violet" href="/gourmandises">Nos gourmandises</Link></li>
            <li><Link className="hover:text-violet" href="/evenements">Événements et anniversaires</Link></li>
            <li><Link className="hover:text-violet" href="/ambassadeurs">Programme ambassadeur</Link></li>
            <li><Link className="hover:text-violet" href="/notre-histoire">Notre histoire</Link></li>
            <li><Link className="hover:text-violet" href="/contact">Contact</Link></li>
          </ul>
        </nav>
        <nav aria-label="Informations">
          <p className="eyebrow mb-3">
            <Bang className="h-3.5 w-2 text-lilac" /> Infos
          </p>
          <ul className="space-y-2.5 text-[0.95rem]">
            <li><Link className="hover:text-violet" href="/infos/commande-et-retrait">Commande, livraison et retrait</Link></li>
            <li><Link className="hover:text-violet" href="/infos/conditions-de-vente">Conditions de vente</Link></li>
            <li><Link className="hover:text-violet" href="/infos/informations-alimentaires">Informations alimentaires</Link></li>
            <li><Link className="hover:text-violet" href="/infos/confidentialite">Confidentialité</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} KALIMA · Cake and bakery</p>
          <p>
            Site réalisé par <span className="font-semibold text-night/70">Drifty</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
