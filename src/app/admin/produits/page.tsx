import Image from "next/image";
import Link from "next/link";
import { PlusIcon } from "@/components/icons";
import { createProductAction, toggleOutOfStockAction } from "@/lib/actions/admin/products";
import { availability, availabilityLabel } from "@/lib/availability";
import { formatPrice } from "@/lib/format";
import { requireStaff } from "@/lib/server/auth";
import { listAllProducts, publicationIssues } from "@/lib/server/catalog";
import { AdminHeader, Pill } from "../_components/ui";

export const metadata = { title: "Produits" };

const STATUS = { published: { label: "Publié", tone: "success" }, draft: { label: "Brouillon", tone: "warning" }, archived: { label: "Archivé", tone: "muted" } } as const;

export default async function AdminProducts() {
  await requireStaff();
  const products = await listAllProducts();
  return (
    <>
      <AdminHeader
        title="Produits"
        subtitle="Seuls les produits publiés sont visibles et commandables."
        actions={
          <form action={createProductAction}>
            <input type="hidden" name="name" value="Nouveau produit" />
            <button type="submit" className="btn-primary btn-sm"><PlusIcon className="size-4" /> Nouveau produit</button>
          </form>
        }
      />
      <ul className="space-y-3">
        {products.map((p) => {
          const a = availability(p);
          const issues = p.status === "draft" ? publicationIssues(p) : [];
          return (
            <li key={p.id} className="flex gap-4 rounded-2xl border border-line bg-white p-4">
              <Link href={`/admin/produits/${p.id}`} className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl bg-mist">
                {p.images[0] ? <Image src={p.images[0].url} alt="" fill sizes="5rem" className="object-cover" /> : <span className="grid h-full place-items-center text-xs text-muted">Sans photo</span>}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/produits/${p.id}`} className="display text-xl hover:text-violet">{p.name}</Link>
                  <Pill tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Pill>
                  {p.is_family_box ? <Pill>Box famille</Pill> : null}
                  {p.reward_eligible ? <Pill tone="violet">Récompense</Pill> : null}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {p.formats.filter((f) => f.active).map((f) => `${f.label} · ${f.pricing === "per_unit" ? `${formatPrice(f.price)}/${f.unit_label}` : formatPrice(f.price)}`).join("  ·  ") || "Aucun format actif"}
                </p>
                <p className="mt-1 text-sm">
                  Stock : <strong>{p.stock_quantity === null ? "sans limite définie" : `${p.stock_quantity} boîte${p.stock_quantity > 1 ? "s" : ""}`}</strong>
                  {" · "}
                  <span className={a.orderable ? "text-success" : "font-semibold text-danger"}>{availabilityLabel(a)}</span>
                </p>
                {issues.length ? <p className="mt-1 text-xs text-warning">À compléter : {issues.join(" ")}</p> : null}
                {p.internal_note && p.status === "draft" ? <p className="mt-1 text-xs text-muted">Note : {p.internal_note}</p> : null}
              </div>
              {p.status === "published" ? (
                <form action={toggleOutOfStockAction} className="shrink-0 self-center">
                  <input type="hidden" name="productId" value={p.id} />
                  <input type="hidden" name="value" value={p.manual_out_of_stock ? "off" : "on"} />
                  <button type="submit" className={`btn-sm btn ${p.manual_out_of_stock ? "bg-night text-white" : "border border-line bg-white"}`} aria-pressed={p.manual_out_of_stock}>
                    {p.manual_out_of_stock ? "Lever la rupture" : "Mettre en rupture"}
                  </button>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
