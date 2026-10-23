import "server-only";
import { randomInt } from "node:crypto";
import { audit, type Actor } from "./audit";
import { sql, type Db } from "./db";

export const REFERRALS_PER_REWARD = 5;
export const REFUND_REVOCATION = "Commande remboursée";
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function randomCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

/** Active le profil ambassadeur et attribue un code unique (idempotent). */
export async function activateAmbassador(userId: string) {
  const [existing] = await sql<{ code: string }[]>`select code from ambassadors where user_id = ${userId}`;
  if (existing) return existing.code;
  for (let attempt = 0; attempt < 8; attempt++) {
    const [row] = await sql<{ code: string }[]>`
      insert into ambassadors (user_id, code) values (${userId}, ${`K${randomCode(6)}`})
      on conflict do nothing returning code`;
    if (row) {
      await audit(sql, { userId, label: "Client" }, "ambassador.activated", "ambassador", userId, { code: row.code });
      return row.code;
    }
    const [again] = await sql<{ code: string }[]>`select code from ambassadors where user_id = ${userId}`;
    if (again) return again.code;
  }
  throw new Error("Impossible de générer un code ambassadeur unique.");
}

/**
 * Appelée dans la transaction qui passe une commande à « livrée » ou « retirée ».
 * Un filleul ne compte qu'une fois par ambassadeur (clé primaire), les commandes
 * de récompense et l'auto-parrainage sont exclus.
 */
export async function qualifyReferral(
  tx: Db,
  order: { id: string; user_id: string; kind: string; ambassador_user_id: string | null },
  actor: Actor,
) {
  if (order.kind !== "standard" || !order.ambassador_user_id || order.ambassador_user_id === order.user_id) return;
  // Verrou sur l'ambassadeur : les qualifications simultanées sont sérialisées.
  await tx`select user_id from ambassadors where user_id = ${order.ambassador_user_id} for update`;
  const [inserted] = await tx`
    insert into referrals (ambassador_user_id, referred_user_id, qualifying_order_id)
    values (${order.ambassador_user_id}, ${order.user_id}, ${order.id})
    on conflict (ambassador_user_id, referred_user_id) do update
      set qualifying_order_id = excluded.qualifying_order_id, qualified_at = now(),
          revoked_at = null, revoked_reason = null, revoked_by = null
      -- Seul un retrait lié à un remboursement peut être compensé par une nouvelle commande.
      where referrals.revoked_reason = ${REFUND_REVOCATION}
    returning referred_user_id`;
  if (inserted) {
    await audit(tx, actor, "referral.qualified", "ambassador", order.ambassador_user_id, { order_id: order.id });
  }
  await syncRewards(tx, order.ambassador_user_id, actor);
}

/**
 * Crée une récompense par tranche de cinq filleuls validés (1 à 5, 2 à 10…).
 * Si une correction fait baisser le compteur, les récompenses non réclamées
 * au-delà du nouveau palier sont annulées (avec trace).
 */
export async function syncRewards(tx: Db, ambassadorId: string, actor: Actor) {
  const [{ count }] = await tx<{ count: number }[]>`
    select count(*)::int as count from referrals where ambassador_user_id = ${ambassadorId} and revoked_at is null`;
  const earned = Math.floor(count / REFERRALS_PER_REWARD);
  for (let tier = 1; tier <= earned; tier++) {
    const [created] = await tx`
      insert into rewards (ambassador_user_id, tier) values (${ambassadorId}, ${tier})
      on conflict (ambassador_user_id, tier) do update set status = 'available', note = null
        where rewards.status = 'cancelled' and rewards.order_id is null
      returning id`;
    if (created) await audit(tx, actor, "reward.earned", "ambassador", ambassadorId, { tier });
  }
  const cancelled = await tx<{ tier: number }[]>`
    update rewards set status = 'cancelled', note = 'Palier non atteint après correction'
    where ambassador_user_id = ${ambassadorId} and tier > ${earned} and status = 'available'
    returning tier`;
  for (const row of cancelled) await audit(tx, actor, "reward.cancelled", "ambassador", ambassadorId, { tier: row.tier });
  return { count, earned };
}

/** Correction administrative : retire un parrainage (commande remboursée, doublon…). */
export async function revokeReferralForOrder(tx: Db, orderId: string, reason: string, actor: Actor) {
  const revoked = await tx<{ ambassador_user_id: string }[]>`
    update referrals set revoked_at = now(), revoked_reason = ${reason}, revoked_by = ${actor.userId}
    where qualifying_order_id = ${orderId} and revoked_at is null
    returning ambassador_user_id`;
  for (const row of revoked) {
    await audit(tx, actor, "referral.revoked", "ambassador", row.ambassador_user_id, { order_id: orderId, reason });
    await syncRewards(tx, row.ambassador_user_id, actor);
  }
}

export type AmbassadorOverview = {
  code: string;
  active: boolean;
  validated: number;
  pending: number;
  nextRewardIn: number;
  rewards: {
    id: string;
    tier: number;
    status: "available" | "requested" | "delivered" | "cancelled";
    product_name: string | null;
    order_reference: string | null;
    created_at: string;
    requested_at: string | null;
    delivered_at: string | null;
  }[];
};

/** Vue de l'ambassadeur : compteurs uniquement, aucune donnée sur les filleuls. */
export async function getAmbassadorOverview(userId: string): Promise<AmbassadorOverview | null> {
  const [amb] = await sql<{ code: string; active: boolean }[]>`select code, active from ambassadors where user_id = ${userId}`;
  if (!amb) return null;
  const [{ validated }] = await sql<{ validated: number }[]>`
    select count(*)::int as validated from referrals where ambassador_user_id = ${userId} and revoked_at is null`;
  // Filleuls en cours : commandes payées, pas encore exécutées, d'un client pas encore compté.
  const [{ pending }] = await sql<{ pending: number }[]>`
    select count(distinct o.user_id)::int as pending from orders o
    where o.ambassador_user_id = ${userId} and o.kind = 'standard'
      and o.status in ('confirmed', 'in_production', 'out_for_delivery', 'ready_for_pickup')
      and not exists (select 1 from referrals r where r.ambassador_user_id = ${userId} and r.referred_user_id = o.user_id)`;
  const rewards = await sql<AmbassadorOverview["rewards"]>`
    select r.id, r.tier, r.status, p.name as product_name, o.reference as order_reference,
           r.created_at, r.requested_at, r.delivered_at
    from rewards r
    left join products p on p.id = r.product_id
    left join orders o on o.id = r.order_id
    where r.ambassador_user_id = ${userId} and r.status <> 'cancelled'
    order by r.tier`;
  return {
    code: amb.code,
    active: amb.active,
    validated,
    pending,
    nextRewardIn: REFERRALS_PER_REWARD - (validated % REFERRALS_PER_REWARD),
    rewards,
  };
}
