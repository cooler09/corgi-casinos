import type { BettingEvent, Player } from './types';

export type WagerValidationError = 'EVENT_NOT_OPEN' | 'INVALID_STAKE' | 'INSUFFICIENT_BALANCE';

export interface PlaceWagerInput {
  event: Pick<BettingEvent, 'status'>;
  player: Pick<Player, 'balance'>;
  stake: number;
  /** Stake already escrowed on this event by this player, if replacing a bet. */
  existingStake?: number;
}

/**
 * Validate placing or replacing a wager. Stake is escrowed at bet time, so the
 * player only needs to cover the *additional* stake beyond what they already
 * have locked on this event (replacing refunds the old escrow first).
 */
export function validateWager(input: PlaceWagerInput): WagerValidationError | null {
  if (input.event.status !== 'open') return 'EVENT_NOT_OPEN';
  if (!Number.isInteger(input.stake) || input.stake <= 0) return 'INVALID_STAKE';

  const additional = input.stake - (input.existingStake ?? 0);
  if (additional > input.player.balance) return 'INSUFFICIENT_BALANCE';

  return null;
}

export const WAGER_ERROR_MESSAGES: Record<WagerValidationError, string> = {
  EVENT_NOT_OPEN: 'This event is closed for betting.',
  INVALID_STAKE: 'Enter a whole number of coins greater than zero.',
  INSUFFICIENT_BALANCE: "You don't have enough coins for that bet.",
};
