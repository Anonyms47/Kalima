import { formatDate } from "@/lib/format";
import { listAudit } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { AdminHeader, Panel } from "../_components/ui";

export const metadata = { title: "Journal" };

const ACTIONS: Record<string, string> = {
  "order.confirmed": "Paiement confirmé",
  "order.in_production": "Confection commencée",
  "order.out_for_delivery": "Remise au livreur",
  "order.delivered": "Livraison confirmée",
  "order.ready_for_pickup": "Prête au retrait",
  "order.picked_up": "Remise au client",
  "order.cancelled": "Commande annulée",
  "order.refunded": "Remboursement enregistré",
  "product.created": "Produit créé",
  "product.updated": "Produit modifié",
  "product.published": "Produit publié",
  "product.draft": "Produit dépublié",
  "product.archived": "Produit archivé",
  "product.duplicated": "Produit dupliqué",
  "product.stock_toggle": "Rupture manuelle modifiée",
  "product.format_saved": "Format enregistré",
  "product.format_removed": "Format retiré",
  "product.supplements": "Suppléments du produit",
  "product.images_added": "Photos ajoutées",
  "product.image_deleted": "Photo supprimée",
  "supplement.saved": "Supplément enregistré",
  "settings.updated": "Paramètres modifiés",
  "staff.added": "Accès équipe créé",
  "staff.enabled": "Accès équipe réactivé",
  "staff.disabled": "Accès équipe désactivé",
  "ambassador.activated": "Ambassadeur inscrit",
  "ambassador.enabled": "Code ambassadeur réactivé",
  "ambassador.disabled": "Code ambassadeur désactivé",
  "referral.qualified": "Filleul validé",
  "referral.revoked": "Parrainage retiré",
  "referral.restored": "Parrainage rétabli",
  "reward.earned": "Récompense gagnée",
  "reward.requested": "Récompense réclamée",
  "reward.released": "Récompense libérée",
  "reward.cancelled": "Récompense annulée",
  "event.requested": "Demande d'événement",
  "event.updated": "Événement mis à jour",
};

export default async function AdminJournal() {
  await requireStaff();
  const rows = await listAudit(300);
  return (
    <>
      <AdminHeader kicker="qui a fait quoi" title="Journal" subtitle="Les 300 dernières actions, conservées pour garder une trace." />
      <Panel>
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.id} className="py-3 text-sm">
              <p><strong>{ACTIONS[r.action] ?? r.action}</strong> · {r.actor_label}</p>
              <p className="text-muted">
                {formatDate(r.created_at)}
                {Object.keys(r.details).length ? ` · ${Object.entries(r.details).map(([k, v]) => `${k} : ${typeof v === "object" ? JSON.stringify(v) : String(v)}`).join(", ")}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
