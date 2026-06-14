-- 0002_bet_types — generalize events/wagers to support more bet types
--
-- Context:
--   v1 only had Over/Under on a numeric line with fixed-odds payouts. This adds
--   three more kinds (Yes/No, Multiple-choice, Closest-guess) plus a pari-mutuel
--   ("pool") payout mode, all sharing one settlement engine. Existing rows become
--   kind = 'over_under', payout_mode = 'fixed' and keep working unchanged.
--
-- Impact:
--   events: + kind, + payout_mode, + options (multiple_choice), + result_text
--           (yes_no / multiple_choice result); `line` is now NULLable (only
--           Over/Under uses it).
--   wagers: the old `direction` ('over'/'under') is generalized to `pick` (any
--           categorical choice: over/under/yes/no/an option), and a numeric
--           `guess` is added for Closest. `direction` is dropped after backfill.

alter table events
  add column if not exists kind text not null default 'over_under'
    check (kind in ('over_under', 'yes_no', 'multiple_choice', 'closest')),
  add column if not exists payout_mode text not null default 'fixed'
    check (payout_mode in ('fixed', 'pool')),
  add column if not exists options text[],
  add column if not exists result_text text;

alter table events alter column line drop not null;

alter table wagers add column if not exists pick text;
alter table wagers add column if not exists guess numeric;

update wagers set pick = direction where pick is null;

alter table wagers drop column if exists direction;
