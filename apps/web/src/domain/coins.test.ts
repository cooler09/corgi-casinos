import { describe, expect, it } from 'vitest';

import { formatCoins, parseCoins, parseMultiplier, parseNumeric } from './coins';

describe('formatCoins', () => {
  it('groups thousands', () => {
    expect(formatCoins(1234567)).toBe('1,234,567');
  });
});

describe('parseCoins', () => {
  it('accepts positive integers (with commas)', () => {
    expect(parseCoins('1,000')).toBe(1000);
  });
  it('rejects zero, negatives, decimals, and junk', () => {
    expect(parseCoins('0')).toBeNull();
    expect(parseCoins('-5')).toBeNull();
    expect(parseCoins('2.5')).toBeNull();
    expect(parseCoins('abc')).toBeNull();
  });
});

describe('parseNumeric', () => {
  it('accepts decimals and zero', () => {
    expect(parseNumeric('2.5')).toBe(2.5);
    expect(parseNumeric('0')).toBe(0);
  });
  it('rejects empty and non-numeric', () => {
    expect(parseNumeric('')).toBeNull();
    expect(parseNumeric('over')).toBeNull();
  });
});

describe('parseMultiplier', () => {
  it('requires a value greater than 1', () => {
    expect(parseMultiplier('2')).toBe(2);
    expect(parseMultiplier('1')).toBeNull();
    expect(parseMultiplier('0.5')).toBeNull();
  });
});
