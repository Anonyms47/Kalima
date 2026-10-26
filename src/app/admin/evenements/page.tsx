import Link from "next/link";
import { formatDay } from "@/lib/format";
import { listEventRequests } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { EVENT_STATUS_LABELS } from "@/lib/server/events";
import { AdminHeader, EmptyState, Pill } from "../_components/ui";

export const metadata = { title: "Événements" };

// Même lecture de la date que formatDay : midi UTC, pour ne jamais changer de jour.
function noon(value: Date | string) {
  return typeof value === "string" ? new Date(`${value.slice(0, 10)}T12:00:00Z`) : value;
}

function calendarMonth(value: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "Africa/Dakar" }).format(noon(value)).replace(".", "");
}

function calendarDay(value: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: "Africa/Dakar" }).format(noon(value));
}

export default async function AdminEvents({ searchParams }: PageProps<"/admin/evenements">) {
  await requireStaff();
  const { vue } = await searchParams;
  const archived = vue === "archives";
  const events = await listEventRequests(!archived);
  return (
    <>
      <AdminHeader kicker="fêtes et anniversaires" title="Événements" subtitle="Une demande ne réserve aucune date tant que vous ne l'avez pas confirmée." />
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Vue">
        <Link href="/admin/evenements" aria-current={!archived ? "page" : undefined} className="inline-flex min-h-11 items-center rounded-full border-2 border-dashed border-kraft/50 bg-paper px-4 text-sm font-semibold text-night/75 aria-[current=page]:border-solid aria-[current=page]:border-night aria-[current=page]:bg-night aria-[current=page]:text-white">En cours</Link>
        <Link href="/admin/evenements?vue=archives" aria-current={archived ? "page" : undefined} className="inline-flex min-h-11 items-center rounded-full border-2 border-dashed border-kraft/50 bg-paper px-4 text-sm font-semibold text-night/75 aria-[current=page]:border-solid aria-[current=page]:border-night aria-[current=page]:bg-night aria-[current=page]:text-white">Terminés / non retenus</Link>
      </nav>
      {events.length === 0 ? (
        <EmptyState>aucune demande ici pour le moment.</EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {events.map((e) => (
            <li key={e.id}>
              {/* Faire-part : page de calendrier à gauche. */}
              <Link
                href={`/admin/evenements/${e.id}`}
                className={`group flex gap-4 rounded-[1.2rem] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] ${
                  e.status === "new" ? "border-2 border-violet shadow-[var(--shadow-soft)]" : "border border-line/80 shadow-[var(--shadow-soft)]"
                }`}
              >
                <span className="flex w-16 shrink-0 -rotate-2 flex-col self-start overflow-hidden rounded-lg border border-kraft/50 bg-paper text-center shadow-[var(--shadow-soft)]">
                  <span className="bg-kraft py-0.5 text-[0.65rem] font-bold tracking-wider text-night uppercase">{calendarMonth(e.event_date)}</span>
                  <span className="display py-1 text-2xl leading-none">{calendarDay(e.event_date)}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold">{e.occasion} · {e.name}</span>
                    <Pill tone={e.status === "new" ? "danger" : e.status === "confirmed" ? "success" : "violet"}>{EVENT_STATUS_LABELS[e.status]}</Pill>
                  </span>
                  <span className="mt-1 block text-sm text-muted">{formatDay(e.event_date)} · {e.location}{e.guests ? ` · ${e.guests} personnes` : ""}</span>
                  <span className="hand mt-1 line-clamp-1 block text-lg text-violet">{e.products_wanted}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
