-- 0004_daily_allowance — let players redeem a daily coin allowance
--
-- Context:
--   Players can run low on coins. Instead of an automatic top-up, we add a
--   self-serve daily allowance: any player may redeem DAILY_ALLOWANCE (1000)
--   coins once per rolling 24h via a Redeem button. We persist only when each
--   player last redeemed; eligibility (now − last >= 24h) is enforced in the app
--   (src/domain/allowance.ts).
--
-- Impact:
--   players: + last_redeemed_at (nullable; null = never redeemed = eligible now).
--   No backfill needed — existing players read as eligible immediately.

alter table players
  add column if not exists last_redeemed_at timestamptz;
