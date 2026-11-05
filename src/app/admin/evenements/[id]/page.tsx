import { notFound } from "next/navigation";
import { WhatsappIcon } from "@/components/icons";
import { formatDate, formatDay } from "@/lib/format";
import { getEventRequest } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { toWhatsappNumber, whatsappUrl } from "@/lib/whatsapp";
import { AdminHeader, Panel } from "../../_components/ui";
import { EventAdminForm } from "./event-form";

export const metadata = { title: "Demande d'événement" };

export default async function AdminEventPage({ params }: PageProps<"/admin/evenements/[id]">) {
  await requireStaff();
  const { id } = await params;
  const event = await getEventRequest(id);
  if (!event) notFound();
  const wa = whatsappUrl(toWhatsappNumber(event.phone), `Bonjour ${event.name.split(" ")[0]}, c'est KALIMA au sujet de votre demande pour le ${formatDay(event.event_date)} (${event.reference}). `);
  return (
    <>
      <AdminHeader back={{ href: "/admin/evenements", label: "Événements" }} title={`${event.occasion} · ${event.name}`} subtitle={`${event.reference} · reçue le ${formatDate(event.created_at)}`} />
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="La demande">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Date</dt><dd className="font-semibold">{formatDay(event.event_date)}</dd></div>
            <div><dt className="text-muted">Lieu</dt><dd className="font-semibold">{event.location}</dd></div>
            <div><dt className="text-muted">Personnes</dt><dd className="font-semibold">{event.guests ?? "Non précisé"}</dd></div>
            <div><dt className="text-muted">Contact</dt><dd className="font-semibold">{event.phone}<br /><span className="font-normal break-all">{event.email}</span></dd></div>
          </dl>
          <h3 className="mt-5 text-sm font-bold">Produits et quantités</h3>
          <p className="mt-1 text-sm whitespace-pre-line">{event.products_wanted}</p>
          {event.details ? (
            <>
              <h3 className="mt-4 text-sm font-bold">Précisions</h3>
              <p className="mt-1 text-sm whitespace-pre-line">{event.details}</p>
            </>
          ) : null}
          <p className="mt-4 rounded-xl bg-mist px-3 py-2 text-xs text-muted">Rappel : minimum 50 pièces par variété. Installation sur place selon disponibilité.</p>
          {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-5 w-full sm:w-auto"><WhatsappIcon /> Répondre sur WhatsApp</a> : null}
        </Panel>
        <Panel title="Suivi">
          <EventAdminForm event={event} />
        </Panel>
      </div>
    </>
  );
}
