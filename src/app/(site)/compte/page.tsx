import type { Metadata } from "next";
import Link from "next/link";
import { Bang } from "@/components/brand";
import { ArrowIcon, GiftIcon } from "@/components/icons";
import { Note } from "@/components/note";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { signOutAction } from "@/lib/actions/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { requireUser } from "@/lib/server/auth";
import { listOrdersForUser } from "@/lib/server/order-queries";
import { getAmbassadorOverview } from "@/lib/server/referrals";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage({ searchParams }: PageProps<"/compte">) {
  const user = await requireUser("/compte");
  const { acces } = await searchParams;
  const [orders, ambassador] = await Promise.all([listOrdersForUser(user.id), getAmbassadorOverview(user.id)]);
  const available = ambassador?.rewards.filter((r) => r.status === "available").length ?? 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-20 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow"><Bang className="h-4 w-2.5 text-lilac" /> Mon espace</p>
          <h1 className="display mt-3 text-5xl">Bonjour{user.firstName ? ` ${user.firstName}` : ""} !</h1>
          <p className="mt-2 text-muted">{user.email}</p>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="btn-ghost btn-sm">Se déconnecter</button>
        </form>
      </div>

      {acces === "refuse" ? (
        <p role="alert" className="mt-6 rounded-2xl bg-warning-soft px-5 py-4 font-medium text-warning">
          Cet espace est réservé à l&apos;équipe KALIMA.
        </p>
      ) : null}

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="mes-commandes">
          <h2 id="mes-commandes" className="display text-3xl">Mes commandes</h2>
          {orders.length === 0 ? (
            <div className="mt-5 flex flex-col items-start gap-6 rounded-[2rem] border border-dashed border-line bg-white p-7">
              <Note className="max-w-xs">Pas encore de commande… on vous attend !</Note>
              <Link href="/gourmandises" className="btn-primary">Composer ma première boîte <ArrowIcon /></Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link href={`/compte/commandes/${order.reference}`} className="card flex flex-wrap items-center justify-between gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
                    <div className="min-w-0">
                      <p className="tabular font-bold">{order.reference}{order.kind === "reward" ? " · Box offerte" : ""}</p>
                      <p className="truncate text-sm text-muted">
                        {order.boxes} boîte{order.boxes > 1 ? "s" : ""} · {order.products} · {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular font-semibold">{formatPrice(order.total)}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-[2rem] bg-night p-7 text-white">
            <p className="eyebrow !text-lilac">Ambassadeur</p>
            {ambassador ? (
              <>
                <p className="display mt-3 text-3xl">{ambassador.validated} filleul{ambassador.validated > 1 ? "s" : ""} validé{ambassador.validated > 1 ? "s" : ""}</p>
                <p className="mt-2 text-white/75">
                  Votre code : <strong className="tabular text-white">{ambassador.code}</strong>
                  {available ? ` · ${available} box à réclamer` : ""}
                </p>
              </>
            ) : (
              <>
                <p className="display mt-3 text-3xl">Faites découvrir KALIMA</p>
                <p className="mt-2 text-white/75">5 nouveaux clients servis grâce à vous = 1 box offerte.</p>
              </>
            )}
            <Link href="/compte/ambassadeur" className="btn mt-6 bg-lilac text-night hover:bg-white">
              <GiftIcon /> {ambassador ? "Mon espace ambassadeur" : "Devenir ambassadeur"}
            </Link>
          </section>
          <section className="card p-6" aria-labelledby="mes-infos">
            <h2 id="mes-infos" className="display text-2xl">Mes informations</h2>
            <div className="mt-4">
              <ProfileForm firstName={user.firstName ?? ""} lastName={user.lastName ?? ""} phone={user.phone ?? ""} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
