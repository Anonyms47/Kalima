import type { Metadata } from "next";
import { Logo } from "@/components/brand";
import { InstagramIcon, PhoneIcon, PinIcon, WhatsappIcon } from "@/components/icons";
import { PaperCard } from "@/components/paper-card";
import { getSettings } from "@/lib/server/settings";
import { whatsappUrl } from "@/lib/whatsapp";
import { WhatsappComposer } from "./whatsapp-composer";

export const metadata: Metadata = { title: "Contact" };

/** Ligne de l'étiquette kraft, avec points de conduite. */
function LabelLine({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="flex shrink-0 items-center gap-2 self-center font-semibold text-night">
        {icon}
        {label}
      </span>
      <span aria-hidden className="min-w-4 flex-1 translate-y-[-0.3em] border-b border-dotted border-kraft-deep/40" />
      <span className="min-w-0 shrink text-right">{children}</span>
    </li>
  );
}

export default async function ContactPage() {
  const settings = await getSettings();
  const { contact, hours, pickup } = settings;
  const wa = whatsappUrl(contact.whatsapp_number);
  const tel = contact.phone.replace(/[^\d+]/g, "");
  const link = "font-semibold text-violet underline decoration-lilac decoration-2 underline-offset-4 hover:decoration-violet";

  return (
    <div data-hide-footer-cta className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-6 md:pt-14">
      <header className="max-w-2xl">
        <p className="hand -rotate-2 text-3xl text-violet">un petit mot ?</p>
        <h1 className="display mt-1 text-5xl sm:text-6xl">Écrivez-nous</h1>
        <p className="mt-4 text-lg leading-relaxed text-night/75">
          Une commande, une fête à préparer, une question sur une commande en cours : le plus simple, c&apos;est WhatsApp. On vous répond avec plaisir.
        </p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        {wa ? (
          <section aria-labelledby="whatsapp-titre">
            <h2 id="whatsapp-titre" className="display flex items-center gap-2 text-2xl">
              <WhatsappIcon className="size-6 text-[#1f7a4d]" /> Sur WhatsApp
            </h2>
            <div className="mt-5">
              <WhatsappComposer number={contact.whatsapp_number} />
            </div>
          </section>
        ) : null}

        <div className="space-y-12">
          {/* L'étiquette kraft collée sur les boîtes. */}
          <section aria-labelledby="coordonnees" className="rotate-[1deg] rounded-[1.1rem] bg-kraft p-2 shadow-[var(--shadow-lift)]">
            <div className="rounded-[0.8rem] border-2 border-dashed border-kraft-deep/40 bg-kraft-soft px-5 py-6 sm:px-7">
              <div className="flex items-center justify-between gap-4">
                <h2 id="coordonnees" className="text-xs font-bold tracking-[0.2em] text-kraft-deep uppercase">
                  Coordonnées
                </h2>
                <Logo className="h-8 w-auto" />
              </div>
              <ul className="mt-5 space-y-3.5 text-[0.98rem]">
                {wa ? (
                  <LabelLine icon={<WhatsappIcon className="size-5 text-kraft-deep" />} label="WhatsApp">
                    <a href={wa} target="_blank" rel="noopener noreferrer" className={link}>
                      {contact.phone || "Écrire"}
                    </a>
                  </LabelLine>
                ) : null}
                {tel ? (
                  <LabelLine icon={<PhoneIcon className="size-5 text-kraft-deep" />} label="Téléphone">
                    <a href={`tel:${tel}`} className={link}>
                      Appeler
                    </a>
                  </LabelLine>
                ) : null}
                {contact.instagram ? (
                  <LabelLine icon={<InstagramIcon className="size-5 text-kraft-deep" />} label="Instagram">
                    <a href={`https://instagram.com/${contact.instagram}`} target="_blank" rel="noopener noreferrer" className={link}>
                      @{contact.instagram}
                    </a>
                  </LabelLine>
                ) : null}
                {contact.email ? (
                  <LabelLine icon={<span aria-hidden className="w-5 text-center font-bold text-kraft-deep">@</span>} label="E-mail">
                    <a href={`mailto:${contact.email}`} className={`${link} break-all`}>
                      {contact.email}
                    </a>
                  </LabelLine>
                ) : null}
              </ul>
            </div>
          </section>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {hours ? (
              /* Pancarte « ouvert » suspendue à la porte. */
              <div className="relative mx-auto w-full max-w-[16rem] pt-8">
                <svg aria-hidden viewBox="0 0 120 40" className="absolute top-0 left-1/2 h-10 w-32 -translate-x-1/2 text-night/45" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 39 60 4l48 35" />
                </svg>
                <span aria-hidden className="absolute top-0 left-1/2 size-3 -translate-x-1/2 -translate-y-0.5 rounded-full bg-night/70" />
                <div className="-rotate-2 rounded-2xl bg-night px-5 py-5 text-center text-white shadow-[var(--shadow-lift)]">
                  <p className="hand text-3xl text-lilac">Ouvert</p>
                  <p className="mt-1 font-semibold">{hours}</p>
                </div>
              </div>
            ) : null}

            {pickup.area ? (
              <PaperCard className="!p-5 -rotate-1">
                <p className="flex items-center gap-2 font-semibold">
                  <PinIcon className="size-5 shrink-0 text-violet" /> Retrait à {pickup.area}
                </p>
                <p className="hand mt-2 text-xl leading-snug text-violet">
                  {pickup.details || "l'adresse exacte vous est donnée après votre commande"}
                </p>
              </PaperCard>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
