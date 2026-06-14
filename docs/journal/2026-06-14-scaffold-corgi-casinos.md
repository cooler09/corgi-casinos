# 2026-06-14 — Scaffold Corgi Casinos

## Trigger

Green-field ask: stand up a new project, `corgi-casinos`, from the
`react-template-project` baseline — a family-friendly, fake-money over/under
betting game that persists results and tracks info per family member, with a
lightweight "login" instead of real auth.

## Decisions

Four product/architecture calls were confirmed with the user up front:

- **Storage: Supabase Postgres, used as a plain database** (service secret key,
  no Supabase Auth, no RLS). Schema in `supabase/migrations/0001_init.sql`
  (players / events / wagers).
- **Login: family roster + optional 4-digit PIN**, persisted in an httpOnly
  cookie (`src/lib/session.ts`). Explicitly not security.
- **Architecture: pragmatic single Next.js app.** Kept the template's stack,
  strict TS, Tailwind tokens, verify gate, and server-action conventions — but
  dropped the multi-package hexagonal/CQRS ceremony. The `packages/*` stubs were
  deleted, the `@app` scope became `@corgi`, and a lightweight pure `src/domain`
  replaced the separate domain/application/infrastructure packages.
- **Betting loop: anyone logged in can post an event and settle it.**

Money model: everyone starts with 1,000 coins; **stake is escrowed at bet time**
and settlement credits `floor(stake × payout_multiplier)` to winners, refunds
pushes (result exactly on the line), keeps losers' stakes. A per-event
`payout_multiplier` (default 2.0 = even money) honors the "odds" part of the ask
without a full odds engine. Pure rules + tests live in `src/domain/`.

## Rejected alternatives

- **SQLite / localStorage** for storage — rejected once "track per user" across a
  family implied a shared backend reachable from multiple devices; localStorage
  is per-browser and SQLite doesn't persist on serverless hosts.
- **Full template hexagonal/CQRS monorepo** — overkill for a small family toy;
  the user chose the pragmatic single app.
- **Supabase Auth + RLS** — the template's default, but the user wanted no real
  auth, so Supabase is just the database and authorization is app-level only.
- **Pari-mutuel pool payouts** — fun but confusing for kids; went with simple
  escrow + multiplier even-money math.

## Patterns surfaced

- `react/no-unescaped-entities` (via `eslint-config-next`) rejects raw
  apostrophes in JSX text — wrote them as `&apos;`.
- Tailwind v4 `@theme inline` does **not** emit `--color-*` custom properties, so
  raw CSS (e.g. `body`) must reference the underlying `:root` vars (`--surface`),
  not `--color-surface`.
- The template ships **docs + config only** (no app source), and its
  `apps/web/package.json` referenced `workspace:*` packages that have no
  `package.json` — those deps and the `@app/config` eslint import had to be
  pruned/inlined for `pnpm install` to resolve.

## Follow-ups

- No automated end-to-end test yet (would need a seeded Supabase). Domain logic
  is unit-tested; the betting/settlement journey is verified manually.
- Balance mutations are read-modify-write (`adjustBalance`); fine for a family's
  concurrency, but a Postgres function / atomic update would be sturdier if usage
  grows.
- Optional: a roster seed script and a settled-event "history" view.
