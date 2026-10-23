import Link from "next/link";
import { Bang } from "@/components/brand";
import { formatPrice } from "@/lib/format";
import { getDashboardCounts, getSalesIndicators } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { emailProvider, emailProviderLabel } from "@/lib/server/email";
import { getSettings } from "@/lib/server/settings";
import { storageMode } from "@/lib/server/storage";
import { AdminHeader, Panel } from "./_components/ui";

const PERIODS = { "7": "7 derniers jours", "30": "30 derniers jours", "365": "12 derniers mois" } as const;

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const staff = await requireStaff();
  const { periode } = await searchParams;
  const days = (typeof periode === "string" && periode in PERIODS ? periode : "30") as keyof typeof PERIODS;
  const [counts, sales, settings] = await Promise.all([getDashboardCounts(), getSalesIndicators(Number(days)), getSettings()]);

  const todo = [
    { label: "Paiements signalés à vérifier", value: counts.payments_declared, href: "/admin/commandes?filtre=verifier", urgent: true },
    { label: "Commandes en attente de paiement", value: counts.payments_to_check - counts.payments_declared, href: "/admin/commandes?filtre=verifier" },
    { label: "Box ambassadeur à valider", value: counts.rewards_to_validate, href: "/admin/commandes?filtre=verifier", urgent: true },
    { label: "Confections à lancer", value: counts.to_start, href: "/admin/commandes?filtre=preparer", urgent: true },
    { label: "En confection", value: counts.in_production, href: "/admin/commandes?filtre=preparer" },
    { label: "Prêtes ou en livraison", value: counts.out_or_ready, href: "/admin/commandes?filtre=remise" },
    { label: "Nouvelles demandes d'événement", value: counts.new_events, href: "/admin/evenements", urgent: true },
    { label: "E-mails en échec", value: counts.failed_notifications, href: "/admin/notifications", urgent: true },
  ];

  const setup = [
    !settings.payment.link && "Le lien de paiement n'est pas renseigné : les clients sont invités à vous écrire sur WhatsApp pour payer.",
    emailProvider() !== "brevo" && `Service d'e-mail : ${emailProviderLabel()}. Les clients ne reçoivent pas encore les e-mails.`,
    storageMode() !== "supabase" && "Stockage des photos : mode local de développement (à configurer avant la mise en ligne).",
    !settings.orders_open && "Les commandes en ligne sont fermées.",
  ].filter(Boolean) as string[];

  return (
    <>
      <AdminHeader title={`Bonjour ${staff.staff.displayName} !`} subtitle="Voici ce qui vous attend aujourd'hui." />

      {setup.length ? (
        <div className="mb-6 rounded-2xl border border-warning/30 bg-warning-soft p-5 text-warning">
          <p className="font-bold">À configurer</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {setup.map((s) => <li key={s}>{s}</li>)}
          </ul>
          <Link href="/admin/parametres" className="mt-3 inline-block text-sm font-bold underline underline-offset-4">Ouvrir les paramètres</Link>
        </div>
      ) : null}

      <section aria-labelledby="a-traiter">
        <h2 id="a-traiter" className="sr-only">À traiter</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {todo.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`flex h-full flex-col justify-between gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] ${
                  item.value > 0 && item.urgent ? "border-violet bg-lilac-soft" : "border-line bg-white"
                }`}
              >
                <span className="text-sm leading-snug font-semibold text-night/80">{item.label}</span>
                <span className="display tabular flex items-center gap-2 text-4xl">
                  {item.value}
                  {item.value > 0 && item.urgent ? <Bang className="h-6 w-3.5 text-violet" /> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Panel
        className="mt-6"
        title="Ventes"
        actions={
          <nav aria-label="Période" className="flex gap-1 rounded-full bg-mist p-1 text-xs font-semibold">
            {Object.entries(PERIODS).map(([value, label]) => (
              <Link key={value} href={`/admin?periode=${value}`} aria-current={value === days ? "true" : undefined} className="rounded-full px-3 py-1.5 aria-[current=true]:bg-white aria-[current=true]:shadow-sm">
                {label.replace(" derniers", "").replace(" jours", " j").replace(" mois", " mois")}
              </Link>
            ))}
          </nav>
        }
      >
        <dl className="tabular grid grid-cols-2 gap-4 md:grid-cols-4">
          <div><dt className="text-sm text-muted">Ventes encaissées</dt><dd className="display text-2xl">{formatPrice(sales.paid_total)}</dd></div>
          <div><dt className="text-sm text-muted">Commandes payées</dt><dd className="display text-2xl">{sales.paid_orders}</dd></div>
          <div><dt className="text-sm text-muted">Panier moyen</dt><dd className="display text-2xl">{formatPrice(sales.average_basket)}</dd></div>
          <div><dt className="text-sm text-muted">Remboursements</dt><dd className="display text-2xl">{sales.refunds_count} · {formatPrice(sales.refunds_total)}</dd></div>
        </dl>
        <p className="mt-4 text-xs text-muted">
          {PERIODS[days]}. Montants des paiements vérifiés, produits uniquement (livraison non incluse). Il s&apos;agit d&apos;un chiffre d&apos;affaires, pas d&apos;un bénéfice : les coûts ne sont pas déduits.
        </p>
        {sales.products.length ? (
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="text-sm font-bold">Boîtes vendues</h3>
            <ul className="mt-2 space-y-1.5">
              {sales.products.map((p) => {
                const max = sales.products[0].boxes;
                return (
                  <li key={p.product_name} className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3 text-sm">
                    <span className="truncate">{p.product_name}</span>
                    <span className="h-2.5 rounded-full bg-mist"><span className="block h-full rounded-full bg-violet" style={{ width: `${(p.boxes / max) * 100}%` }} /></span>
                    <span className="tabular text-right font-semibold">{p.boxes}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </Panel>
    </>
  );
}
