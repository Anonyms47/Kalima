import { requireStaff } from "@/lib/server/auth";
import { listSupplements } from "@/lib/server/catalog";
import { AdminHeader } from "../_components/ui";
import { SupplementForms } from "./supplement-forms";

export const metadata = { title: "Suppléments" };

export default async function AdminSupplements() {
  await requireStaff();
  const supplements = await listSupplements();
  return (
    <>
      <AdminHeader title="Suppléments" subtitle="Prix appliqué à chaque boîte. Choisissez sur chaque fiche produit les suppléments proposés." />
      <SupplementForms supplements={supplements} />
    </>
  );
}
