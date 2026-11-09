import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackIcon } from "@/components/icons";
import { availability } from "@/lib/availability";
import { rewardPolicyText } from "@/lib/reward-policy";
import { requireUser } from "@/lib/server/auth";
import { listRewardEligibleProducts } from "@/lib/server/catalog";
import { sql } from "@/lib/server/db";
import { getSettings } from "@/lib/server/settings";
import { ClaimForm } from "./claim-form";

export const metadata: Metadata = { title: "Ma box offerte" };

export default async function ClaimPage({ params }: PageProps<"/compte/ambassadeur/recompense/[id]">) {
  const { id } = await params;
  const user = await requireUser("/compte/ambassadeur");
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [reward] = await sql<{ id: string; tier: number; status: string }[]>`
    select id, tier, status from rewards where id = ${id} and ambassador_user_id = ${user.id}`;
  if (!reward) notFound();
  const [products, settings] = await Promise.all([listRewardEligibleProducts(), getSettings()]);
  const options = products.flatMap((p) =>
    p.formats.map((format) => ({ productId: p.id, productName: p.name, format, available: availability(p).orderable })),
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-20 sm:px-6">
      <Link href="/compte/ambassadeur" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-night"><BackIcon className="size-4" /> Espace ambassadeur</Link>
      <h1 className="display mt-6 text-5xl">Box offerte n° {reward.tier}</h1>
      {reward.status !== "available" ? (
        <p className="mt-6 rounded-2xl bg-mist px-5 py-4">Cette récompense a déjà été utilisée.</p>
      ) : options.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-warning-soft px-5 py-4 font-medium text-warning">
          KALIMA prépare la liste des box proposées en récompense. Votre box reste disponible : revenez bientôt ou écrivez-nous sur WhatsApp.
        </p>
      ) : (
        <>
          <p className="mt-4 text-lg text-muted">Choisissez une box individuelle. KALIMA valide votre demande puis vous contacte.</p>
          <p className="mt-3 text-sm text-muted">{rewardPolicyText(settings.reward_supplements_policy)}</p>
          <div className="mt-8">
            <ClaimForm
              rewardId={reward.id}
              options={options}
              defaults={{ name: [user.firstName, user.lastName].filter(Boolean).join(" "), phone: user.phone ?? "" }}
            />
          </div>
        </>
      )}
    </div>
  );
}
