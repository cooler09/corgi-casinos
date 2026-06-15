-- 0003_house_ledger — introduce "the House" as the universal counterparty
--
-- Context:
--   Until now settlement created and destroyed coins out of thin air: fixed-odds
--   winners were paid stake × multiplier with no funding source, and any event
--   where nobody backed the winning side refunded everyone. We're making the
--   House bankroll the game — it funds every winning payout and collects every
--   losing stake. Per settlement, net House P&L = sum(stakes) − sum(payouts), so
--   total coins across (players + house) stay conserved. The House may run a
--   negative balance (a big fixed-odds win is coins it owes), so there is
--   deliberately NO `balance >= 0` check like players have.
--
-- Impact:
--   Adds a singleton `house` table (one row, enforced by a boolean primary key
--   that can only be `true`). players/events/wagers are unchanged. Settlement
--   behavior changes in the app layer: fixed-mode events with no winning backer
--   now have losers lose (the House keeps their stakes) instead of refunding;
--   pool-mode events with no winner send the whole pot to the House. True pushes
--   (Over/Under landing exactly on the line) still refund everyone.

create table if not exists house (
  id         boolean primary key default true check (id),
  balance    integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into house (id) values (true) on conflict (id) do nothing;
