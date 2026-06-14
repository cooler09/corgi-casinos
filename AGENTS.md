# AGENTS.md

> **This is a reference template.** It was distilled from a production
> codebase ([pickupvb.com](https://pickupvb.com)) and de-branded so a new
> project can inherit the same stack, architecture, and working conventions.
> The placeholder scope `@app` and the placeholder domain `Widget` stand in
> for your real names — rename them. Sections marked **(Optional integration)**
> only apply if you adopt that integration; see
> [docs/integrations.md](docs/integrations.md).

Conventions and gotchas for AI coding agents working in this repo. Read this
before making changes. Related reading:

- [README.md](README.md) — human setup + stack table.
- [docs/README.md](docs/README.md) — map of the whole `docs/` tree.
- [docs/architecture.md](docs/architecture.md) — the hexagonal / DDD / CQRS layering.
- [docs/integrations.md](docs/integrations.md) — every external service, tiered
  Core / Recommended / Optional, with wiring + removal notes.
- [docs/adr/](docs/adr/) — architecture decision records (the "why").
- [docs/audits/](docs/audits/) — point-in-time audits + remediation backlog.
- [docs/journal/](docs/journal/) — dated narrative entries explaining each
  change-bundle.

## Verify

After any non-trivial change, run **all four** from the repo root:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Turborepo caches, so re-runs are fast. Don't ship a change until all four pass.
The build catches issues the editor and a plain typecheck don't (route type
generation, framework config validation); the tests guard domain/application
invariants.

## Repository shape

Monorepo (pnpm + Turbo). Packages depend strictly **inward**:

```
apps/web ──► @app/application ──► @app/domain
            └► @app/infrastructure ┘  (implements domain ports; no deps on app)
            └► @app/types
            └► @app/config         (build-tooling presets)
```

- **`packages/domain`** — aggregates, value objects, repository **ports**, and
  the `DomainError` hierarchy. Pure TypeScript. No framework imports.
- **`packages/application`** — CQRS command/query handlers. Pure. Throws typed
  `DomainError` subclasses.
- **`packages/infrastructure`** — adapters that implement domain ports (e.g. a
  Supabase or Prisma repository).
- **`packages/types`** — shared DTOs / Zod schemas usable by any layer.
- **`apps/web`** — Next.js App Router. The **composition root** (where concrete
  adapters are wired into handlers) lives in the app, not the inner layers.

Never have `domain` or `application` import from `apps/web`, Next.js, or your
persistence library. They must stay framework-free. This is enforced by lint
(see `purityRatchet` in [packages/config/eslint.base.mjs](packages/config/eslint.base.mjs))
— not just by convention.

## TypeScript

[tsconfig.base.json](tsconfig.base.json) enables `strict`,
`exactOptionalPropertyTypes`, and `noUncheckedIndexedAccess`. Three consequences
agents hit constantly:

1. **Conditional optional props must be spread, not passed as `undefined`:**

   ```tsx
   // ❌ Type error under exactOptionalPropertyTypes
   <Foo prop={cond ? value : undefined} />

   // ✅ Correct
   <Foo {...(cond ? { prop: value } : {})} />
   ```

2. **Don't fabricate optional fields with `undefined`** when constructing
   domain values — omit the key.

3. **`noUncheckedIndexedAccess`** makes `arr[i]` and `record[key]` possibly
   `undefined`. Narrow before use; don't reach for `!` reflexively.

If you enable Next.js `typedRoutes`, string hrefs to dynamic routes need
template literals matching the route pattern (e.g. `` `/widgets/${id}` ``, not
`'/widgets/' + id`).

## Domain errors

Define a typed `DomainError` hierarchy in the domain layer (see
[ADR 0004](docs/adr/0004-typed-domain-errors.md)).
**Always throw a typed subclass; never throw `Error('NOT_FOUND')`-style strings.**

| Class                                | Code                  | When                                              |
| ------------------------------------ | --------------------- | ------------------------------------------------- |
| `NotFoundError(resource, id?, msg?)` | `NOT_FOUND`           | Missing aggregate / row                           |
| `ConflictError`                      | `CONFLICT`            | Duplicate / already-in-state                      |
| `ValidationError`                    | `VALIDATION`          | Bad input that wasn't caught at the boundary      |
| `UnauthorizedError`                  | `UNAUTHORIZED`        | Caller lacks permission / not signed in           |
| `InvariantViolation`                 | `INVARIANT_VIOLATION` | Generic state-machine guard (publish/cancel/etc.) |

Server actions and route handlers consume them with `instanceof`. Centralize
the HTTP mapping in one helper (e.g. `apps/web/src/lib/api-helpers.ts`) that
maps each `DomainError` subclass to a status code (404/401/400/409/422) and a
`{ error: code, message, details }` body. **Don't add ad-hoc status mapping in
route handlers** — throw the typed error and let the helper map it.

## Page composition conventions

Routes under `apps/web/src/app/`. Pages should be thin orchestrators (target
< ~200 LOC, ideally < 150). When a page grows past that (see
[ADR 0005](docs/adr/0005-page-decomposition.md)):

- **Co-locate sub-components under `_components/`.** The underscore prefix
  prevents Next.js from treating them as routes.
- **Co-locate server actions next to (not inside) the page.** Files like
  `members-actions.ts`. Mark with `'use server'` at the top of the file, not
  per-function.
- **Map snake_case DB rows → camelCase props at the page boundary.** Components
  take camelCase props; the page does the explicit mapping. Don't push DB shape
  into reusable components.
- **Extract pure helpers into the file of their primary consumer.** Don't create
  shared util files for one-time use.
- **Lift `'use client'` only when needed.** Server components by default. A
  client component that pulls in a server action just imports it — Next handles
  the boundary.

### Server action FormData wrappers

Plain HTML `<form action={...}>` submissions deliver `FormData`. Wrap typed
actions with thin adapters bound at the call site, and read fields through a
shared `form-data.ts` helper set (`field()`, `fieldOrNull()`, `bool()`) rather
than raw `formData.get(...)` — the helper smooths over framework quirks (e.g.
`useFormState` slot prefixes) so the same action works whether wired with
`useFormState`, `.bind()`, or a plain `<form action={fn}>`. Always pass a
`returnPath` so the action can `revalidatePath()` the right URL.

### Server-action error handling

Two patterns coexist intentionally — pick by call site:

- **Plain `<form action={...}>` (no client state)** → use **flash-param
  redirects**. The action `redirect(\`${returnPath}?status=error\`)`on failure
and the page reads the param to render an alert. Catch typed`DomainError`
  subclasses and map them to specific reason codes; rethrow anything unknown.
- **Client-component-invoked actions** (called from `'use client'` with
  `useTransition` / optimistic UI / `useFormState`) → return a typed
  `Result<T, DomainErrorCode>` so the client can branch without parsing redirect
  URLs. Don't `throw` — the React boundary turns it into an unhandled error.

## UI primitives & design tokens

See [docs/design-system.md](docs/design-system.md) for the full system. The
short version:

- For client widgets where accessibility + behavior are the hard part (focus
  management, `aria-live`, focus trap, controlled-vs-uncontrolled state), reach
  for **headless primitives** (e.g. `@radix-ui/react-*`) instead of hand-rolling.
  Style them with your design tokens.
- **Don't hand-roll class strings for buttons/fields.** Centralize a CTA
  vocabulary (`primaryButtonClass`, `secondaryButtonClass`, …) and a field
  vocabulary (`fieldInputClass`, `fieldLabelClass`, …), and enforce them with a
  `no-restricted-syntax` lint ratchet so drift can't re-accumulate.
- **Status surfaces (alert/toast/banner/pill) use semantic role tokens**
  (error/warning/success/info) that carry both light + dark values — so the
  surface needs **no `dark:` variant**. Route new status surfaces through your
  `<Alert>` / toast components rather than re-rolling palette classes.

## Data layer **(Optional integration — Supabase / your DB)**

The persistence library is an **adapter behind a domain port** — the domain and
application layers never import it. The reference stack uses Supabase; the
patterns below are the ones worth keeping whatever you choose. See
[packages/infrastructure/README.md](packages/infrastructure/README.md).

- **Use a session-scoped client for user reads/writes** so row-level security
  (or your equivalent authorization) applies.
- **Reserve the admin / service-role client** for session-less contexts (webhook
  handlers, crons) and operations already authorized in the application layer.
  **Never enforce authorization on the admin client** — if a write delegates its
  "may this user do this?" check to a DB policy, that policy never fires on the
  admin client and the write is unprotected. When chasing an authz-bypass, audit
  the repository **adapters**, not just page/action code — an adapter that lazily
  builds its own admin client hides the gap behind the port.
- **Regenerate DB types after a schema change** and commit them so `typecheck`
  sees new columns.

### Migrations **(Optional integration)**

Every migration starts with a SQL-comment **preamble**: a one-line title, a
**Context** block (why this change, what it builds on, non-obvious constraints),
and an **Impact** block (what changes for callers — new/dropped columns, RPC
signature changes, backfill behavior). **Never edit an applied migration — add a
follow-up.** If your CI/CD applies migrations on deploy, don't run production
migrations by hand. When agents can't run the DB locally, hand-edit the
generated types to match the migration and note that they'll be regenerated
against the real schema post-deploy.

## Testing

Match new tests to the layer that owns the logic. See [docs/testing.md](docs/testing.md).

| Surface        | Runner     | What belongs here                                                                              |
| -------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| **Unit**       | Vitest     | Pure business rules, aggregate invariants, handler edge cases, typed-error paths.              |
| **Unit (web)** | Vitest     | Framework-glue you can isolate by mocking (`vi.mock(...)`). Form-data helpers, money, consent. |
| **End-to-end** | Playwright | Cross-cutting user journeys against a real server + DB.                                        |

**Always add or update a test when** you fix a production-reachable bug (the
test should fail before the fix, pass after — that encodes _why_ the change was
made), add a domain rule, or add an application handler (cover the happy path +
each typed-error branch). **Skip** the test for pure type tweaks, doc/comment
edits, or behavior already exhaustively constrained by the type system.

- **Mock at module boundaries, not call sites.**
- **Don't test framework internals** (don't assert `revalidatePath` was called)
  — assert the action throws the right `DomainError` or redirects to the expected
  flash-param URL.
- **Playwright is for "did the user get what they wanted," not "did the handler
  return the right shape"** — write that as a Vitest case; it runs 100× faster.

## Audits

If asked for an "audit" — full repo or scoped to a topic — follow
[docs/audits/README.md](docs/audits/README.md):

- **Check existing audit files first.** Open findings are the starting backlog.
- **Grade every finding P1 / P2 / P3** using the rubric in the audits README.
- **Each finding needs a file link** and a **concrete recommended fix**, written
  into the appropriate audit file (not dumped into chat). Add a dated status
  block at the top and a remediation-log entry when fixes land; update the index
  table with a short status.
- An ad-hoc chat-only summary is fine for a quick scan — but **call that out
  explicitly** ("quick scan, not a full audit").

## Journal

Audits record **what** is broken; the journal records **why** a change was made.
After shipping a non-trivial bundle, write a dated entry under
[docs/journal/](docs/journal/) — see its README for the format (trigger,
decisions, rejected alternatives, patterns surfaced, follow-ups). Promote durable
patterns into the "Common pitfalls" section below.

## Do not commit or push

**Never run `git commit` or `git push` on the agent's own initiative.** Leave the
working tree dirty after verification — that's the expected hand-off state. Only
run git write commands when the user explicitly asks.

## Common pitfalls (framework-level — keep these in mind)

These are recurring regressions worth a reference fix in your tree. They're
framework/architecture-level, so they transfer to any project on this stack.

1. **Forgetting to revalidate after a server action mutates data.** Every
   mutating action must end with `revalidatePath(returnPath)` (pass `returnPath`
   from the page). If the page reads from a tagged cache, also invalidate by tag
   in the same action — `revalidatePath` only busts the page render cache, not
   tagged cache entries. **Don't hand-write tag strings** — import a builder
   (`entityCacheTag(id)`) so the cache site and every eviction site share one
   contract. **Exception:** when an action redirects to an external checkout and
   revalidation is webhook-driven, leave a one-line comment explaining the
   deferral instead of a stale `revalidatePath` before the redirect.

2. **`throw new Error(...)` for a domain failure.** Bare `Error`s bypass the
   typed-error HTTP mapping and surface as generic 500s. Throw a `DomainError`
   subclass (table above): `UnauthorizedError` for permission/not-signed-in,
   `InvariantViolation` for server misconfiguration (missing env var, third-party
   returned an unusable response), `ConflictError`/`ValidationError`/`NotFoundError`
   for the obvious cases.

3. **`force-dynamic` on public pages.** `export const dynamic = 'force-dynamic'`
   disables CDN caching for every visitor. Only use it when the page genuinely
   can't be cached (depends on `cookies()`). Public marketing/landing/pricing
   pages must not opt out without a documented reason — prefer
   `export const revalidate = N` + `revalidatePath()` from mutating actions.

4. **Impure reads in render bodies.** Don't call `Date.now()`, `Math.random()`,
   or `new Date()` inside a component render — the React Compiler treats render
   as pure, so this breaks memoization and trips lint. Compute the value at the
   page boundary (server) and pass it as a prop, or move it into an effect /
   event handler.

5. **Passing a function (callback / render-prop) from a Server Component to a
   Client Component.** RSC can't serialize a function across the boundary; it
   throws `Functions cannot be passed directly to Client Components` at
   **runtime** — invisible to typecheck/lint/build, surfacing only in a real
   render / e2e. Any `'use client'` primitive that takes a function prop forces
   **every caller to also be a client component.**

6. **Adding a string error code in the application layer.** Define a typed
   `DomainError` subclass instead.

7. **Hand-rolling class strings.** Use the shared CTA + field vocabularies; the
   lint ratchet rejects raw `bg-primary hover:…` button strings and local
   `const inputClass = '…'`.

8. **Unbounded list views.** Any list that can grow (per user / over time) must
   be paginated with a shared `<Pagination>` component — slice the display set,
   but compute totals/counts over the **full** array.

9. **Shipping a "fix" without the full verify chain.** `pnpm typecheck && lint &&
test && build`. The build and tests catch what the editor doesn't.

10. **Refactoring beyond what was asked.** Match the surrounding style; don't drop
    in unrelated improvements.

> **Domain-specific invariants live in your ADRs and domain layer.** The original
> codebase carried many business-rule pitfalls (payout routing, multi-division
> registration, privacy-view reads, storage orphan-sweeps). Those are _yours_ to
> document as you build them — add them here as you discover the patterns that
> keep tripping, exactly as the reference project did.
