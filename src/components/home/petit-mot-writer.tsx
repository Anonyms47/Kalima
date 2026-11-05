"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowIcon } from "@/components/icons";
import { PETIT_MOT_MAX, readPetitMot, savePetitMot } from "@/lib/petit-mot";

const IDEAS = ["Joyeux anniversaire !", "Merci pour tout", "Bon courage pour demain", "Juste comme ça, pour toi"];

/** Carte où l'on écrit son petit mot ; il est repris au moment de commander. */
export function PetitMotWriter({ placeholder }: { placeholder: string }) {
  const [text, setText] = useState("");

  useEffect(() => {
    // Lecture différée : le stockage local n'existe qu'au navigateur.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(readPetitMot());
  }, []);

  const update = (value: string) => {
    const next = value.slice(0, PETIT_MOT_MAX);
    setText(next);
    savePetitMot(next);
  };

  return (
    <div>
      <div className="note-card rotate-[-1.5deg] !px-7 !pt-9 !pb-6">
        <label htmlFor="petit-mot" className="sr-only">Votre petit mot</label>
        <textarea
          id="petit-mot"
          rows={4}
          value={text}
          maxLength={PETIT_MOT_MAX}
          onChange={(event) => update(event.target.value)}
          placeholder={placeholder}
          className="hand block w-full resize-none bg-transparent text-[1.7rem] leading-[2rem] text-violet placeholder:text-violet/40 focus:outline-none"
        />
        <p className="hand mt-1 text-right text-xl text-night/70">— pour qui vous voulez</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Idées de mots">
        {IDEAS.map((idea) => (
          <button
            key={idea}
            type="button"
            onClick={() => update(idea)}
            className="rounded-full border border-kraft/60 bg-paper px-3.5 py-1.5 text-sm font-semibold text-kraft-deep transition hover:border-kraft-deep hover:bg-white"
          >
            {idea}
          </button>
        ))}
      </div>

      <p className="mt-5 text-sm text-night/70" aria-live="polite">
        {text.trim()
          ? "Gardé de côté : il vous attendra au moment de commander."
          : "Écrivez-le ici, on le garde de côté jusqu'à votre commande."}
      </p>
      <Link href="/gourmandises" className="btn-primary mt-4">
        Choisir la boîte qui l&apos;accompagne <ArrowIcon />
      </Link>
    </div>
  );
}
