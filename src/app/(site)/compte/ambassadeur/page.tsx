import type { Metadata } from "next";
import Link from "next/link";
import { Bang } from "@/components/brand";
import { CopyButton } from "@/components/copy-button";
import { BackIcon, GiftIcon, WhatsappIcon } from "@/components/icons";
import { Note } from "@/components/note";
import { appUrl } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { rewardPolicyText } from "@/lib/reward-policy";
import { requireUser } from "@/lib/server/auth";
import { getAmbassadorOverview, REFERRALS_PER_REWARD } from "@/lib/server/referrals";
import { getSettings } from "@/lib/server/settings";
import { activateAmbassadorAction } from "../actions";

export const metadata: Metadata = { title: "Espace ambassadeur" };

const REWARD_STATUS: Record<string, { label: string; tone: string }> = {
  available: { label: "À réclamer", tone: "bg-lilac text-night" },
  requested: { label: "Demande en cours", tone: "bg-kraft-soft text-kraft-deep" },
  delivered: { label: "Remise", tone: "bg-success-soft text-success" },
};

export default async function AmbassadorPage() {
  const user = await requireUser("/compte/ambassadeur");
  const [overview, settings] = await Promise.all([getAmbassadorOverview(user.id), getSettings()]);

  if (!overview) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-20 sm:px-6">
        <Link href="/compte" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-night"><BackIcon className="size-4" /> Mon compte</Link>
        <h1 className="display mt-6 text-5xl">Devenez ambassadeur</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Recevez un code personnel à partager. Chaque fois que cinq nouveaux clients ont été servis grâce à vous, une box individuelle de votre choix vous est offerte.
        </p>
        <form action={activateAmbassadorAction} className="mt-8">
          <button type="submit" className="btn-primary text-base">Obtenir mon code</button>
        </form>
        <p className="mt-6 text-sm text-muted">
          <Link href="/ambassadeurs" className="font-semibold text-violet hover:underline">Lire les règles du programme</Link>
        </p>
      </div>
    );
  }

  const shareUrl = `${appUrl()}/p/${overview.code}`;
  const shareText = `Je te fais découvrir KALIMA : gaufres et mini pancakes préparés à la commande ! Mon code ambassadeur : ${overview.code} ${shareUrl}`;
  const inTranche = overview.validated % REFERRALS_PER_REWARD;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-20 sm:px-6">
      <Link href="/compte" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-night"><BackIcon className="size-4" /> Mon compte</Link>
      <p className="eyebrow mt-6"><Bang className="h-4 w-2.5 text-lilac" /> Espace ambassadeur</p>
      <h1 className="display mt-3 text-5xl">Merci de partager KALIMA !</h1>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section className="note-card rotate-[-1deg] !px-7 !pt-9 !pb-7" aria-labelledby="mon-code">
          <h2 id="mon-code" className="text-sm font-bold tracking-[0.16em] text-violet uppercase">Mon code personnel</h2>
          <p className="display tabular mt-3 text-5xl tracking-[0.12em] text-night">{overview.code}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <CopyButton value={overview.code} label="Copier le code" />
            <CopyButton value={shareUrl} label="Copier le lien" />
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="btn-whatsapp btn-sm">
              <WhatsappIcon className="size-4" /> Partager
            </a>
          </div>
          <p className="mt-4 text-sm text-muted">Vos proches saisissent ce code lors de leur commande. Il ne leur donne pas de réduction.</p>
        </section>

        <section className="card p-6 sm:p-7" aria-labelledby="progression">
          <h2 id="progression" className="display text-2xl">Ma progression</h2>
          <div className="mt-5 flex items-center gap-2" role="img" aria-label={`${inTranche} sur ${REFERRALS_PER_REWARD} vers la prochaine box`}>
            {Array.from({ length: REFERRALS_PER_REWARD }, (_, i) => (
              <span key={i} className={`grid size-11 place-items-center rounded-full ${i < inTranche ? "bg-violet" : "border-2 border-dashed border-line"}`}>
                {i < inTranche ? <Bang className="h-5 w-3 text-lilac" /> : null}
              </span>
            ))}
            <span className="grid size-11 place-items-center rounded-full bg-kraft-soft text-kraft-deep"><GiftIcon /></span>
          </div>
          <dl className="tabular mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-mist p-3"><dt className="text-xs text-muted">Filleuls validés</dt><dd className="display text-3xl">{overview.validated}</dd></div>
            <div className="rounded-2xl bg-mist p-3"><dt className="text-xs text-muted">En cours</dt><dd className="display text-3xl">{overview.pending}</dd></div>
            <div className="rounded-2xl bg-mist p-3"><dt className="text-xs text-muted">Prochaine box dans</dt><dd className="display text-3xl">{overview.nextRewardIn}</dd></div>
          </dl>
          <p className="mt-4 text-sm text-muted">
            Un filleul est validé quand sa commande est payée puis livrée ou retirée. Chaque personne ne compte qu&apos;une fois. « En cours » : commandes payées pas encore remises.
          </p>
        </section>
      </div>

      <section className="mt-10" aria-labelledby="recompenses">
        <h2 id="recompenses" className="display text-3xl">Mes box offertes</h2>
        {overview.rewards.length === 0 ? (
          <Note className="mt-6 max-w-sm" tilt="rotate-[1deg]">
            Votre première box vous attend au 5ᵉ filleul validé !
          </Note>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {overview.rewards.map((reward) => {
              const status = REWARD_STATUS[reward.status] ?? REWARD_STATUS.available;
              return (
                <li key={reward.id} className="card flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="display text-xl">Box n° {reward.tier}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.tone}`}>{status.label}</span>
                  </div>
                  <p className="text-sm text-muted">
                    Gagnée le {formatDate(reward.created_at, false)}
                    {reward.product_name ? ` · ${reward.product_name}` : ""}
                    {reward.delivered_at ? ` · remise le ${formatDate(reward.delivered_at, false)}` : ""}
                  </p>
                  {reward.status === "available" ? (
                    <Link href={`/compte/ambassadeur/recompense/${reward.id}`} className="btn-primary btn-sm self-start">Choisir ma box</Link>
                  ) : reward.order_reference ? (
                    <Link href={`/compte/commandes/${reward.order_reference}`} className="self-start text-sm font-semibold text-violet hover:underline">Suivre la demande {reward.order_reference}</Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-6 max-w-2xl text-sm text-muted">{rewardPolicyText(settings.reward_supplements_policy)} Les box famille ne font pas partie des récompenses. La livraison se convient sur WhatsApp.</p>
      </section>
    </div>
  );
}
