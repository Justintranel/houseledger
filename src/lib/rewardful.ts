/**
 * Rewardful affiliate tracking utilities.
 *
 * Rewardful sets window.Rewardful.referral after their script initialises.
 * We read it at checkout time so the referral ID is captured in the Stripe
 * checkout session — Rewardful then handles commission attribution automatically
 * via the Stripe webhook events it listens to.
 *
 * Usage:
 *   import { getRewardfulReferral } from "@/lib/rewardful";
 *   const referralId = getRewardfulReferral(); // call client-side only
 */

declare global {
  interface Window {
    Rewardful?: {
      referral?: string;      // affiliate referral ID (e.g. "abc123")
      affiliate?: {
        id: string;
        name: string;
        token: string;
      };
    };
    rewardful?: (...args: unknown[]) => void;
  }
}

/**
 * Returns the current Rewardful referral ID if the visitor arrived via an
 * affiliate link, or undefined if no referral is active.
 *
 * Safe to call in useEffect or event handlers (client-side only).
 */
export function getRewardfulReferral(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.Rewardful?.referral || undefined;
}
