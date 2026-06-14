# Tech stack

The stack this template mirrors, with version floors and the reasoning behind
each choice. Treat versions as "this is what was proven together" — bump them
deliberately, not reflexively. Anything marked **Optional** is covered in
[integrations.md](integrations.md) and can be dropped.

## Runtime & package management

| Tool      | Floor   | Why                                                                                        |
| --------- | ------- | ------------------------------------------------------------------------------------------ |
| Node.js   | 22.11.0 | LTS with native `fetch`/`WebSocket`; pinned in [.nvmrc](../.nvmrc).                        |
| pnpm      | 9.x     | Fast, strict, content-addressed; first-class workspace support.                            |
| Turborepo | 2.x     | Task graph + caching across the monorepo. See [ADR 0003](adr/0003-monorepo-pnpm-turbo.md). |

## Language & type safety

| Tool       | Floor | Why                                                                                                                      |
| ---------- | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| TypeScript | 6.x   | `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` on (see [tsconfig.base.json](../tsconfig.base.json)). |
| Zod        | 4.x   | _Recommended._ Runtime validation at the HTTP boundary; one schema reused by form validators and route handlers.         |

The strict flags are the point: they catch a whole class of `undefined`/optional
bugs at compile time. See the TypeScript section of [AGENTS.md](../AGENTS.md).

## Frontend

| Tool         | Floor  | Why                                                                                           |
| ------------ | ------ | --------------------------------------------------------------------------------------------- |
| Next.js      | 16.x   | App Router; Server Components + Route Handlers are the API tier.                              |
| React        | 19.x   | Server Components, `useFormState`/`useTransition`, the React Compiler purity model.           |
| Tailwind CSS | 4.x    | Utility-first styling; tokens defined in `@theme` (see [design-system.md](design-system.md)). |
| Radix UI     | latest | _Recommended._ Headless accessible primitives (dialog, popover, toast, dropdown).             |

## Domain layers (hand-rolled DDD/CQRS)

No framework — just disciplined TypeScript packages with a strict inward
dependency rule. See [architecture.md](architecture.md) and
[ADR 0001](adr/0001-hexagonal-cqrs.md).

- `@app/domain` — aggregates, value objects, repository **ports**, `DomainError`s.
- `@app/application` — CQRS command/query handlers.
- `@app/infrastructure` — adapters implementing the ports.
- `@app/types` — shared DTOs / Zod schemas.

## Testing

| Tool       | Floor | Surface                                                                       |
| ---------- | ----- | ----------------------------------------------------------------------------- |
| Vitest     | 2.x   | Unit (domain + application) and web-unit (mocked framework glue).             |
| Playwright | 1.x   | End-to-end user journeys against a real server. _(Optional but recommended.)_ |

See [testing.md](testing.md) for the surface-selection rules.

## Tooling & quality gates

| Tool                 | Why                                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint (flat config) | Recommended + `typescript-eslint`, plus the onion **purity ratchet** and `as never` ban (see [packages/config/eslint.base.mjs](../packages/config/eslint.base.mjs)). |
| Prettier             | Formatting; `prettier-plugin-tailwindcss` orders classes.                                                                                                            |
| Husky + lint-staged  | Pre-commit format on staged files only.                                                                                                                              |
| GitHub Actions       | The four-gate verify chain on every push/PR (see [.github/workflows/ci.yml](../.github/workflows/ci.yml)).                                                           |

## Hosting (reference deployment)

| Concern   | Choice                                                                 |
| --------- | ---------------------------------------------------------------------- |
| Web + API | Vercel — Route Handlers run on the Node runtime; no separate API host. |
| Database  | _Optional_ — Supabase Cloud (or your Postgres host).                   |
| CI/CD     | GitHub Actions for the gate; host auto-deploys on push to `main`.      |

## Optional integrations

Payments (Stripe), email (Resend), error monitoring (Sentry), product analytics
(PostHog), maps (Leaflet), push (web-push), bot protection (Turnstile) — each is
tiered and independently removable. See [integrations.md](integrations.md).
