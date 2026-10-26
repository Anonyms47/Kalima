import Link from "next/link";
import { Bang } from "@/components/brand";
import { formatPrice } from "@/lib/format";
import { getProductPerformance } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { AdminHeader, EmptyState, Panel } from "../_components/ui";

export const metadata = { title: "Ventes" };

const PERIODS = { "7": "7 jours", "30": "30 jours", "365": "12 mois", tout: "Depuis l'ouverture" } as const;

function percent(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

export default async function AdminSales({ searchParams }: PageProps<"/admin/ventes">) {
  await requireStaff();
  const { periode } = await searchParams;
  const key = (typeof periode === "string" && periode in PERIODS ? periode : "30") as keyof typeof PERIODS;
  const data = await getProductPerformance(key === "tout" ? null : Number(key));
  const [best] = data.products;
  const topBoxes = [...data.products].sort((a, b) => b.boxes - a.boxes)[0];

  return (
    <>
      <AdminHeader kicker="ce qui se vend" title="Ventes" subtitle="Ce que chaque produit rapporte et ce qui part le mieux." />

      <nav aria-label="Période" className="mb-8 flex flex-wrap gap-2">
        {Object.entries(PERIODS).map(([value, label]) => (
          <Link
            key={value}
            href={`/admin/ventes?periode=${value}`}
            aria-current={value === key ? "page" : undefined}
            className="inline-flex min-h-11 items-center rounded-full border-2 border-dashed border-kraft/50 bg-paper px-4 text-sm font-semibold text-night/75 aria-[current=page]:border-solid aria-[current=page]:border-night aria-[current=page]:bg-night aria-[current=page]:text-white"
          >
            {label}
          </Link>
        ))}
      </nav>

      {data.products.length === 0 && data.familyBoxes.count === 0 ? (
        <EmptyState>aucune vente payée sur cette période, pour l&apos;instant.</EmptyState>
      ) : (
        <>
          {/* En un coup d'œil ------------------------------------------------- */}
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.3rem] bg-night p-5 text-white shadow-[0_18px_34px_-18px_rgb(14_18_54/0.9)]">
              <dt className="hand text-xl text-lilac">rapporté sur la période</dt>
              <dd className="display tabular mt-1 text-3xl">{formatPrice(data.total)}</dd>
            </div>
            {best ? (
              <div className="rounded-[1.3rem] border border-line/80 bg-white p-5 shadow-[var(--shadow-soft)]">
                <dt className="hand text-xl text-violet">rapporte le plus</dt>
                <dd className="display mt-1 flex items-center gap-2 text-2xl">
                  {best.product_name} <Bang className="h-6 w-3.5 text-lilac" />
                </dd>
                <dd className="tabular text-sm text-muted">
                  {formatPrice(best.revenue)} · {percent(best.revenue, data.total)} % du total
                </dd>
              </div>
            ) : null}
            {topBoxes ? (
              <div className="rounded-[1.3rem] border border-line/80 bg-white p-5 shadow-[var(--shadow-soft)]">
                <dt className="hand text-xl text-violet">se vend le plus</dt>
                <dd className="display mt-1 text-2xl">{topBoxes.product_name}</dd>
                <dd className="tabular text-sm text-muted">
                  {topBoxes.boxes} boîte{topBoxes.boxes > 1 ? "s" : ""} vendue{topBoxes.boxes > 1 ? "s" : ""}
                </dd>
              </div>
            ) : null}
          </dl>

          {/* Classement des produits ------------------------------------------- */}
          <section aria-labelledby="classement" className="mt-10">
            <h2 id="classement" className="display text-2xl">Le classement</h2>
            <ol className="mt-5 space-y-4">
              {data.products.map((p, index) => (
                <li key={p.product_name} className="rounded-[1.3rem] border border-line/80 bg-white p-5 shadow-[var(--shadow-soft)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`display grid size-11 shrink-0 place-items-center rounded-full text-lg ${
                          index === 0 ? "bg-night text-white" : "-rotate-6 border-2 border-violet text-violet"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="display text-xl">{p.product_name}</p>
                        <p className="tabular text-sm text-muted">
                          {p.boxes} boîte{p.boxes > 1 ? "s" : ""} · {p.orders} commande{p.orders > 1 ? "s" : ""}
                          {p.boxes ? ` · ${formatPrice(Math.round(p.revenue / p.boxes))} en moyenne par boîte` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="sm:text-right">
                      <span className="display tabular block text-2xl">{formatPrice(p.revenue)}</span>
                      <span className="tabular text-sm text-muted">{percent(p.revenue, data.total)} % du total</span>
                    </p>
                  </div>
                  <span className="mt-4 block h-3.5 overflow-hidden rounded-md bg-kraft-soft" aria-hidden>
                    <span
                      className={`block h-full rounded-md ${index === 0 ? "bg-kraft" : "bg-kraft/60"} bg-[repeating-linear-gradient(-45deg,transparent_0,transparent_6px,rgb(122_82_40/0.12)_6px,rgb(122_82_40/0.12)_8px)]`}
                      style={{ width: `${Math.max(3, percent(p.revenue, data.total))}%` }}
                    />
                  </span>
                  {p.formats.length > 1 ? (
                    <ul className="mt-4 grid gap-x-6 gap-y-1.5 border-t-2 border-dotted border-kraft/40 pt-3 text-sm sm:grid-cols-2">
                      {p.formats.map((f) => (
                        <li key={f.format_label} className="flex items-baseline gap-2">
                          <span className="min-w-0 truncate">{f.format_label}</span>
                          <span aria-hidden className="min-w-4 flex-1 translate-y-[-0.3em] border-b border-dotted border-night/25" />
                          <span className="tabular shrink-0 text-muted">
                            {f.boxes} · <strong className="text-night">{formatPrice(f.revenue)}</strong>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {p.offered ? (
                    <p className="hand mt-2 text-lg text-violet">
                      + {p.offered} boîte{p.offered > 1 ? "s" : ""} offerte{p.offered > 1 ? "s" : ""} aux ambassadeurs
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
            <Panel title="Les suppléments préférés" hint="comptés par boîte">
              {data.supplements.length ? (
                <ul className="space-y-2 text-[0.95rem]">
                  {data.supplements.map((s, index) => (
                    <li key={s.name} className="flex items-baseline gap-2">
                      <span className="hand w-6 shrink-0 text-xl text-violet">{index + 1}.</span>
                      <span className="min-w-0 truncate font-semibold">{s.name}</span>
                      <span aria-hidden className="min-w-4 flex-1 translate-y-[-0.3em] border-b border-dotted border-night/25" />
                      <span className="tabular shrink-0 text-muted">
                        {s.boxes} · <strong className="text-night">{formatPrice(s.revenue)}</strong>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="hand text-xl text-muted">aucun supplément sur la période.</p>
              )}
              <p className="mt-4 text-xs text-muted">Déjà inclus dans le chiffre de chaque produit ci-dessus.</p>
            </Panel>

            <Panel title="Box famille" hint="payées sur la période">
              <p className="display tabular text-3xl">{formatPrice(data.familyBoxes.revenue)}</p>
              <p className="mt-1 text-sm text-muted">
                {data.familyBoxes.count} box famille payée{data.familyBoxes.count > 1 ? "s" : ""} (case « Paiement reçu » cochée, au prix fixé dans la demande).
              </p>
              <Link href="/admin/box-famille" className="mt-3 inline-block text-sm font-semibold text-violet underline decoration-lilac decoration-2 underline-offset-4">
                Voir les box famille
              </Link>
            </Panel>
          </div>
        </>
      )}

      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-muted">
        Commandes au paiement vérifié, hors commandes remboursées ; livraison non incluse. C&apos;est un chiffre d&apos;affaires, pas un bénéfice : le coût
        des ingrédients et des boîtes n&apos;est pas connu du site.
      </p>
    </>
  );
}
