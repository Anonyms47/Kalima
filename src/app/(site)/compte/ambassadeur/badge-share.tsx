"use client";

import Image from "next/image";
import { useState } from "react";
import { WhatsappIcon } from "@/components/icons";

/** Badge ambassadeur : aperçu, téléchargement et partage (image + texte quand le téléphone le permet). */
export function BadgeShare({ code, shareText }: { code: string; shareText: string }) {
  const src = `/p/${code}/badge`;
  const fileName = `badge-kalima-${code}.png`;
  const [status, setStatus] = useState<string | null>(null);

  async function share() {
    try {
      const blob = await (await fetch(src)).blob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    // Pas de partage d'image possible (ordinateur) : on passe par WhatsApp avec le texte.
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
    setStatus("Astuce : téléchargez le badge pour l'ajouter en image à votre message ou à votre statut.");
  }

  return (
    <div className="grid items-center gap-8 md:grid-cols-[minmax(0,18rem)_1fr]">
      <figure className="relative mx-auto w-full max-w-[18rem] -rotate-2 bg-white p-2.5 pb-9 shadow-[var(--shadow-lift)]">
        <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-2 rounded-sm bg-lilac/80" />
        <Image src={src} alt={`Badge ambassadeur KALIMA, code ${code}`} width={1080} height={1350} unoptimized className="h-auto w-full" />
        <figcaption className="hand absolute right-3 bottom-1.5 text-xl text-night/70">mon badge</figcaption>
      </figure>
      <div>
        <p className="leading-relaxed text-night/75">
          Votre badge officiel, prêt à partager en statut WhatsApp, en story Instagram ou dans vos groupes. Votre code y figure, avec le lien vers la boutique.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={share} className="btn-whatsapp btn-sm">
            <WhatsappIcon className="size-4" /> Partager mon badge
          </button>
          <a href={src} download={fileName} className="btn-ghost btn-sm">
            Télécharger l&apos;image
          </a>
        </div>
        {status ? (
          <p role="status" className="hand mt-3 text-lg text-violet">
            {status}
          </p>
        ) : null}
      </div>
    </div>
  );
}
