import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand";
import { BackIcon } from "@/components/icons";
import { PaidStamp, Receipt, ReceiptLine, ReceiptTotal } from "@/components/receipt";
import { formatDate, formatPrice } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/order-status";
import { requireStaff } from "@/lib/server/auth";
import { getOrderById } from "@/lib/server/order-queries";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Ticket à imprimer", robots: { index: false, follow: false } };

/** Ticket de préparation (format caisse 80 mm) et carte du petit mot, réservés à l'équipe. */
export default async function PrintOrderPage({ params }: PageProps<"/impression/commandes/[id]">) {
  await requireStaff();
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 print:p-0">
      <h1 className="sr-only">Ticket à imprimer pour la commande {order.reference}</h1>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/commandes/${order.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-night">
          <BackIcon className="size-4" /> Retour à la commande
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted">Ticket au format caisse 80 mm, carte du petit mot à découper.</p>
          <PrintButton />
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-10 print:gap-6">
        <Receipt
          title={order.kind === "reward" ? "Box offerte · préparation" : "Ticket de préparation"}
          meta={`${order.reference} · ${formatDate(order.created_at)}`}
          barcode={order.reference}
          className="w-[80mm] shrink-0 print:drop-shadow-none"
        >
          <dl className="space-y-1 text-sm">
            <ReceiptLine label="Client" value={order.customer_name} />
            <ReceiptLine label="WhatsApp" value={order.customer_phone} />
            <ReceiptLine label="Réception" value={order.fulfillment === "delivery" ? "Livraison" : "Retrait"} />
            {order.delivery_area ? <ReceiptLine label="Zone" value={order.delivery_area} /> : null}
            <ReceiptLine label="Statut" value={STATUS_LABELS[order.status]} muted />
          </dl>

          <dl className="mt-4 space-y-3 border-t border-dashed border-night/25 pt-4 text-sm">
            {order.items.map((item) => (
              <ReceiptLine
                key={item.id}
                label={<strong>{item.boxes} × {item.product_name}</strong>}
                value={formatPrice(item.line_total)}
                detail={
                  <>
                    {item.format_label}
                    {item.units ? ` · ${item.units} ${item.unit_label}${item.units > 1 ? "s" : ""} par boîte` : ""}
                    {item.supplements.length ? <span className="block font-semibold text-night">+ {item.supplements.map((s) => s.name).join(", ")}</span> : null}
                  </>
                }
              />
            ))}
            <ReceiptTotal label="Total" value={formatPrice(order.total)} />
          </dl>

          {order.paid_at ? (
            <PaidStamp date={formatDate(order.paid_at)} />
          ) : order.kind === "standard" ? (
            <p className="mt-4 text-center text-sm font-bold tracking-[0.18em] text-danger uppercase">Paiement non vérifié</p>
          ) : null}

          {order.customer_note ? (
            <div className="mt-4 border-t border-dashed border-night/25 pt-3 text-sm">
              <p className="text-xs font-bold tracking-[0.16em] text-muted uppercase">Précision du client</p>
              <p className="mt-1 whitespace-pre-line">{order.customer_note}</p>
            </div>
          ) : null}
        </Receipt>

        {/* Carte du petit mot, à découper et glisser dans la boîte. */}
        <figure className="flex h-[74mm] w-[105mm] shrink-0 flex-col border border-dashed border-night/30 bg-paper p-[7mm] print:break-inside-avoid">
          <Logo className="h-7 w-auto self-start" />
          {order.gift_message ? (
            <blockquote className="hand mt-4 flex-1 text-[1.65rem] leading-[2rem] text-violet">{order.gift_message}</blockquote>
          ) : (
            <div aria-label="Lignes pour écrire le mot à la main" className="mt-4 flex-1 space-y-[9mm] pt-[6mm]">
              <span className="block border-b border-lilac" />
              <span className="block border-b border-lilac" />
              <span className="block border-b border-lilac" />
            </div>
          )}
          <figcaption className="hand self-end text-xl text-night/70">— KALIMA</figcaption>
        </figure>
      </div>
    </main>
  );
}
