# AGENTS.md

Conventions for AI coding agents working in **Corgi Casinos** — a
family-friendly, fake-money over/under betting game. Read this before changing
code. It was distilled from the [react-template-project](../react-template-project)
baseline and trimmed to what this project actually is: a **pragmatic single
Next.js app** (not the template's full multi-package hexagonal/CQRS monorepo).

Related reading: [README.md](README.md) for setup, [docs/](docs/) for the
inherited reference docs (architecture/design-system/testing still describe the
disciplines, even though we use a lighter structure here).

## Verify

After any non-trivial change, run all four from the repo root:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Turborepo caches, so re-runs are fast. Don't ship until all four pass. The
domain tests run without a database; the build renders the data-backed pages
dynamically, so it doesn't need live Supabase either.

## Shape of the app

Everything lives in `apps/web` (pnpm + Turbo wrap it but there's only one app):

```
src/app/         App Router pages + co-located server actions ('use server')
src/domain/      Pure, framework-free logic (settlement, wager rules, coins) + *.test.ts
src/lib/db/      Supabase repositories — map snake_case rows → camelCase here
src/lib/supabase/ server-only client (service key) + hand-written DB types
src/lib/session.ts the cookie-based "login"
src/components/  design-system primitives (buttons, fields, Alert) + the bet form
supabase/migrations/ SQL schema
```

Keep the layering honest even though it's lightweight:

- **`src/domain` stays pure** — no Next, React, or Supabase imports. Business
  rules and their unit tests live here.
- **Server Actions are the only mutation path.** They validate, call the domain,
  then the repositories, then `revalidatePath(...)`. Client components invoke
  them and branch on a returned `{ error } | { ok }` result (don't `throw` for
  expected failures — the React boundary turns it into an unhandled error).
- **Repositories own the DB shape.** Do the snake_case→camelCase mapping in
  `src/lib/db/*`; pages and components only see the domain types in
  `src/domain/types.ts`.

## Identity & authorization

There is **no real auth**. `currentPlayer()` reads a player id from an httpOnly
cookie. Every Supabase call runs with the **service secret key**, so there is no
RLS backstop — authorization is whatever the action checks. That's acceptable
for a fake-money family toy; don't carry this pattern into anything real. The PIN
is a **public** convenience lock (1–4 digits) shown openly in the UI — it just
confirms the right person tapped in; it is not a secret.

## Bet types & settlement invariants

- **Four event `kind`s** share one settlement engine
  ([src/domain/settlement.ts](apps/web/src/domain/settlement.ts)): `over_under`
  (numeric line), `yes_no`, `multiple_choice` (an `options` list), and `closest`
  (numeric guess; nearest wins, ties split the pot).
- **Two `payout_mode`s:** `fixed` (winner gets `floor(stake × multiplier)`) and
  `pool` (pari-mutuel — winners split the whole pot in proportion to stake).
  `closest` is always `pool`.
- Coins/stakes/payouts are **whole integers**; lines/results/guesses are numeric.
- **Stake is escrowed at bet time** (debited from balance); settlement credits the
  gross payout back. A wager carries either a `pick` (over/under, yes/no, an
  option) **or** a `guess` (closest) — never both.
- **Refund-all:** Over/Under landing exactly on the line, OR any event where
  nobody backed a winning side, refunds every stake (nobody loses coins they
  couldn't win).
- One wager per player per event (DB unique constraint); placing again
  **replaces** the bet — refund the old escrow, then debit the new stake.
- **Change a rule in [settlement.ts](apps/web/src/domain/settlement.ts) /
  [wager-rules.ts](apps/web/src/domain/wager-rules.ts) and update its test** —
  don't reimplement payout math in an action.

## TypeScript

`tsconfig.base.json` enables `strict`, `exactOptionalPropertyTypes`, and
`noUncheckedIndexedAccess`. Consequences you'll hit:

1. Conditional optional props must be **spread, not passed as `undefined`**:
   `<Foo {...(cond ? { prop: value } : {})} />`.
2. `arr[i]` / `record[key]` are possibly `undefined` — narrow before use.
3. The `as never` escape hatch is **lint-banned** (purity ratchet in
   `apps/web/eslint.config.mjs`).

## UI / design tokens

See [docs/design-system.md](docs/design-system.md). The short version we follow:

- **Status surfaces go through `<Alert variant>`**, which uses semantic role
  tokens (error/success/warning/info) that carry both light + dark values — so
  no `dark:` variants. Tokens are defined with `@theme inline` in
  [globals.css](apps/web/src/app/globals.css) (referencing `:root` vars that
  flip under `prefers-color-scheme`).
- **Don't hand-roll button/field class strings.** Import from
  [primary-button.tsx](apps/web/src/components/primary-button.tsx) and
  [field-styles.ts](apps/web/src/components/field-styles.ts).
- **Headings use the type scale** (`text-headline-lg`, `text-title-lg`, …), not raw `text-Nxl`.

## Data / schema changes

- The DB types in [src/lib/supabase/types.ts](apps/web/src/lib/supabase/types.ts)
  are **hand-written to match the migrations**. After a schema change, update
  them (or regenerate with `supabase gen types`) so `typecheck` sees new columns.
- **Never edit an applied migration — add a follow-up.** Start each with a
  comment preamble (Context / Impact), as `0001_init.sql` does.

## Do not commit or push

Never run `git commit` or `git push` on your own initiative. Leave the working
tree dirty after verifying — that's the expected hand-off. Only run git write
commands when the user explicitly asks.

## Common pitfalls

1. **Forgetting `revalidatePath`** after a mutating action — the page shows stale
   data. Every mutation revalidates the affected paths (`/play`, the event page,
   `/scoreboard`).
2. **`throw`ing from a client-invoked action** for an expected failure — return
   `{ error }` instead.
3. **Reading the DB from a Client Component** — `src/lib/supabase/server.ts` holds
   the secret key and must stay server-only. Pass data down as props. (PINs are
   intentionally public, so sending them to the client is fine — but the Supabase
   secret key never leaves the server.)
4. **Impure reads in render** (`Date.now()`, `Math.random()`) — compute at the
   server boundary and pass as a prop.
5. **Shipping without the full verify chain.**
