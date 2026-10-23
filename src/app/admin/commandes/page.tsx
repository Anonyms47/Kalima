import Link from "next/link";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatDate, formatPrice } from "@/lib/format";
import { listAdminOrders, ORDER_FILTERS, type OrderFilter } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { AdminHeader, EmptyState, Pill } from "../_components/ui";

export const metadata = { title: "Commandes" };

export default async function AdminOrders({ searchParams }: PageProps<"/admin/commandes">) {
  await requireStaff();
  const { filtre, q } = await searchParams;
  const filter = (typeof filtre === "string" && filtre in ORDER_FILTERS ? filtre : "verifier") as OrderFilter;
  const search = typeof q === "string" ? q.slice(0, 80) : "";
  const orders = await listAdminOrders(search ? "toutes" : filter, search);

  return (
    <>
      <AdminHeader title="Commandes" />
      <form className="mb-4" role="search">
        <label htmlFor="q" className="sr-only">Rechercher une commande</label>
        <input id="q" name="q" defaultValue={search} placeholder="Référence, nom, téléphone ou e-mail" className="field" />
      </form>
      <nav aria-label="Filtrer les commandes" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {Object.entries(ORDER_FILTERS).map(([key, value]) => (
          <Link
            key={key}
            href={`/admin/commandes?filtre=${key}`}
            aria-current={!search && key === filter ? "page" : undefined}
            className="shrink-0 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold whitespace-nowrap aria-[current=page]:border-night aria-[current=page]:bg-night aria-[current=page]:text-white"
          >
            {value.label}
          </Link>
        ))}
      </nav>
      {search ? <p className="mb-3 text-sm text-muted">Résultats pour « {search} » · <Link href="/admin/commandes" className="font-semibold text-violet">Effacer</Link></p> : null}

      {orders.length === 0 ? (
        <EmptyState>Aucune commande ici pour le moment.</EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/commandes/${o.id}`} className="block rounded-2xl border border-line bg-white p-4 transition hover:border-violet/40 hover:shadow-[var(--shadow-soft)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="tabular font-bold">
                    {o.reference} <span className="font-normal text-muted">· {o.customer_name}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    {o.kind === "reward" ? <Pill tone="violet">Box offerte</Pill> : null}
                    {o.payment_declared_at && o.status === "awaiting_payment" ? <Pill tone="danger">Paiement signalé</Pill> : null}
                    <OrderStatusBadge status={o.status} />
                  </div>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-night/80">{o.summary}</p>
                <p className="tabular mt-1.5 flex flex-wrap justify-between gap-2 text-sm text-muted">
                  <span>{o.fulfillment === "delivery" ? "Livraison" : "Retrait"} · {formatDate(o.created_at)}</span>
                  <strong className="text-night">{formatPrice(o.total)}</strong>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
