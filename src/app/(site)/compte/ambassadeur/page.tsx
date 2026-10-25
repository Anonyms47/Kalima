import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { BackIcon, GiftIcon, WhatsappIcon } from "@/components/icons";
import { Note } from "@/components/note";
import { StampCard } from "@/components/stamp-card";
import { appUrl } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { rewardPolicyText } from "@/lib/reward-policy";
import { requireUser } from "@/lib/server/auth";
import { getAmbassadorOverview, REFERRALS_PER_REWARD } from "@/lib/server/referrals";
import { getSettings } from "@/lib/server/settings";
import { activateAmbassadorAction } from "../actions";
import { BadgeShare } from "./badge-share";

export const metadata: Metadata = { title: "Espace ambassadeur" };

const REWARD_STATUS: Record<string, { label: string; tone: string }> = {
  available: { label: "À réclamer", tone: "border-violet text-violet" },
  requested: { label: "Demande en cours", tone: "border-kraft-deep text-kraft-deep" },
  delivered: { label: "Remise", tone: "border-success text-success" },
};

export default async function AmbassadorPage() {
  const user = await requireUser("/compte/ambassadeur");
  const [overview, settings] = await Promise.all([getAmbassadorOverview(user.id), getSettings()]);

  if (!overview) {
    return (
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-4 pt-8 pb-20 sm:px-6 md:grid-cols-[1.1fr_1fr]">
        <div>
          <Link href="/compte" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-night"><BackIcon className="size-4" /> Mon compte</Link>
          <p className="hand mt-6 -rotate-2 text-3xl text-violet">votre carte vous attend</p>
          <h1 className="display mt-1 text-5xl">Devenez ambassadeur</h1>
          <p className="mt-4 text-lg leading-relaxed text-night/75">
            Recevez un code personnel à partager. Chaque fois que cinq nouveaux clients ont été servis grâce à vous, une box individuelle de votre choix vous est offerte.
          </p>
          <form action={activateAmbassadorAction} className="mt-8 max-w-sm">
            <label htmlFor="firstName" className="field-label">Votre prénom</label>
            <input id="firstName" name="firstName" required maxLength={60} autoComplete="given-name" defaultValue={user.firstName ?? ""} className="field" />
            <p className="hand mt-1.5 text-lg text-violet">votre code : KALI + votre prénom</p>
            <button type="submit" className="kraft-label mt-6">Obtenir mon code</button>
          </form>
          <p className="mt-6 text-sm text-muted">
            <Link href="/ambassadeurs" className="font-semibold text-violet underline decoration-lilac decoration-2 underline-offset-4">Lire le règlement du programme</Link>
          </p>
        </div>
        <StampCard stamps={0} caption="encore vierge" className="mx-auto w-full max-w-md rotate-[-2deg]" />
      </div>
    );
  }

  const shareUrl = `${appUrl()}/p/${overview.code}`;
  const shareText = `Je te fais découvrir KALIMA : gaufres et mini pancakes préparés à la commande ! Mon code ambassadeur : ${overview.code} ${shareUrl}`;
  const inTranche = overview.validated % REFERRALS_PER_REWARD;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-20 sm:px-6">
      <Link href="/compte" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-night"><BackIcon className="size-4" /> Mon compte</Link>
      <p className="hand mt-6 -rotate-2 text-3xl text-violet">merci de partager KALIMA !</p>
      <h1 className="display mt-1 text-5xl">Mon espace ambassadeur</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <section aria-labelledby="mon-code">
          <h2 id="mon-code" className="text-xs font-bold tracking-[0.2em] text-muted uppercase">Mon code personnel</h2>
          <StampCard stamps={inTranche} code={overview.code} caption={`encore ${overview.nextRewardIn} avant la box`} className="mt-3 rotate-[-1deg]" />
          <div className="mt-6 flex flex-wrap gap-2">
            <CopyButton value={overview.code} label="Copier le code" />
            <CopyButton value={shareUrl} label="Copier le lien" />
            <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="btn-whatsapp btn-sm">
              <WhatsappIcon className="size-4" /> Partager
            </a>
          </div>
          <p className="mt-3 text-sm text-muted">Vos proches saisissent ce code lors de leur commande. Il ne leur donne pas de réduction.</p>
        </section>

        <section aria-labelledby="progression">
          <h2 id="progression" className="display text-2xl">Ma progression</h2>
          <dl className="tabular mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Filleuls validés", value: overview.validated },
              { label: "En cours", value: overview.pending },
              { label: "Prochaine box dans", value: overview.nextRewardIn },
            ].map((item, index) => (
              <div key={item.label} className={`rounded-xl border-2 border-dashed border-kraft/60 bg-paper px-2 py-3 ${index === 1 ? "rotate-1" : "-rotate-1"}`}>
                <dt className="text-xs text-muted">{item.label}</dt>
                <dd className="display text-3xl">{item.value}</dd>
              </div>
            ))}
          </dl>
          <p className="hand mt-5 text-xl leading-snug text-violet/80">
            un filleul est validé quand sa commande est payée puis livrée ou retirée ; « en cours » : commandes payées pas encore remises.
          </p>
          <p className="mt-2 text-sm text-muted">Chaque personne ne compte qu&apos;une fois.</p>
        </section>
      </div>

      <section className="mt-14" aria-labelledby="mon-badge">
        <p className="hand -rotate-1 text-2xl text-violet">ambassadeur officiel</p>
        <h2 id="mon-badge" className="display text-3xl">Mon badge</h2>
        <div className="mt-6">
          <BadgeShare code={overview.code} shareText={shareText} />
        </div>
      </section>

      <section className="mt-14" aria-labelledby="recompenses">
        <h2 id="recompenses" className="display text-3xl">Mes box offertes</h2>
        {overview.rewards.length === 0 ? (
          <Note className="mt-6 max-w-sm" tilt="rotate-[1deg]">
            Votre première box vous attend au 5ᵉ filleul validé !
          </Note>
        ) : (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2">
            {overview.rewards.map((reward) => {
              const status = REWARD_STATUS[reward.status] ?? REWARD_STATUS.available;
              return (
                /* Bon cadeau à talon pointillé. */
                <li key={reward.id} className="relative flex overflow-hidden rounded-[1.1rem] border-2 border-dashed border-kraft/70 bg-paper shadow-[var(--shadow-soft)]">
                  <div className="flex w-16 shrink-0 flex-col items-center justify-center border-r-2 border-dashed border-kraft/70 bg-kraft-soft text-kraft-deep">
                    <GiftIcon className="size-6" />
                    <span className="display mt-1 text-lg">n°{reward.tier}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="display text-xl leading-tight">Bon pour 1 box</p>
                      <span className={`-rotate-6 rounded-md border-2 px-2 py-0.5 text-xs font-bold whitespace-nowrap ${status.tone}`}>{status.label}</span>
                    </div>
                    <p className="text-sm text-muted">
                      Gagnée le {formatDate(reward.created_at, false)}
                      {reward.product_name ? ` · ${reward.product_name}` : ""}
                      {reward.delivered_at ? ` · remise le ${formatDate(reward.delivered_at, false)}` : ""}
                    </p>
                    {reward.status === "available" ? (
                      <Link href={`/compte/ambassadeur/recompense/${reward.id}`} className="btn-primary btn-sm self-start">Choisir ma box</Link>
                    ) : reward.order_reference ? (
                      <Link href={`/compte/commandes/${reward.order_reference}`} className="hand self-start text-xl text-violet hover:underline">suivre la demande {reward.order_reference} →</Link>
                    ) : null}
                  </div>
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
