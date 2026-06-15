// Daily allowance: any player may self-redeem a fixed top-up once per rolling
// 24h via the Redeem button. We persist only when each player last redeemed
// (players.last_redeemed_at); eligibility is derived here so it stays testable
// and out of the action.

/** Coins granted per redemption. */
export const DAILY_ALLOWANCE = 1000;

/** Minimum time between redemptions (rolling window from the last claim). */
export const ALLOWANCE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * A redeem never lifts a balance above this. It caps *allowances only* — winnings
 * can carry a balance higher; the daily top-up just won't add to it past the cap.
 */
export const ALLOWANCE_CAP = 5000;

/**
 * Coins a redemption grants at a given balance: the full DAILY_ALLOWANCE, trimmed
 * so it never pushes past ALLOWANCE_CAP. Returns 0 once the balance is at/over the
 * cap (so the player can't redeem).
 */
export function allowanceGrant(balance: number): number {
  return Math.max(0, Math.min(DAILY_ALLOWANCE, ALLOWANCE_CAP - balance));
}

/**
 * Whether a player may redeem right now. `lastRedeemedAt` is the stored ISO
 * timestamp (null = never redeemed = eligible); `now` is epoch ms supplied by
 * the caller so this stays pure.
 */
export function canRedeem(lastRedeemedAt: string | null, now: number): boolean {
  if (!lastRedeemedAt) return true;
  return now - new Date(lastRedeemedAt).getTime() >= ALLOWANCE_COOLDOWN_MS;
}
