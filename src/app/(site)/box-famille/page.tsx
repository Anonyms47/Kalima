import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/settings";
import { FamilyBoxComposer } from "./family-box-composer";

export const metadata: Metadata = {
  title: "Box famille",
  description: "Composez votre box famille KALIMA, sucré et salé, puis envoyez-la sur WhatsApp : on vous répond avec le prix.",
};

export default async function FamilyBoxPage() {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  return (
    <div data-hide-footer-cta className="mx-auto w-full max-w-6xl px-4 pt-8 pb-28 sm:px-6 md:pt-14 md:pb-20">
      <header className="max-w-2xl">
        <p className="hand -rotate-2 text-3xl text-violet">sucré &amp; salé, pour toute la tablée</p>
        <h1 className="display mt-1 text-5xl leading-[1.02] sm:text-6xl">La box famille</h1>
        <p className="mt-5 text-lg leading-relaxed text-night/75">
          Vous composez, on prépare. Choisissez les quantités qui vous font envie et envoyez votre demande : KALIMA vous répond sur WhatsApp avec le prix et la
          disponibilité.
        </p>
      </header>
      <FamilyBoxComposer sweet={settings.family_box.sweet} salty={settings.family_box.salty} whatsappNumber={settings.contact.whatsapp_number}
        defaults={{ name: [user?.firstName, user?.lastName].filter(Boolean).join(" "), phone: user?.phone ?? "" }}
      />
    </div>
  );
}
