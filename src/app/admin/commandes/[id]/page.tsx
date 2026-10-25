import { notFound } from "next/navigation";
import { WhatsappIcon } from "@/components/icons";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { PaidStamp, Receipt, ReceiptLine, ReceiptTotal } from "@/components/receipt";
import { formatDate, formatPrice } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/order-status";
import { listNotifications } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { getOrderById } from "@/lib/server/order-queries";
import { toWhatsappNumber, whatsappUrl } from "@/lib/whatsapp";
import { NotificationList } from "../../_components/notification-list";
import { OrderProgress } from "../../_components/order-progress";
import { AdminHeader, Panel, Pill } from "../../_components/ui";
import { OrderActions } from "./order-actions";

export const metadata = { title: "Commande" };

// Commandes sur lesquelles l'équipe a encore une étape à franchir.
const ACTIVE = new Set(["awaiting_payment", "reward_requested", "confirmed", "in_production", "out_for_delivery", "ready_for_pickup"]);

export default async function AdminOrderPage({ params }: PageProps<"/admin/commandes/[id]">) {
  await requireStaff();
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();
  const notifications = await listNotifications({ orderId: order.id });
  const firstName = order.customer_name.split(" ")[0];
  const wa = whatsappUrl(toWhatsappNumber(order.customer_phone), `Bonjour ${firstName}, c'est KALIMA au sujet de votre commande ${order.reference}. `);

  return (
    <>
      <AdminHeader
        back={{ href: "/admin/commandes", label: "Commandes" }}
        kicker={`la commande de ${firstName}`}
        title={order.reference}
        subtitle={<span>Passée le {formatDate(order.created_at)} · {order.fulfillment === "delivery" ? "Livraison" : "Retrait"}</span>}
        actions={
          <>
            {order.kind === "reward" ? <Pill tone="violet">Box offerte</Pill> : null}
            <OrderStatusBadge status={order.status} className="!px-3 !py-1.5 !text-sm" />
          </>
        }
      />
      <div className="mb-8 rounded-[1.3rem] border-2 border-dashed border-kraft/45 bg-paper px-3 py-4 sm:px-5">
        <OrderProgress status={order.status} fulfillment={order.fulfillment} reached={order.events.map((e) => e.to_status)} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Panel title="Prochaine étape" hint={ACTIVE.has(order.status) ? "à faire maintenant" : "si besoin"} focus={ACTIVE.has(order.status)}>
            {order.payment_declared_at && order.status === "awaiting_payment" ? (
              <p className="mb-4 rounded-xl border-2 border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
                Le client a signalé son paiement le {formatDate(order.payment_declared_at)}. Vérifiez sa réception avant de confirmer.
              </p>
            ) : null}
            <OrderActions orderId={order.id} status={order.status} fulfillment={order.fulfillment} kind={order.kind} total={order.total} paid={Boolean(order.paid_at)} />
          </Panel>

          <Panel
            title="Contenu"
            actions={
              <a href={`/impression/commandes/${order.id}`} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">
                Imprimer le ticket
              </a>
            }
          >
            <Receipt
              title={order.kind === "reward" ? "Box offerte" : "Commande"}
              meta={`${order.reference} · ${formatDate(order.created_at)}`}
              barcode={order.reference}
              thanks={false}
              className="mx-auto max-w-md"
            >
              <dl className="space-y-3 text-[0.95rem]">
                {order.items.map((item) => (
                  <ReceiptLine
                    key={item.id}
                    label={<strong>{item.boxes} × {item.product_name}</strong>}
                    value={formatPrice(item.line_total)}
                    detail={
                      <>
                        {item.format_label}
                        {item.units ? ` · ${item.units} ${item.unit_label}${item.units > 1 ? "s" : ""} par boîte` : ""} · {formatPrice(item.box_price)} / boîte
                        {item.supplements.length ? <span className="block text-violet">+ {item.supplements.map((s) => s.name).join(", ")} (par boîte)</span> : null}
                      </>
                    }
                  />
                ))}
                <ReceiptLine label="Réception" value={order.fulfillment === "delivery" ? "Livraison (à convenir)" : "Retrait"} muted />
                <ReceiptTotal label="Total" value={formatPrice(order.total)} />
              </dl>
              {order.paid_at ? <PaidStamp date={formatDate(order.paid_at)} /> : null}
              {order.paid_at ? (
                <p className="mt-2 text-center text-xs text-muted">
                  Reçu : {formatPrice(order.paid_amount ?? 0)}
                  {order.payment_reference ? ` · réf. ${order.payment_reference}` : ""}
                </p>
              ) : null}
              {order.refunded_amount ? <p className="mt-2 text-center text-sm font-semibold text-danger">Remboursé : {formatPrice(order.refunded_amount)}</p> : null}
            </Receipt>
          </Panel>

          {order.gift_message || order.customer_note ? (
            <Panel title="Messages du client">
              {order.gift_message ? (
                <div className="note-card rotate-[-0.5deg] !pt-6">
                  <p className="text-xs font-bold tracking-widest text-violet uppercase">Petit mot à glisser</p>
                  <p className="hand mt-1 text-2xl text-violet">{order.gift_message}</p>
                </div>
              ) : (
                <p className="text-sm text-muted">Petit mot : choisi par KALIMA.</p>
              )}
              {order.customer_note ? <p className="mt-4 rounded-xl bg-mist px-4 py-3 text-sm whitespace-pre-line">{order.customer_note}</p> : null}
            </Panel>
          ) : null}
        </div>

        <div className="space-y-6">
          <Panel title="Client">
            <dl className="space-y-2 text-sm">
              <div><dt className="text-muted">Nom</dt><dd className="font-semibold">{order.customer_name}</dd></div>
              <div><dt className="text-muted">WhatsApp</dt><dd className="font-semibold">{order.customer_phone}</dd></div>
              <div><dt className="text-muted">E-mail</dt><dd className="break-all">{order.customer_email}</dd></div>
              {order.delivery_area ? <div><dt className="text-muted">Zone de livraison</dt><dd>{order.delivery_area}</dd></div> : null}
              {order.referral_code ? <div><dt className="text-muted">Code ambassadeur</dt><dd className="tabular">{order.referral_code}</dd></div> : null}
            </dl>
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-4 w-full">
                <WhatsappIcon /> Ouvrir la conversation
              </a>
            ) : null}
            <p className="mt-2 text-center text-xs text-muted">Le message est prérempli : rien n&apos;est envoyé sans vous.</p>
          </Panel>

          <Panel title="E-mails">
            {notifications.length ? <NotificationList rows={notifications} /> : <p className="text-sm text-muted">Aucun e-mail pour l&apos;instant.</p>}
          </Panel>

          <Panel title="Historique">
            <ol className="space-y-3 text-sm">
              {order.events.map((e) => (
                <li key={e.id} className="relative border-l-2 border-dotted border-kraft/60 pl-4">
                  <span aria-hidden className="absolute top-1.5 -left-[5px] size-2 rounded-full bg-violet" />
                  <p className="font-semibold">{e.from_status === e.to_status ? "Note" : STATUS_LABELS[e.to_status]}</p>
                  <p className="text-muted">{formatDate(e.created_at)} · {e.actor_label}</p>
                  {e.note ? <p className="mt-0.5">{e.note}</p> : null}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}
