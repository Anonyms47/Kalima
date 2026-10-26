export type RewardSupplementsPolicy = "undecided" | "not_included";

export const REWARD_POLICY_TEXT: Record<RewardSupplementsPolicy, string> = {
  undecided: "La box offerte est servie sans supplément. Le traitement des suppléments sur les box offertes sera précisé par KALIMA.",
  not_included: "Les suppléments ne sont pas compris dans la box offerte.",
};

export function rewardPolicyText(policy: string) {
  return REWARD_POLICY_TEXT[(policy as RewardSupplementsPolicy) in REWARD_POLICY_TEXT ? (policy as RewardSupplementsPolicy) : "undecided"];
}
