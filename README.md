# 🐶 Corgi Casinos

A **fake-money over/under betting game for family and friends**. Post an event
with a line (e.g. _"Total goals tonight: 2.5"_), let everyone bet **OVER** or
**UNDER**, then settle it with the real result — the app pays out fake coins to
the winners and keeps a scoreboard. No real money, no real gambling, just
family-and-friends fun.

Built from the [react-template-project](../react-template-project) baseline (its
stack, strict-TypeScript discipline, Tailwind design tokens, and verify gate) as
a **pragmatic single Next.js app**.

## How it works

- **Logging in** is intentionally lightweight — there is **no real
  authentication**. You pick your name from the roster; a member can optionally
  set a short PIN (1–4 digits) that stays private. It's a soft "it's you" gate,
  not real security — so the app tells you **not to reuse a real PIN**. The choice
  is stored in an httpOnly cookie.
- **Anyone logged in** can post an event, place a bet, and settle an event.
- **Bet types:** Over/Under on a line, Yes/No props, Multiple-choice (pick the
  winner), and Closest-guess. Payouts are either **fixed odds** (`stake ×
multiplier`) or a **shared pot** (pari-mutuel split among the winners);
  Closest-guess is always a shared pot.
- **Coins:** everyone starts with **1,000 🪙**. A stake is escrowed when you bet;
  settling pays the winners, refunds pushes (and any bet nobody could win), and
  keeps losers' stakes.

## Stack

| Layer    | Tech                                                              |
| -------- | ----------------------------------------------------------------- |
| Frontend | Next.js 16 (App Router) + React 19 + Tailwind v4                  |
| Logic    | Server Actions + a small pure domain layer (`src/domain`)         |
| Data     | Supabase Postgres used as a **plain database** (no Supabase Auth) |
| Language | TypeScript (strict + `exactOptionalPropertyTypes`)                |
| Tooling  | pnpm + Turborepo + ESLint + Prettier + Vitest + Husky             |

## Project layout

```
apps/web/
├── src/app/                 # App Router pages + co-located server actions
│   ├── page.tsx             # login (pick a player / add a member)
│   ├── play/                # open bets + your bankroll
│   ├── events/new/          # post a bet (any of the 4 kinds)
│   ├── events/[id]/         # event detail: bet + settle
│   ├── scoreboard/          # leaderboard
│   ├── roster/              # manage family members + PINs
│   └── actions.ts           # auth + roster server actions
├── src/domain/              # pure logic: settlement, wager rules, coins (+ tests)
├── src/lib/db/              # Supabase repositories (row → camelCase mapping)
├── src/lib/supabase/        # server-only client + DB types
├── src/lib/session.ts       # the cookie-based "login"
└── src/components/          # design-system primitives + bet form
supabase/migrations/         # schema (run this in your Supabase project)
```

## Getting started

### Prerequisites

- Node 22+ (`nvm use` — see [.nvmrc](.nvmrc))
- pnpm 9 (`corepack enable`)
- A free [Supabase](https://supabase.com) project

### 1. Install

```bash
pnpm install
```

### 2. Configure Supabase

Create a project, then from **Project Settings → API** copy the values into
`apps/web/.env`:

```bash
cp .env.example apps/web/.env
# SUPABASE_URL=https://<your-project>.supabase.co
# SUPABASE_SECRET_KEY=sb_secret_...
```

### 3. Create the schema

Run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in
the Supabase **SQL Editor** (or `supabase db push` if you use the CLI).

### 4. Run

```bash
pnpm dev          # http://localhost:3000
```

Open the app, add a couple of family members on the login screen, and start
betting.

## Verify (the gate before shipping)

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

The domain unit tests (settlement / wager rules / coins) run without a database;
the build doesn't need live Supabase because the data-backed pages render
dynamically.

## Notes

- **The PIN is a convenience lock, not security.** Don't put anything sensitive
  in here — it's a fake-money family toy.
- If you change the schema, update both
  [`supabase/migrations`](supabase/migrations/) and the hand-written DB types in
  [`apps/web/src/lib/supabase/types.ts`](apps/web/src/lib/supabase/types.ts) (or
  regenerate them with `supabase gen types`).
