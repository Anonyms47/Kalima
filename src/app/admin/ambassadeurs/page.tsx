import Link from "next/link";
import { listAmbassadors } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { AdminHeader, EmptyState, Pill } from "../_components/ui";

export const metadata = { title: "Ambassadeurs" };

export default async function AdminAmbassadors() {
  await requireStaff();
  const rows = await listAmbassadors();
  return (
    <>
      <AdminHeader title="Ambassadeurs" subtitle="5 filleuls validés = 1 box individuelle. Les box demandées apparaissent dans « Paiements à vérifier » des commandes." />
      {rows.length === 0 ? (
        <EmptyState>Aucun ambassadeur pour le moment.</EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((a) => (
            <li key={a.user_id}>
              <Link href={`/admin/ambassadeurs/${a.user_id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 hover:border-violet/40">
                <div>
                  <p className="font-bold"><span className="tabular">{a.code}</span> · {a.name ?? a.email}</p>
                  <p className="text-sm text-muted">{a.validated} filleul{a.validated > 1 ? "s" : ""} validé{a.validated > 1 ? "s" : ""}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {!a.active ? <Pill tone="danger">Code désactivé</Pill> : null}
                  {a.rewards_available ? <Pill tone="violet">{a.rewards_available} gagnée{a.rewards_available > 1 ? "s" : ""}</Pill> : null}
                  {a.rewards_requested ? <Pill tone="warning">{a.rewards_requested} réclamée{a.rewards_requested > 1 ? "s" : ""}</Pill> : null}
                  {a.rewards_delivered ? <Pill tone="success">{a.rewards_delivered} remise{a.rewards_delivered > 1 ? "s" : ""}</Pill> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
