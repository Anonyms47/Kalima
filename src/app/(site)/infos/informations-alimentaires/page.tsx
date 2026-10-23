import type { Metadata } from "next";
import { InfoPage, PendingContent } from "@/components/info-page";
import { getSettings } from "@/lib/server/settings";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Informations alimentaires" };

export default async function FoodInfoPage() {
  const s = await getSettings();
  const wa = whatsappUrl(s.contact.whatsapp_number, "Bonjour KALIMA, j'ai une question sur les ingrédients :");
  return (
    <InfoPage eyebrow="Infos" title="Informations alimentaires">
      {s.food_info ? (
        <div className="whitespace-pre-line">{s.food_info}</div>
      ) : (
        <PendingContent>Les informations sur les ingrédients et les allergènes sont en cours de validation par KALIMA.</PendingContent>
      )}
      <p>
        Allergie ou régime particulier ? Posez-nous la question avant de commander
        {wa ? (
          <>
            {" "}sur <a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold text-violet hover:underline">WhatsApp</a>
          </>
        ) : null}
        .
      </p>
    </InfoPage>
  );
}
