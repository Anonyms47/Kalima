import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bang } from "@/components/brand";
import { BackIcon, ClockIcon, WhatsappIcon } from "@/components/icons";
import { Note } from "@/components/note";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderTimeline } from "@/components/order-timeline";
import { isProductionSite } from "@/lib/config";
import { formatDate, formatPrice } from "@/lib/format";
import { requireUser } from "@/lib/server/auth";
import { getOrderForUser } from "@/lib/server/order-queries";
import { getSettings } from "@/lib/server/settings";
import { whatsappUrl } from "@/lib/whatsapp";
import { CancelOrderButton, DeclarePaymentButton } from "./customer-actions";

export const metadata: Metadata = { title: "Suivi de commande" };

export default async function OrderPage({ params, searchParams }: PageProps<"/compte/commandes/[reference]">) {
  const { reference } = await params;
  const { nouvelle } = await searchParams;
  const user = await requireUser(`/compte/commandes/${reference}`);
  const [order, settings] = await Promise.all([getOrderForUser(user.id, reference), getSettings()]);
  // Une commande d'un autre client répond exactement comme une commande inexistante.
  if (!order) notFound();

  const wa = whatsappUrl(settings.contact.whatsapp_number, `Bonjour KALIMA, je vous écris au sujet de ma commande ${order.reference}.`);
  const awaiting = order.status === "awaiting_payment";
  const paymentLink = settings.payment.link;
  const canCancel = (awaiting || order.status === "expired") && !order.payment_declared_at;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-20 sm:px-6">
      <Link href="/compte" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-night">
        <BackIcon className="size-4" /> Mes commandes
      </Link>

      {nouvelle && awaiting ? (
        <Note className="mx-auto mt-8 max-w-md" signature="KALIMA">
          Merci ! Votre commande est enregistrée. Il ne reste plus qu&apos;à la régler.
        </Note>
      ) : null}

      <header className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow"><Bang className="h-4 w-2.5 text-lilac" /> {order.kind === "reward" ? "Box offerte" : "Commande"}</p>
          <h1 className="display tabular mt-2 text-4xl sm:text-5xl">{order.reference}</h1>
          <p className="mt-2 text-muted">Passée le {formatDate(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} className="!px-4 !py-2 !text-sm" />
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {awaiting ? (
            <section className="card overflow-hidden" aria-labelledby="paiement">
              <div className="bg-night p-6 text-white sm:p-7">
                <h2 id="paiement" className="display text-2xl">Réglez votre commande</h2>
                <p className="mt-1 text-white/75">Paiement de la totalité, en une fois.</p>
                <p className="display tabular mt-4 text-5xl">{formatPrice(order.total)}</p>
              </div>
              <div className="space-y-4 p-6 sm:p-7">
                {order.payment_declared_at ? (
                  <p role="status" className="rounded-2xl bg-lilac-soft px-4 py-3 font-medium text-violet-deep">
                    Merci ! Vous nous avez signalé votre paiement le {formatDate(order.payment_declared_at)}. Nous le vérifions et vous confirmons la commande par e-mail.
                  </p>
                ) : paymentLink ? (
                  <>
                    <ol className="list-decimal space-y-2 pl-5 text-[0.97rem]">
                      <li>Ouvrez le lien de paiement {settings.payment.label ? `(${settings.payment.label})` : ""}.</li>
                      <li>
                        Payez <strong className="tabular">{formatPrice(order.total)}</strong> en indiquant la référence <strong className="tabular">{order.reference}</strong>.
                      </li>
                      <li>Revenez ici et signalez votre paiement : KALIMA le vérifie puis confirme la commande.</li>
                    </ol>
                    {settings.payment.instructions ? <p className="rounded-xl bg-mist px-4 py-3 text-sm whitespace-pre-line">{settings.payment.instructions}</p> : null}
                    <a href={paymentLink} target="_blank" rel="noopener noreferrer" className="btn-primary w-full text-base">
                      Payer {formatPrice(order.total)}
                    </a>
                    <DeclarePaymentButton reference={order.reference} />
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="rounded-2xl bg-warning-soft px-4 py-3 font-medium text-warning">
                      Le paiement en ligne n&apos;est pas encore activé. Écrivez-nous sur WhatsApp avec votre référence : nous vous indiquerons comment régler.
                    </p>
                    {!isProductionSite ? (
                      <p className="text-sm text-muted">Préproduction : aucun moyen de paiement n&apos;est relié, aucun encaissement n&apos;est simulé.</p>
                    ) : null}
                  </div>
                )}
                {order.reservation_expires_at && !order.payment_declared_at ? (
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <ClockIcon className="size-4" /> Vos boîtes sont réservées jusqu&apos;au {formatDate(order.reservation_expires_at)}.
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {order.status === "expired" ? (
            <p className="rounded-2xl bg-mist px-5 py-4 text-night">
              Le délai de paiement est dépassé et la réservation a été libérée. Si vous avez déjà payé, écrivez-nous sur WhatsApp avec votre référence.
            </p>
          ) : null}
          {order.status === "cancelled" ? <p className="rounded-2xl bg-mist px-5 py-4">Cette commande a été annulée.</p> : null}
          {order.status === "refunded" ? (
            <p className="rounded-2xl bg-mist px-5 py-4">
              Cette commande a été remboursée{order.refunded_amount ? ` (${formatPrice(order.refunded_amount)})` : ""}.
            </p>
          ) : null}
          {order.status === "reward_requested" ? (
            <p className="rounded-2xl bg-lilac-soft px-5 py-4 text-violet-deep">
              Votre demande de box offerte est enregistrée. KALIMA la valide puis vous contacte sur WhatsApp.
            </p>
          ) : null}

          <section className="card p-6 sm:p-7" aria-labelledby="suivi">
            <h2 id="suivi" className="display text-2xl">Suivi</h2>
            <div className="mt-5">
              <OrderTimeline status={order.status} fulfillment={order.fulfillment} events={order.events} />
            </div>
            <div className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                  <WhatsappIcon /> Écrire à KALIMA
                </a>
              ) : null}
              <p className="text-sm text-muted sm:self-center">
                {order.fulfillment === "delivery"
                  ? "La livraison se convient sur WhatsApp. Elle n'est pas comprise dans le montant."
                  : `Retrait${settings.pickup.area ? ` à ${settings.pickup.area}` : ""} : le moment se convient sur WhatsApp.`}
              </p>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-6" aria-labelledby="recap">
            <h2 id="recap" className="display text-2xl">Récapitulatif</h2>
            <ul className="mt-4 divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-3">
                  <div className="text-sm">
                    <p className="font-semibold">{item.boxes} × {item.product_name}</p>
                    <p className="text-muted">
                      {item.format_label}
                      {item.units ? ` · ${item.units} ${item.unit_label}${item.units > 1 ? "s" : ""}` : ""}
                      {item.supplements.length ? ` · ${item.supplements.map((s) => s.name).join(", ")}` : ""}
                    </p>
                  </div>
                  <p className="tabular text-sm font-semibold">{formatPrice(item.line_total)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-semibold">{order.kind === "reward" ? "Box offerte" : "Total produits"}</span>
              <span className="display tabular text-2xl">{formatPrice(order.total)}</span>
            </div>
            {order.paid_at && order.kind === "standard" ? (
              <p className="mt-2 text-sm text-success">Paiement vérifié le {formatDate(order.paid_at)}.</p>
            ) : null}
            <dl className="mt-5 space-y-1 border-t border-line pt-4 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">Réception</dt><dd>{order.fulfillment === "delivery" ? "Livraison" : "Retrait"}</dd></div>
              {order.delivery_area ? <div className="flex justify-between gap-3"><dt className="text-muted">Zone</dt><dd>{order.delivery_area}</dd></div> : null}
              <div className="flex justify-between gap-3"><dt className="text-muted">WhatsApp</dt><dd>{order.customer_phone}</dd></div>
              {order.referral_code ? <div className="flex justify-between gap-3"><dt className="text-muted">Code ambassadeur</dt><dd className="tabular">{order.referral_code}</dd></div> : null}
            </dl>
          </section>
          {order.gift_message ? (
            <Note tilt="rotate-[1.5deg]" className="mx-2">
              {order.gift_message}
            </Note>
          ) : null}
          {canCancel ? (
            <div className="px-1">
              <CancelOrderButton reference={order.reference} />
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
