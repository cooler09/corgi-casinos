import { describe, expect, it } from 'vitest';

import { validateWager } from './wager-rules';

const openEvent = { status: 'open' as const };
const richPlayer = { balance: 500 };

describe('validateWager', () => {
  it('accepts a valid bet within balance', () => {
    expect(validateWager({ event: openEvent, player: richPlayer, stake: 100 })).toBeNull();
  });

  it('rejects betting on a settled event', () => {
    expect(
      validateWager({ event: { status: 'settled' }, player: richPlayer, stake: 100 }),
    ).toBe('EVENT_NOT_OPEN');
  });

  it('rejects a non-positive or fractional stake', () => {
    expect(validateWager({ event: openEvent, player: richPlayer, stake: 0 })).toBe('INVALID_STAKE');
    expect(validateWager({ event: openEvent, player: richPlayer, stake: 2.5 })).toBe(
      'INVALID_STAKE',
    );
  });

  it('rejects a stake larger than the balance', () => {
    expect(validateWager({ event: openEvent, player: { balance: 50 }, stake: 100 })).toBe(
      'INSUFFICIENT_BALANCE',
    );
  });

  it('only charges the difference when replacing an existing bet', () => {
    // Player has 50 left and 100 already escrowed; raising to 120 needs +20 ≤ 50.
    expect(
      validateWager({ event: openEvent, player: { balance: 50 }, stake: 120, existingStake: 100 }),
    ).toBeNull();
    // Raising to 200 needs +100 > 50 → rejected.
    expect(
      validateWager({ event: openEvent, player: { balance: 50 }, stake: 200, existingStake: 100 }),
    ).toBe('INSUFFICIENT_BALANCE');
  });
});
