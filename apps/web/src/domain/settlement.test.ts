import { describe, expect, it } from 'vitest';

import { settle, winningDirection } from './settlement';

const wagers = [
  { id: 'over-bet', direction: 'over' as const, stake: 100 },
  { id: 'under-bet', direction: 'under' as const, stake: 50 },
];

describe('winningDirection', () => {
  it('over wins when result is above the line', () => {
    expect(winningDirection(2.5, 3)).toBe('over');
  });
  it('under wins when result is below the line', () => {
    expect(winningDirection(2.5, 2)).toBe('under');
  });
  it('exact line is a push (no winner)', () => {
    expect(winningDirection(3, 3)).toBeNull();
  });
});

describe('settle', () => {
  it('pays the winning side and zeroes the loser (even money 2.0x)', () => {
    const result = settle(2.5, 3, 2.0, wagers);
    expect(result).toEqual([
      { wagerId: 'over-bet', outcome: 'won', payout: 200 },
      { wagerId: 'under-bet', outcome: 'lost', payout: 0 },
    ]);
  });

  it('applies the payout multiplier and floors fractional coins', () => {
    const result = settle(2.5, 3, 1.5, [{ id: 'w', direction: 'over', stake: 75 }]);
    // 75 * 1.5 = 112.5 → floor → 112
    expect(result[0]).toEqual({ wagerId: 'w', outcome: 'won', payout: 112 });
  });

  it('refunds every stake on a push (result exactly on the line)', () => {
    const result = settle(3, 3, 2.0, wagers);
    expect(result).toEqual([
      { wagerId: 'over-bet', outcome: 'push', payout: 100 },
      { wagerId: 'under-bet', outcome: 'push', payout: 50 },
    ]);
  });
});
