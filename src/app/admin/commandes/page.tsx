import Link from "next/link";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatDate, formatPrice } from "@/lib/format";
import { getDashboardCounts, listAdminOrders, ORDER_FILTERS, type AdminOrderRow, type OrderFilter } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { AdminHeader, Count, EmptyState, Pill } from "../_components/ui";

export const metadata = { title: "Commandes" };

/** Ce qu'il reste à faire sur la commande, en une phrase. */
function nextStep(o: AdminOrderRow): { text: string; hot: boolean } | null {
  switch (o.status) {
    case "awaiting_payment":
      return o.payment_declared_at ? { text: "paiement signalé : à vérifier", hot: true } : { text: "attend le paiement du client", hot: false };
    case "reward_requested":
      return { text: "box offerte à valider", hot: true };
    case "confirmed":
      return { text: "lancer la confection", hot: true };
    case "in_production":
      return { text: o.fulfillment === "delivery" ? "remettre au livreur" : "marquer prête à retirer", hot: false };
    case "out_for_delivery":
      return { text: "confirmer la livraison", hot: false };
    case "ready_for_pickup":
      return { text: "confirmer le retrait", hot: false };
    default:
      return null;
  }
}

export default async function AdminOrders({ searchParams }: PageProps<"/admin/commandes">) {
  await requireStaff();
  const { filtre, q } = await searchParams;
  const filter = (typeof filtre === "string" && filtre in ORDER_FILTERS ? filtre : "verifier") as OrderFilter;
  const search = typeof q === "string" ? q.slice(0, 80) : "";
  const [orders, counts] = await Promise.all([listAdminOrders(search ? "toutes" : filter, search), getDashboardCounts()]);
  const tabCounts: Partial<Record<OrderFilter, number>> = {
    verifier: counts.payments_to_check + counts.rewards_to_validate,
    preparer: counts.to_start + counts.in_production,
    remise: counts.out_or_ready,
  };

  return (
    <>
      <AdminHeader kicker="le carnet de commandes" title="Commandes" />
      <form className="relative mb-4" role="search">
        <label htmlFor="q" className="sr-only">Rechercher une commande</label>
        <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-violet" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input id="q" name="q" type="search" defaultValue={search} placeholder="Référence, nom, téléphone ou e-mail" className="field !pl-12" />
      </form>
      <nav aria-label="Filtrer les commandes" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pt-1 pb-2 [scrollbar-width:none]">
        {Object.entries(ORDER_FILTERS).map(([key, value]) => (
          <Link
            key={key}
            href={`/admin/commandes?filtre=${key}`}
            aria-current={!search && key === filter ? "page" : undefined}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 border-dashed border-kraft/50 bg-paper px-4 text-sm font-semibold whitespace-nowrap text-night/75 transition hover:border-kraft hover:text-night aria-[current=page]:border-solid aria-[current=page]:border-night aria-[current=page]:bg-night aria-[current=page]:text-white"
          >
            {value.label}
            <Count value={tabCounts[key as OrderFilter] ?? 0} tone={!search && key === filter ? "light" : "violet"} />
          </Link>
        ))}
      </nav>
      {search ? (
        <p className="mb-4 text-sm text-muted">
          Résultats pour « {search} » ·{" "}
          <Link href="/admin/commandes" className="font-semibold text-violet underline decoration-lilac decoration-2 underline-offset-4">
            Effacer
          </Link>
        </p>
      ) : null}

      {orders.length === 0 ? (
        <EmptyState>{search ? "aucune commande ne correspond." : "rien à faire ici pour le moment !"}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const step = nextStep(o);
            return (
              <li key={o.id}>
                {/* Bon de commande : talon kraft à gauche, détachable. */}
                <Link
                  href={`/admin/commandes/${o.id}`}
                  className={`group flex flex-col overflow-hidden rounded-[1.2rem] bg-white transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] sm:flex-row ${
                    step?.hot ? "border-2 border-violet shadow-[var(--shadow-soft)]" : "border border-line/80 shadow-[var(--shadow-soft)]"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3 border-b-2 border-dashed border-kraft/50 bg-kraft-soft px-4 py-2.5 sm:w-40 sm:shrink-0 sm:flex-col sm:items-start sm:justify-center sm:border-r-2 sm:border-b-0 sm:py-4">
                    <span className="tabular display text-lg leading-tight">{o.reference}</span>
                    <span className="text-right text-xs text-kraft-deep sm:text-left">
                      {formatDate(o.created_at)}
                      <span className="block font-semibold">{o.fulfillment === "delivery" ? "Livraison" : "Retrait"}</span>
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold">{o.customer_name}</span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        {o.kind === "reward" ? <Pill tone="violet">Box offerte</Pill> : null}
                        {o.payment_declared_at && o.status === "awaiting_payment" ? <Pill tone="danger">Paiement signalé</Pill> : null}
                        <OrderStatusBadge status={o.status} />
                      </span>
                    </span>
                    <span className="line-clamp-2 text-sm text-night/75">{o.summary}</span>
                    <span className="flex flex-wrap items-end justify-between gap-2">
                      {step ? (
                        <span className={`hand text-xl leading-tight ${step.hot ? "text-violet" : "text-muted"}`}>→ {step.text}</span>
                      ) : (
                        <span />
                      )}
                      <strong className="tabular display text-lg">{formatPrice(o.total)}</strong>
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
