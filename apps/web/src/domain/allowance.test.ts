import { describe, expect, it } from 'vitest';

import {
  ALLOWANCE_CAP,
  ALLOWANCE_COOLDOWN_MS,
  allowanceGrant,
  canRedeem,
  DAILY_ALLOWANCE,
} from './allowance';

describe('canRedeem', () => {
  const t0 = Date.parse('2026-06-15T12:00:00Z');
  const lastClaim = new Date(t0).toISOString();

  it('allows a player who has never redeemed', () => {
    expect(canRedeem(null, t0)).toBe(true);
  });

  it('blocks while still inside the 24h cooldown', () => {
    expect(canRedeem(lastClaim, t0 + ALLOWANCE_COOLDOWN_MS - 1)).toBe(false);
  });

  it('allows again exactly when the cooldown elapses', () => {
    expect(canRedeem(lastClaim, t0 + ALLOWANCE_COOLDOWN_MS)).toBe(true);
  });
});

describe('allowanceGrant', () => {
  it('grants the full allowance when well below the cap', () => {
    expect(allowanceGrant(800)).toBe(DAILY_ALLOWANCE);
  });

  it('trims the grant so a redeem stops exactly at the cap', () => {
    expect(allowanceGrant(ALLOWANCE_CAP - 500)).toBe(500);
  });

  it('grants nothing at or above the cap (winnings may exceed it)', () => {
    expect(allowanceGrant(ALLOWANCE_CAP)).toBe(0);
    expect(allowanceGrant(ALLOWANCE_CAP + 1500)).toBe(0);
  });
});
