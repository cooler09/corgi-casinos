/** Format a coin amount for display, e.g. 1234 → "1,234". */
export function formatCoins(amount: number): string {
  return Math.trunc(amount).toLocaleString('en-US');
}

/** Parse a user-entered coin amount. Returns null unless a positive integer. */
export function parseCoins(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, '');
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number.parseInt(trimmed, 10);
  return n > 0 ? n : null;
}

/** Parse a numeric line or result (decimals like 2.5 allowed). null if invalid. */
export function parseNumeric(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/** Parse a payout multiplier (must be > 1). null if invalid. */
export function parseMultiplier(raw: string): number | null {
  const n = parseNumeric(raw);
  return n !== null && n > 1 ? n : null;
}
