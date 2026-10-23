import type { Metadata } from "next";
import { Bang } from "@/components/brand";
import { ClockIcon, InstagramIcon, PhoneIcon, PinIcon, WhatsappIcon } from "@/components/icons";
import { Note } from "@/components/note";
import { getSettings } from "@/lib/server/settings";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getSettings();
  const wa = whatsappUrl(settings.contact.whatsapp_number, "Bonjour KALIMA !");
  const tel = settings.contact.phone.replace(/[^\d+]/g, "");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-20 sm:px-6 md:pt-16">
      <p className="eyebrow"><Bang className="h-4 w-2.5 text-lilac" /> Contact</p>
      <h1 className="display mt-3 text-5xl sm:text-6xl">Écrivez-nous</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">Une question, une commande particulière, un souci avec une commande ? Le plus simple, c&apos;est WhatsApp.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <ul className="card divide-y divide-line">
          {wa ? (
            <li className="flex flex-wrap items-center justify-between gap-4 p-6">
              <span className="flex items-center gap-3"><WhatsappIcon className="size-6 text-violet" /><span><strong className="block">WhatsApp</strong><span className="text-muted">{settings.contact.phone}</span></span></span>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp btn-sm">Ouvrir WhatsApp</a>
            </li>
          ) : null}
          {tel ? (
            <li className="flex flex-wrap items-center justify-between gap-4 p-6">
              <span className="flex items-center gap-3"><PhoneIcon className="size-6 text-violet" /><span><strong className="block">Téléphone</strong><span className="text-muted">{settings.contact.phone}</span></span></span>
              <a href={`tel:${tel}`} className="btn-ghost btn-sm">Appeler</a>
            </li>
          ) : null}
          {settings.contact.instagram ? (
            <li className="flex flex-wrap items-center justify-between gap-4 p-6">
              <span className="flex items-center gap-3"><InstagramIcon className="size-6 text-violet" /><span><strong className="block">Instagram</strong><span className="text-muted">@{settings.contact.instagram}</span></span></span>
              <a href={`https://instagram.com/${settings.contact.instagram}`} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">Voir le profil</a>
            </li>
          ) : null}
          {settings.contact.email ? (
            <li className="p-6"><strong className="block">E-mail</strong><a className="text-violet hover:underline" href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a></li>
          ) : null}
        </ul>
        <div className="space-y-6">
          {settings.hours ? (
            <div className="card flex gap-3 p-6"><ClockIcon className="size-6 shrink-0 text-violet" /><span><strong className="block">Horaires</strong>{settings.hours}</span></div>
          ) : null}
          {settings.pickup.area ? (
            <div className="card flex gap-3 p-6">
              <PinIcon className="size-6 shrink-0 text-violet" />
              <span><strong className="block">Retrait à {settings.pickup.area}</strong>{settings.pickup.details || "L'adresse exacte vous est communiquée après votre commande."}</span>
            </div>
          ) : null}
          <Note tilt="rotate-[-2deg]">On répond avec plaisir !</Note>
        </div>
      </div>
    </div>
  );
}
