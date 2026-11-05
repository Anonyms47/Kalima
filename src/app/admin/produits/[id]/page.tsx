import Link from "next/link";
import { notFound } from "next/navigation";
import { duplicateProductAction } from "@/lib/actions/admin/products";
import { requireStaff } from "@/lib/server/auth";
import { getProductById, listSupplements, publicationIssues } from "@/lib/server/catalog";
import { AdminHeader, Panel, Pill } from "../../_components/ui";
import { FormatsEditor, GeneralForm, PhotosEditor, StatusControls, SupplementsEditor } from "./product-editor";

export const metadata = { title: "Produit" };

const STATUS = { published: { label: "Publié", tone: "success" }, draft: { label: "Brouillon", tone: "warning" }, archived: { label: "Archivé", tone: "muted" } } as const;

export default async function AdminProductPage({ params }: PageProps<"/admin/produits/[id]">) {
  await requireStaff();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [product, supplements] = await Promise.all([getProductById(id), listSupplements()]);
  if (!product) notFound();
  const issues = publicationIssues(product);

  return (
    <>
      <AdminHeader
        back={{ href: "/admin/produits", label: "Produits" }}
        title={product.name}
        subtitle={<Pill tone={STATUS[product.status].tone}>{STATUS[product.status].label}</Pill>}
        actions={
          <>
            {product.status === "published" ? (
              <Link href={`/gourmandises/${product.slug}`} target="_blank" className="btn-ghost btn-sm">Voir la page</Link>
            ) : null}
            <form action={duplicateProductAction}>
              <input type="hidden" name="productId" value={product.id} />
              <button type="submit" className="btn-ghost btn-sm">Dupliquer en brouillon</button>
            </form>
          </>
        }
      />
      <div className="space-y-5">
        <Panel title="Publication">
          <StatusControls product={product} issues={issues} />
        </Panel>
        <GeneralForm product={product} />
        <FormatsEditor product={product} />
        <SupplementsEditor product={product} all={supplements} />
        <PhotosEditor product={product} />
      </div>
    </>
  );
}
