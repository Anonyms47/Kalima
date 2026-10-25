import Link from "next/link";
import { Bang } from "@/components/brand";
import { ArrowIcon } from "@/components/icons";
import { Receipt, ReceiptLine, ReceiptTotal } from "@/components/receipt";
import { formatPrice } from "@/lib/format";
import { getDashboardCounts, getSalesIndicators } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { emailProvider, emailProviderLabel } from "@/lib/server/email";
import { getSettings } from "@/lib/server/settings";
import { storageMode } from "@/lib/server/storage";
import { AdminHeader } from "./_components/ui";

const PERIODS = { "7": "7 derniers jours", "30": "30 derniers jours", "365": "12 derniers mois" } as const;
const PERIOD_TABS = { "7": "7 jours", "30": "30 jours", "365": "12 mois" } as const;

type Station = { title: string; note: string; value: number; href: string; urgent: boolean; extra?: string };

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const staff = await requireStaff();
  const { periode } = await searchParams;
  const days = (typeof periode === "string" && periode in PERIODS ? periode : "30") as keyof typeof PERIODS;
  const [counts, sales, settings] = await Promise.all([getDashboardCounts(), getSalesIndicators(Number(days)), getSettings()]);

  const waiting = counts.payments_to_check - counts.payments_declared;
  // La chaîne de l'atelier, dans l'ordre où une commande la traverse.
  const stations: Station[] = [
    {
      title: "Paiements à vérifier",
      note: "on regarde l'appli, on confirme",
      value: counts.payments_declared + counts.rewards_to_validate,
      href: "/admin/commandes?filtre=verifier",
      urgent: true,
      extra: [
        counts.rewards_to_validate ? `dont ${counts.rewards_to_validate} box offerte${counts.rewards_to_validate > 1 ? "s" : ""}` : "",
        waiting > 0 ? `+ ${waiting} en attente de paiement` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    },
    { title: "Confections à lancer", note: "payées, prêtes à cuisiner", value: counts.to_start, href: "/admin/commandes?filtre=preparer", urgent: true },
    { title: "En confection", note: "ça sent bon par ici", value: counts.in_production, href: "/admin/commandes?filtre=preparer", urgent: false },
    { title: "Prêtes ou en route", note: "à remettre au client", value: counts.out_or_ready, href: "/admin/commandes?filtre=remise", urgent: false },
  ];
  const next = stations.findIndex((s) => s.value > 0);

  const others = [
    { label: "nouvelle demande d'événement", plural: "nouvelles demandes d'événement", value: counts.new_events, href: "/admin/evenements" },
    { label: "box famille à chiffrer", plural: "box famille à chiffrer", value: counts.new_family_boxes, href: "/admin/box-famille" },
    { label: "e-mail en échec", plural: "e-mails en échec", value: counts.failed_notifications, href: "/admin/notifications" },
  ].filter((o) => o.value > 0);

  const todoTotal = stations[0].value + stations[1].value + others.reduce((sum, o) => sum + o.value, 0);

  const setup = [
    !settings.payment.link && "Renseigner le lien de paiement (en attendant, les clients vous écrivent sur WhatsApp pour payer).",
    emailProvider() !== "brevo" && `Brancher le service d'e-mail (actuellement : ${emailProviderLabel()}).`,
    storageMode() !== "supabase" && "Configurer le stockage des photos (mode local de développement).",
    !settings.orders_open && "Rouvrir les commandes en ligne (elles sont fermées).",
  ].filter(Boolean) as string[];

  const today = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Dakar" }).format(new Date());

  return (
    <>
      <AdminHeader
        kicker={today}
        title={`Bonjour ${staff.staff.displayName} !`}
        subtitle={
          todoTotal > 0
            ? `${todoTotal} chose${todoTotal > 1 ? "s" : ""} vous attend${todoTotal > 1 ? "ent" : ""} à l'atelier.`
            : "Tout est calme à l'atelier. Profitez-en !"
        }
      />

      {/* La chaîne de l'atelier ------------------------------------------------ */}
      <section aria-labelledby="chaine">
        <h2 id="chaine" className="hand text-2xl text-kraft-deep">la chaîne de l&apos;atelier</h2>
        <ol className="mt-3 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          {stations.map((station, index) => {
            const hot = station.value > 0 && station.urgent;
            const isNext = index === next;
            return (
              <li key={station.title} className="relative">
                <Link
                  href={station.href}
                  className={`group relative flex h-full min-h-40 flex-col justify-between gap-3 rounded-[1.3rem] p-4 transition hover:-translate-y-0.5 sm:p-5 ${
                    hot
                      ? "bg-night text-white shadow-[0_18px_34px_-18px_rgb(14_18_54/0.9)]"
                      : "border border-line/80 bg-white shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)]"
                  } ${isNext ? "ring-4 ring-lilac" : ""}`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span
                      className={`display grid size-9 shrink-0 place-items-center rounded-full text-base ${
                        hot ? "bg-lilac text-night" : "-rotate-6 border-2 border-violet text-violet"
                      }`}
                    >
                      {index + 1}
                    </span>
                    {isNext ? (
                      <span className="hand rotate-3 text-lg leading-none text-lilac">commencez ici !</span>
                    ) : hot ? (
                      <span className="rotate-6 rounded-md border-2 border-lilac px-1.5 text-[0.7rem] font-bold tracking-[0.16em] text-lilac uppercase">à faire</span>
                    ) : null}
                  </span>
                  <span>
                    <span className="display tabular flex items-center gap-2 text-5xl leading-none">
                      {station.value}
                      {hot ? <Bang className="h-8 w-4 text-lilac" /> : null}
                    </span>
                    <span className="mt-2 block leading-snug font-semibold">{station.title}</span>
                    <span className={`hand block text-lg leading-tight ${hot ? "text-lilac" : "text-violet/80"}`}>{station.extra || station.note}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        {others.length ? (
          <ul className="mt-5 flex flex-wrap gap-3">
            {others.map((o) => (
              <li key={o.href}>
                <Link href={o.href} className="kraft-label !min-h-11 !text-base">
                  {o.value} {o.value > 1 ? o.plural : o.label} <ArrowIcon className="size-4" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hand mt-5 text-xl text-muted">rien d&apos;autre en attente (événements, box famille, e-mails) : tout roule.</p>
        )}
      </section>

      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1fr_1.05fr]">
        {/* Les ventes, sur un ticket ----------------------------------------- */}
        <section aria-labelledby="ventes-titre">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="ventes-titre" className="display text-2xl">Les ventes</h2>
            <nav aria-label="Période" className="flex gap-1 rounded-full border-2 border-dashed border-kraft/50 bg-paper p-1 text-sm font-semibold">
              {Object.entries(PERIOD_TABS).map(([value, label]) => (
                <Link
                  key={value}
                  href={`/admin?periode=${value}`}
                  aria-current={value === days ? "true" : undefined}
                  className="rounded-full px-3 py-1.5 text-night/70 transition hover:text-night aria-[current=true]:bg-kraft aria-[current=true]:text-night"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <Receipt title="Ticket des ventes" meta={PERIODS[days]} barcode={null} thanks={false} className="mt-5 max-w-md rotate-[-0.6deg]">
            <dl className="space-y-2 text-[0.95rem]">
              <ReceiptLine label="Commandes payées" value={sales.paid_orders} />
              <ReceiptLine label="Panier moyen" value={formatPrice(sales.average_basket)} />
              <ReceiptLine
                label="Remboursements"
                value={sales.refunds_count ? `${sales.refunds_count} · ${formatPrice(sales.refunds_total)}` : "aucun"}
                muted={!sales.refunds_count}
              />
              <ReceiptTotal label="Encaissé" value={formatPrice(sales.paid_total)} />
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Paiements vérifiés, produits uniquement (livraison non incluse). C&apos;est un chiffre d&apos;affaires, pas un bénéfice : les coûts ne sont pas déduits.
            </p>
          </Receipt>
        </section>

        <div className="space-y-10">
          {/* Boîtes vendues ---------------------------------------------------- */}
          <section aria-labelledby="boites-titre">
            <h2 id="boites-titre" className="display text-2xl">Boîtes vendues</h2>
            {sales.products.length ? (
              <ul className="mt-5 space-y-4">
                {sales.products.map((p, index) => {
                  const max = sales.products[0].boxes;
                  return (
                    <li key={p.product_name}>
                      <p className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold">{p.product_name}</span>
                        <span className="tabular display text-xl">{p.boxes}</span>
                      </p>
                      <span className="mt-1.5 block h-4 overflow-hidden rounded-md bg-kraft-soft">
                        <span
                          className={`block h-full rounded-md ${index === 0 ? "bg-kraft" : "bg-kraft/60"} bg-[repeating-linear-gradient(-45deg,transparent_0,transparent_6px,rgb(122_82_40/0.12)_6px,rgb(122_82_40/0.12)_8px)]`}
                          style={{ width: `${Math.max(4, (p.boxes / max) * 100)}%` }}
                        />
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="hand mt-4 text-xl text-muted">aucune boîte payée sur la période, pour l&apos;instant.</p>
            )}
          </section>

          {/* Pense-bête de mise en route -------------------------------------- */}
          {setup.length ? (
            <aside aria-labelledby="pense-bete" className="note-card rotate-[0.8deg] !pt-8">
              <h2 id="pense-bete" className="hand text-3xl text-violet">pense-bête</h2>
              <ul className="mt-1 space-y-2">
                {setup.map((item) => (
                  <li key={item} className="flex gap-3 leading-8">
                    <span aria-hidden className="mt-2 size-4 shrink-0 rounded-[0.3rem] border-2 border-violet/60" />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/admin/parametres" className="mt-3 inline-flex items-center gap-1.5 font-semibold text-violet underline decoration-lilac decoration-2 underline-offset-4">
                Ouvrir les paramètres <ArrowIcon className="size-4" />
              </Link>
            </aside>
          ) : null}
        </div>
      </div>
    </>
  );
}
