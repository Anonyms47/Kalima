import { requireStaff } from "@/lib/server/auth";
import { emailProviderLabel } from "@/lib/server/email";
import { getSettings } from "@/lib/server/settings";
import { storageMode } from "@/lib/server/storage";
import { AdminHeader, Panel, Pill } from "../_components/ui";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Paramètres" };

export default async function AdminSettings() {
  await requireStaff();
  const settings = await getSettings();
  const storage = storageMode();
  return (
    <>
      <AdminHeader title="Paramètres" />
      <Panel title="Services techniques" className="mb-5">
        <ul className="space-y-2 text-sm">
          <li className="flex flex-wrap items-center justify-between gap-2">E-mails <Pill tone={emailProviderLabel() === "Brevo" ? "success" : "warning"}>{emailProviderLabel()}</Pill></li>
          <li className="flex flex-wrap items-center justify-between gap-2">Photos <Pill tone={storage === "supabase" ? "success" : "warning"}>{storage === "supabase" ? "Stockage Supabase" : storage === "local" ? "Dossier local (développement)" : "Non configuré"}</Pill></li>
          <li className="flex flex-wrap items-center justify-between gap-2">Paiement <Pill tone={settings.payment.link ? "success" : "warning"}>{settings.payment.link ? "Lien renseigné, vérification manuelle" : "Aucun lien"}</Pill></li>
        </ul>
        <p className="mt-3 text-xs text-muted">Ces services se configurent par Drifty dans l&apos;hébergement (variables d&apos;environnement).</p>
      </Panel>
      <SettingsForm settings={settings} />
    </>
  );
}
