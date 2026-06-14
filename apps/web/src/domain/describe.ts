import type { BettingEvent } from './types';

/** Short label for how an event pays out. */
export function payoutLabel(event: Pick<BettingEvent, 'payoutMode' | 'payoutMultiplier'>): string {
  return event.payoutMode === 'pool' ? 'shared pot' : `${event.payoutMultiplier}× payout`;
}

/** One-line description of the bet's shape (no payout info). */
export function summarizeBet(event: BettingEvent): string {
  switch (event.kind) {
    case 'over_under':
      return `Over / Under ${event.line} ${event.unit}`;
    case 'yes_no':
      return 'Yes or No';
    case 'multiple_choice':
      return `Pick one: ${(event.options ?? []).join(', ')}`;
    case 'closest':
      return `Closest guess (${event.unit})`;
  }
}
