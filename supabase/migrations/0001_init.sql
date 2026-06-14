-- 0001_init — Corgi Casinos core schema (players, events, wagers)
--
-- Context:
--   First migration. Corgi Casinos is a fake-money, family over/under betting
--   game. There is no real authentication: a "player" is just a family-roster
--   row, optionally guarded by a 4-digit PIN. The app talks to this database
--   server-side with the service (secret) key, so Row Level Security is NOT the
--   authorization backbone here — keep that in mind if this ever grows up.
--
-- Impact:
--   Creates three tables. `players` start with 1000 coins. A `wager` escrows its
--   stake at bet time (the stake is debited from the player's balance when the
--   bet is placed); settlement credits the payout back. One wager per player per
--   event (unique constraint). Coins/stakes/payouts are whole integers; lines
--   and results are numeric so half-point lines (e.g. 2.5) are possible.

create extension if not exists "pgcrypto";

-- Family roster. `pin` is a convenience lock, not security (stored as given).
create table if not exists players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  emoji      text not null default '🐶',
  pin        text,
  balance    integer not null default 1000 check (balance >= 0),
  created_at timestamptz not null default now()
);

-- An over/under proposition. Anyone logged in can post one and later settle it.
create table if not exists events (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  unit              text not null default 'points',
  line              numeric not null,
  payout_multiplier numeric not null default 2.0 check (payout_multiplier > 1),
  status            text not null default 'open' check (status in ('open', 'settled')),
  result            numeric,
  created_by        uuid not null references players (id) on delete restrict,
  settled_by        uuid references players (id) on delete set null,
  created_at        timestamptz not null default now(),
  settled_at        timestamptz
);

-- A player's OVER/UNDER bet on an event. Stake is escrowed at insert time.
create table if not exists wagers (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events (id) on delete cascade,
  player_id  uuid not null references players (id) on delete cascade,
  direction  text not null check (direction in ('over', 'under')),
  stake      integer not null check (stake > 0),
  outcome    text check (outcome in ('won', 'lost', 'push')),
  payout     integer,
  created_at timestamptz not null default now(),
  unique (event_id, player_id)
);

create index if not exists wagers_event_id_idx on wagers (event_id);
create index if not exists wagers_player_id_idx on wagers (player_id);
create index if not exists events_status_idx on events (status);
