import Link from "next/link";
import { notFound } from "next/navigation";
import { restoreReferralAction, setAmbassadorActiveAction } from "@/lib/actions/admin/other";
import { formatDate } from "@/lib/format";
import { getAmbassadorDetail } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { AdminHeader, Panel, Pill } from "../../_components/ui";
import { RevokeForm } from "./revoke-form";

export const metadata = { title: "Ambassadeur" };

const REWARD = { available: ["Gagnée, non réclamée", "violet"], requested: ["Réclamée", "warning"], delivered: ["Remise", "success"], cancelled: ["Annulée", "muted"] } as const;

export default async function AdminAmbassadorPage({ params }: PageProps<"/admin/ambassadeurs/[id]">) {
  await requireStaff();
  const { id } = await params;
  const amb = await getAmbassadorDetail(id);
  if (!amb) notFound();
  const valid = amb.referrals.filter((r) => !r.revoked_at).length;
  return (
    <>
      <AdminHeader
        back={{ href: "/admin/ambassadeurs", label: "Ambassadeurs" }}
        title={amb.code}
        subtitle={`${amb.name ?? ""} ${amb.email}${amb.phone ? ` · ${amb.phone}` : ""}`}
        actions={
          <form action={setAmbassadorActiveAction}>
            <input type="hidden" name="ambassadorId" value={amb.user_id} />
            <input type="hidden" name="active" value={amb.active ? "false" : "true"} />
            <button type="submit" className="btn-ghost btn-sm">{amb.active ? "Désactiver le code" : "Réactiver le code"}</button>
          </form>
        }
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title={`Filleuls validés : ${valid}`}>
          <p className="mb-3 text-xs text-muted">Visible uniquement par l&apos;équipe. L&apos;ambassadeur ne voit qu&apos;un compteur.</p>
          {amb.referrals.length === 0 ? <p className="text-sm text-muted">Aucun filleul validé.</p> : (
            <ul className="divide-y divide-line">
              {amb.referrals.map((r) => (
                <li key={r.referred_user_id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className={`font-semibold ${r.revoked_at ? "line-through opacity-60" : ""}`}>{r.referred_name ?? "Client"} · <span className="tabular">{r.order_reference}</span></p>
                    <p className="text-muted">Validé le {formatDate(r.qualified_at)}</p>
                    {r.revoked_at ? <p className="text-danger">Retiré : {r.revoked_reason}</p> : null}
                  </div>
                  {r.revoked_at ? (
                    <form action={restoreReferralAction}>
                      <input type="hidden" name="ambassadorId" value={amb.user_id} />
                      <input type="hidden" name="referredId" value={r.referred_user_id} />
                      <button type="submit" className="text-xs font-semibold text-violet">Rétablir</button>
                    </form>
                  ) : (
                    <RevokeForm ambassadorId={amb.user_id} referredId={r.referred_user_id} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Récompenses">
          {amb.rewards.length === 0 ? <p className="text-sm text-muted">Aucune récompense pour le moment.</p> : (
            <ul className="divide-y divide-line">
              {amb.rewards.map((w) => (
                <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-semibold">Box n° {w.tier}{w.product_name ? ` · ${w.product_name}` : ""}</p>
                    <p className="text-muted">Gagnée le {formatDate(w.created_at)}{w.delivered_at ? ` · remise le ${formatDate(w.delivered_at)}` : ""}</p>
                    {w.note ? <p className="text-muted">{w.note}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={REWARD[w.status as keyof typeof REWARD][1]}>{REWARD[w.status as keyof typeof REWARD][0]}</Pill>
                    {w.order_id ? <Link href={`/admin/commandes/${w.order_id}`} className="text-xs font-semibold text-violet">{w.order_reference}</Link> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
