import type { Direction, Outcome, Wager } from './types';

export interface WagerSettlement {
  wagerId: string;
  outcome: Outcome;
  /** Gross coins credited back to the player's balance at settle time. */
  payout: number;
}

/** Which side of the line won, or null for an exact tie (a push). */
export function winningDirection(line: number, result: number): Direction | null {
  if (result > line) return 'over';
  if (result < line) return 'under';
  return null;
}

/**
 * Settle every wager on an event. Stake was escrowed (debited from balance) when
 * the bet was placed, so `payout` is the gross amount credited back:
 *   - won  → floor(stake * payoutMultiplier)   net gain = stake * (multiplier - 1)
 *   - push → stake                             refund; net 0
 *   - lost → 0                                 net loss = stake
 */
export function settle(
  line: number,
  result: number,
  payoutMultiplier: number,
  wagers: ReadonlyArray<Pick<Wager, 'id' | 'direction' | 'stake'>>,
): WagerSettlement[] {
  const winner = winningDirection(line, result);
  return wagers.map((w) => {
    if (winner === null) {
      return { wagerId: w.id, outcome: 'push', payout: w.stake };
    }
    if (w.direction === winner) {
      return { wagerId: w.id, outcome: 'won', payout: Math.floor(w.stake * payoutMultiplier) };
    }
    return { wagerId: w.id, outcome: 'lost', payout: 0 };
  });
}
