import type { BettingEvent, Outcome, Wager } from './types';

export interface WagerSettlement {
  wagerId: string;
  outcome: Outcome;
  /** Gross coins credited back to the player's balance at settle time. */
  payout: number;
}

type SettlementEvent = Pick<
  BettingEvent,
  'kind' | 'payoutMode' | 'line' | 'payoutMultiplier' | 'result' | 'resultText'
>;
type SettlementWager = Pick<Wager, 'id' | 'pick' | 'guess' | 'stake'>;

function idsWhere(
  wagers: ReadonlyArray<SettlementWager>,
  pred: (w: SettlementWager) => boolean,
): Set<string> {
  return new Set(wagers.filter(pred).map((w) => w.id));
}

/** The winning wager ids, plus whether the whole event is a push (refund all). */
function decideWinners(
  event: SettlementEvent,
  wagers: ReadonlyArray<SettlementWager>,
): { winners: Set<string>; push: boolean } {
  switch (event.kind) {
    case 'over_under': {
      const line = event.line ?? 0;
      const result = event.result ?? 0;
      if (result === line) return { winners: new Set(), push: true };
      const winningPick = result > line ? 'over' : 'under';
      return { winners: idsWhere(wagers, (w) => w.pick === winningPick), push: false };
    }
    case 'yes_no':
    case 'multiple_choice':
      return { winners: idsWhere(wagers, (w) => w.pick === event.resultText), push: false };
    case 'closest': {
      const result = event.result ?? 0;
      const guesses = wagers.filter((w) => w.guess !== null);
      if (guesses.length === 0) return { winners: new Set(), push: false };
      const best = Math.min(...guesses.map((w) => Math.abs((w.guess ?? 0) - result)));
      return {
        winners: idsWhere(guesses, (w) => Math.abs((w.guess ?? 0) - result) === best),
        push: false,
      };
    }
  }
}

/**
 * Settle every wager on an event. Stake was escrowed at bet time, so `payout` is
 * the gross amount credited back. The House is the counterparty: it funds every
 * payout and keeps every leftover stake, so the caller's house P&L for the event
 * is simply `sum(stakes) − sum(payouts)`.
 *
 * - **fixed** mode: winners get floor(stake × multiplier); losers 0. With no
 *   winning backer everyone loses (the House keeps every stake).
 * - **pool** mode (pari-mutuel): winners split the whole pot in proportion to
 *   their stake; losers 0. With no winning backer the House sweeps the pot
 *   (everyone loses).
 * - **push** (Over/Under landing exactly on the line): everyone is refunded and
 *   the House nets zero.
 */
export function settle(
  event: SettlementEvent,
  wagers: ReadonlyArray<SettlementWager>,
): WagerSettlement[] {
  const { winners, push } = decideWinners(event, wagers);

  // A true push refunds everyone regardless of payout mode (e.g. Over/Under
  // landing exactly on the line); no coins change hands.
  if (push) {
    return wagers.map((w) => ({ wagerId: w.id, outcome: 'push', payout: w.stake }));
  }

  if (event.payoutMode === 'fixed') {
    // Fixed odds are funded by the House, not a shared pot — so when nobody
    // backed the winning side everyone simply loses (no winner ⇒ all 'lost').
    return wagers.map((w) =>
      winners.has(w.id)
        ? { wagerId: w.id, outcome: 'won', payout: Math.floor(w.stake * event.payoutMultiplier) }
        : { wagerId: w.id, outcome: 'lost', payout: 0 },
    );
  }

  // pool (pari-mutuel): split the entire pot among winners in proportion to their
  // stake. With no winning backer there's nothing to split, so the House sweeps
  // the whole pot — everyone loses.
  if (winners.size === 0) {
    return wagers.map((w) => ({ wagerId: w.id, outcome: 'lost', payout: 0 }));
  }
  const pot = wagers.reduce((sum, w) => sum + w.stake, 0);
  const winnerStake = wagers.filter((w) => winners.has(w.id)).reduce((sum, w) => sum + w.stake, 0);
  return wagers.map((w) =>
    winners.has(w.id)
      ? { wagerId: w.id, outcome: 'won', payout: Math.floor((pot * w.stake) / winnerStake) }
      : { wagerId: w.id, outcome: 'lost', payout: 0 },
  );
}
