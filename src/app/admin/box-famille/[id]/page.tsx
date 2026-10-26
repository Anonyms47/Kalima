import { notFound } from "next/navigation";
import { WhatsappIcon } from "@/components/icons";
import { Receipt } from "@/components/receipt";
import { formatDate, formatDay, formatPrice } from "@/lib/format";
import { getFamilyBoxRequest } from "@/lib/server/admin-queries";
import { requireStaff } from "@/lib/server/auth";
import { toWhatsappNumber, whatsappUrl } from "@/lib/whatsapp";
import { AdminHeader, Panel } from "../../_components/ui";
import { FamilyBoxAdminForm } from "./family-box-form";

export const metadata = { title: "Box famille" };

export default async function AdminFamilyBoxPage({ params }: PageProps<"/admin/box-famille/[id]">) {
  await requireStaff();
  const { id } = await params;
  const request = await getFamilyBoxRequest(id);
  if (!request) notFound();
  const firstName = request.name.split(" ")[0];
  const message =
    request.price !== null
      ? `Bonjour ${firstName}, c'est KALIMA ! Votre box famille ${request.reference} est à ${formatPrice(request.price)}. `
      : `Bonjour ${firstName}, c'est KALIMA au sujet de votre box famille ${request.reference}. `;
  const wa = whatsappUrl(toWhatsappNumber(request.phone), message);
  const sides = [
    { title: "Sucré", rows: request.items.filter((i) => i.side === "sweet") },
    { title: "Salé", rows: request.items.filter((i) => i.side === "salty") },
  ];

  return (
    <>
      <AdminHeader back={{ href: "/admin/box-famille", label: "Box famille" }} kicker={`la box de ${firstName}`} title={request.reference} subtitle={`Reçue le ${formatDate(request.created_at)}`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <Receipt title="Box famille" meta={request.reference} barcode={request.reference} thanks={false} className="mx-auto w-full max-w-md">
            <div className="space-y-3 text-[0.95rem]">
              {sides.map((side) =>
                side.rows.length ? (
                  <div key={side.title}>
                    <p className="text-xs font-bold tracking-[0.18em] text-kraft-deep uppercase">{side.title}</p>
                    <ul className="mt-1 space-y-1">
                      {side.rows.map((i) => (
                        <li key={i.item} className="flex items-baseline gap-2">
                          <span className="tabular w-10 shrink-0 font-semibold">{i.quantity} ×</span>
                          <span>{i.item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
              {request.note ? (
                <p className="rounded-lg bg-white/70 px-3 py-2 text-sm">
                  <span className="font-semibold">Précisions : </span>
                  {request.note}
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-dashed border-night/25 pt-3">
              <span className="text-sm font-bold tracking-[0.14em] uppercase">Prix</span>
              {request.price !== null ? (
                <span className="display tabular text-3xl">{formatPrice(request.price)}</span>
              ) : (
                <span className="hand text-2xl text-violet">à fixer</span>
              )}
            </div>
          </Receipt>

          <Panel title="Client">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">Nom</dt><dd className="font-semibold">{request.name}</dd></div>
              <div><dt className="text-muted">WhatsApp</dt><dd className="font-semibold">{request.phone}</dd></div>
              <div><dt className="text-muted">Personnes</dt><dd className="font-semibold">{request.guests ?? "Non précisé"}</dd></div>
              <div><dt className="text-muted">Pour quand</dt><dd className="font-semibold">{request.wanted_date ? formatDay(request.wanted_date) : "Non précisé"}</dd></div>
            </dl>
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-5 w-full">
                <WhatsappIcon /> {request.price !== null ? "Envoyer le prix sur WhatsApp" : "Répondre sur WhatsApp"}
              </a>
            ) : null}
            <p className="mt-2 text-center text-xs text-muted">Le message est prérempli : rien n&apos;est envoyé sans vous.</p>
          </Panel>
        </div>

        <Panel title="Prix et suivi" hint={request.status === "new" ? "à faire maintenant" : undefined} focus={request.status === "new"}>
          <FamilyBoxAdminForm request={request} />
        </Panel>
      </div>
    </>
  );
}
