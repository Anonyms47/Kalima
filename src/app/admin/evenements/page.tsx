import Link from "next/link";
import { formatDay } from "@/lib/format";
import { listEventRequests } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { EVENT_STATUS_LABELS } from "@/lib/server/events";
import { AdminHeader, EmptyState, Pill } from "../_components/ui";

export const metadata = { title: "Événements" };

export default async function AdminEvents({ searchParams }: PageProps<"/admin/evenements">) {
  await requireStaff();
  const { vue } = await searchParams;
  const archived = vue === "archives";
  const events = await listEventRequests(!archived);
  return (
    <>
      <AdminHeader title="Événements" subtitle="Une demande ne réserve aucune date tant que vous ne l'avez pas confirmée." />
      <nav className="mb-5 flex gap-2" aria-label="Vue">
        <Link href="/admin/evenements" aria-current={!archived ? "page" : undefined} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold aria-[current=page]:bg-night aria-[current=page]:text-white">En cours</Link>
        <Link href="/admin/evenements?vue=archives" aria-current={archived ? "page" : undefined} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold aria-[current=page]:bg-night aria-[current=page]:text-white">Terminés / non retenus</Link>
      </nav>
      {events.length === 0 ? (
        <EmptyState>Aucune demande ici.</EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {events.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/evenements/${e.id}`} className="block rounded-2xl border border-line bg-white p-4 hover:border-violet/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{e.occasion} · {e.name}</p>
                  <Pill tone={e.status === "new" ? "danger" : e.status === "confirmed" ? "success" : "violet"}>{EVENT_STATUS_LABELS[e.status]}</Pill>
                </div>
                <p className="mt-1 text-sm text-muted">{formatDay(e.event_date)} · {e.location}{e.guests ? ` · ${e.guests} personnes` : ""}</p>
                <p className="mt-1 line-clamp-1 text-sm">{e.products_wanted}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
