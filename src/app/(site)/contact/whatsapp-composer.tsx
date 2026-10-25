"use client";

import { useState } from "react";
import { WhatsappIcon } from "@/components/icons";
import { whatsappUrl } from "@/lib/whatsapp";

const TOPICS = [
  { label: "Une commande", message: "Bonjour KALIMA ! J'aimerais commander " },
  { label: "Un événement", message: "Bonjour KALIMA ! Je prépare un événement le … pour … personnes. " },
  { label: "Ma commande en cours", message: "Bonjour KALIMA ! Je vous écris au sujet de ma commande KAL-" },
  { label: "Une question", message: "Bonjour KALIMA ! J'ai une question : " },
];

/** Message WhatsApp prérempli selon le sujet ; il s'ouvre dans WhatsApp, rien n'est envoyé d'ici. */
export function WhatsappComposer({ number }: { number: string }) {
  const [topic, setTopic] = useState(0);
  const [message, setMessage] = useState(TOPICS[0].message);
  const url = whatsappUrl(number, message.trim() || "Bonjour KALIMA !");

  return (
    <div>
      <fieldset>
        <legend className="hand text-2xl text-kraft-deep">C&apos;est à propos de…</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {TOPICS.map((item, index) => (
            <label
              key={item.label}
              className="cursor-pointer rounded-full border-2 border-kraft/50 bg-paper px-3.5 py-1.5 text-sm font-semibold text-kraft-deep transition hover:border-kraft-deep has-[:checked]:border-night has-[:checked]:bg-night has-[:checked]:text-white has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-lilac"
            >
              <input
                type="radio"
                name="sujet"
                className="sr-only"
                checked={topic === index}
                onChange={() => {
                  setTopic(index);
                  setMessage(item.message);
                }}
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Bulle de discussion, comme dans WhatsApp. */}
      <div className="mt-6 rounded-[1.4rem] bg-[#e9e2d6] p-4 sm:p-5">
        <div className="ml-auto max-w-[92%] rounded-2xl rounded-br-md bg-[#d9fdd3] px-4 py-3 shadow-sm">
          <label htmlFor="wa-message" className="sr-only">Votre message</label>
          <textarea
            id="wa-message"
            rows={3}
            maxLength={600}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="block w-full resize-none bg-transparent text-[1.02rem] leading-relaxed text-night focus:outline-none"
          />
        </div>
      </div>

      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-5 w-full sm:w-auto">
          <WhatsappIcon /> Ouvrir dans WhatsApp
        </a>
      ) : null}
      <p className="mt-2 text-sm text-muted">Le message s&apos;ouvre dans WhatsApp : vous le relisez avant de l&apos;envoyer.</p>
    </div>
  );
}
