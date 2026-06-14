import { describe, expect, it } from 'vitest';

import { settle } from './settlement';
import type { BettingEvent, Wager } from './types';

type TestEvent = Pick<
  BettingEvent,
  'kind' | 'payoutMode' | 'line' | 'payoutMultiplier' | 'result' | 'resultText'
>;
type TestWager = Pick<Wager, 'id' | 'pick' | 'guess' | 'stake'>;

function evt(over: Partial<TestEvent>): TestEvent {
  return {
    kind: 'over_under',
    payoutMode: 'fixed',
    line: null,
    payoutMultiplier: 2,
    result: null,
    resultText: null,
    ...over,
  };
}

function w(id: string, fields: Partial<TestWager>): TestWager {
  return { id, pick: null, guess: null, stake: 100, ...fields };
}

const payout = (rows: ReturnType<typeof settle>, id: string) => rows.find((r) => r.wagerId === id);

describe('over/under (fixed odds)', () => {
  const event = evt({ kind: 'over_under', line: 2.5, result: 3, payoutMultiplier: 2 });
  const wagers = [
    w('over', { pick: 'over', stake: 100 }),
    w('under', { pick: 'under', stake: 50 }),
  ];

  it('pays the winning side and zeroes the loser', () => {
    const rows = settle(event, wagers);
    expect(payout(rows, 'over')).toEqual({ wagerId: 'over', outcome: 'won', payout: 200 });
    expect(payout(rows, 'under')).toEqual({ wagerId: 'under', outcome: 'lost', payout: 0 });
  });

  it('applies the multiplier and floors fractional coins', () => {
    const rows = settle(evt({ kind: 'over_under', line: 2.5, result: 3, payoutMultiplier: 1.5 }), [
      w('a', { pick: 'over', stake: 75 }),
    ]);
    expect(payout(rows, 'a')?.payout).toBe(112); // floor(75 * 1.5)
  });

  it('refunds everyone when the result lands exactly on the line', () => {
    const rows = settle(evt({ kind: 'over_under', line: 3, result: 3 }), wagers);
    expect(rows.every((r) => r.outcome === 'push')).toBe(true);
    expect(payout(rows, 'over')?.payout).toBe(100);
  });
});

describe('pool (pari-mutuel) payouts', () => {
  it('splits the whole pot among winners in proportion to stake', () => {
    const event = evt({ kind: 'over_under', payoutMode: 'pool', line: 2.5, result: 3 });
    const rows = settle(event, [
      w('a', { pick: 'over', stake: 100 }),
      w('b', { pick: 'over', stake: 100 }),
      w('c', { pick: 'under', stake: 200 }),
    ]);
    // pot = 400, winner stake = 200 → each over staker gets 400 * 100/200 = 200.
    expect(payout(rows, 'a')).toEqual({ wagerId: 'a', outcome: 'won', payout: 200 });
    expect(payout(rows, 'b')?.payout).toBe(200);
    expect(payout(rows, 'c')).toEqual({ wagerId: 'c', outcome: 'lost', payout: 0 });
  });
});

describe('yes/no', () => {
  it('settles against the chosen side', () => {
    const event = evt({ kind: 'yes_no', resultText: 'yes', payoutMultiplier: 2 });
    const rows = settle(event, [w('y', { pick: 'yes' }), w('n', { pick: 'no' })]);
    expect(payout(rows, 'y')?.outcome).toBe('won');
    expect(payout(rows, 'n')?.outcome).toBe('lost');
  });
});

describe('multiple choice', () => {
  it('only the winning option wins (pool split)', () => {
    const event = evt({ kind: 'multiple_choice', payoutMode: 'pool', resultText: 'Mom' });
    const rows = settle(event, [
      w('a', { pick: 'Mom', stake: 100 }),
      w('b', { pick: 'Dad', stake: 100 }),
      w('c', { pick: 'Leo', stake: 100 }),
    ]);
    expect(payout(rows, 'a')).toEqual({ wagerId: 'a', outcome: 'won', payout: 300 });
    expect(payout(rows, 'b')?.outcome).toBe('lost');
  });
});

describe('closest guess (pool)', () => {
  it('the nearest guess takes the pot', () => {
    const event = evt({ kind: 'closest', payoutMode: 'pool', result: 10 });
    const rows = settle(event, [
      w('a', { guess: 8, stake: 50 }),
      w('b', { guess: 12, stake: 50 }),
      w('c', { guess: 9, stake: 50 }),
    ]);
    expect(payout(rows, 'c')).toEqual({ wagerId: 'c', outcome: 'won', payout: 150 });
    expect(payout(rows, 'a')?.outcome).toBe('lost');
  });

  it('ties share the pot', () => {
    const event = evt({ kind: 'closest', payoutMode: 'pool', result: 10 });
    const rows = settle(event, [
      w('a', { guess: 8, stake: 50 }),
      w('b', { guess: 12, stake: 50 }),
      w('c', { guess: 100, stake: 50 }),
    ]);
    // a and b both 2 away → tie; pot 150, winner stake 100 → each gets 75.
    expect(payout(rows, 'a')?.payout).toBe(75);
    expect(payout(rows, 'b')?.payout).toBe(75);
    expect(payout(rows, 'c')?.outcome).toBe('lost');
  });
});

describe('no possible winner', () => {
  it('refunds everyone if nobody picked the winning side', () => {
    const event = evt({ kind: 'over_under', line: 2.5, result: 3 });
    const rows = settle(event, [w('a', { pick: 'under', stake: 100 })]);
    expect(payout(rows, 'a')).toEqual({ wagerId: 'a', outcome: 'push', payout: 100 });
  });
});
