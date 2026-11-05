import Link from "next/link";
import { formatDate, formatDay, formatPrice } from "@/lib/format";
import { listFamilyBoxRequests } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { FAMILY_BOX_STATUS_LABELS } from "@/lib/server/family-box";
import { AdminHeader, EmptyState, Pill } from "../_components/ui";

export const metadata = { title: "Box famille" };

const TONES = { new: "danger", quoted: "violet", confirmed: "success", delivered: "muted", cancelled: "muted" } as const;

export default async function AdminFamilyBoxes({ searchParams }: PageProps<"/admin/box-famille">) {
  await requireStaff();
  const { vue } = await searchParams;
  const archived = vue === "archives";
  const requests = await listFamilyBoxRequests(!archived);
  const tab =
    "inline-flex min-h-11 items-center rounded-full border-2 border-dashed border-kraft/50 bg-paper px-4 text-sm font-semibold text-night/75 aria-[current=page]:border-solid aria-[current=page]:border-night aria-[current=page]:bg-night aria-[current=page]:text-white";

  return (
    <>
      <AdminHeader kicker="compositions à chiffrer" title="Box famille" subtitle="Le client compose sa box sur le site ; vous fixez le prix ici puis vous lui répondez sur WhatsApp." />
      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Vue">
        <Link href="/admin/box-famille" aria-current={!archived ? "page" : undefined} className={tab}>En cours</Link>
        <Link href="/admin/box-famille?vue=archives" aria-current={archived ? "page" : undefined} className={tab}>Livrées / annulées</Link>
      </nav>
      {requests.length === 0 ? (
        <EmptyState>aucune box famille ici pour le moment.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => {
            const pieces = r.items.reduce((sum, i) => sum + i.quantity, 0);
            return (
              <li key={r.id}>
                <Link
                  href={`/admin/box-famille/${r.id}`}
                  className={`flex flex-col overflow-hidden rounded-[1.2rem] bg-white transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] sm:flex-row ${
                    r.status === "new" ? "border-2 border-violet shadow-[var(--shadow-soft)]" : "border border-line/80 shadow-[var(--shadow-soft)]"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3 border-b-2 border-dashed border-kraft/50 bg-kraft-soft px-4 py-2.5 sm:w-40 sm:shrink-0 sm:flex-col sm:items-start sm:justify-center sm:border-r-2 sm:border-b-0 sm:py-4">
                    <span className="tabular display text-lg leading-tight">{r.reference}</span>
                    <span className="text-right text-xs text-kraft-deep sm:text-left">{formatDate(r.created_at)}</span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold">{r.name}</span>
                      <Pill tone={TONES[r.status]}>{FAMILY_BOX_STATUS_LABELS[r.status]}</Pill>
                    </span>
                    <span className="line-clamp-2 text-sm text-night/75">
                      {r.items.length ? r.items.map((i) => `${i.quantity} × ${i.item}`).join(", ") : r.note}
                    </span>
                    <span className="flex flex-wrap items-end justify-between gap-2 text-sm text-muted">
                      <span>
                        {pieces} pièce{pieces > 1 ? "s" : ""}
                        {r.guests ? ` · ${r.guests} personnes` : ""}
                        {r.wanted_date ? ` · ${formatDay(r.wanted_date)}` : ""}
                      </span>
                      {r.price !== null ? (
                        <strong className="tabular display text-lg text-night">{formatPrice(r.price)}</strong>
                      ) : (
                        <span className="hand text-xl text-violet">→ prix à fixer</span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
