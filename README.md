# react-template-project

A **reference template** for starting a new web project with an AI assistant.
It mirrors the stack, architecture, documentation discipline, and conventions of
a production codebase ([pickupvb.com](https://pickupvb.com)) — generalized so it
carries no business domain. **Nothing here is meant to run as-is**; it is a
reference you point your AI assistant at when scaffolding a new project.

> **Working on / from this template with an AI assistant?** Start with
> [AGENTS.md](AGENTS.md) for conventions, then [docs/architecture.md](docs/architecture.md)
> for the layering and [docs/integrations.md](docs/integrations.md) to choose
> which third-party services you actually want.

## How to use this template

1. **Rename the placeholders.** The scope `@app` (in package names and imports)
   and the example domain `Widget` are stand-ins — rename them to your project.
2. **Pick your integrations.** Everything in [docs/integrations.md](docs/integrations.md)
   is tiered **Core / Recommended / Optional**. Keep Core, decide on the rest,
   and delete the blocks you don't want from [.env.example](.env.example) and
   `turbo.json`.
3. **Keep the bones.** The monorepo layout, the inward-dependency rule, the typed
   `DomainError` hierarchy, the page-composition conventions, and the verify gate
   are the transferable value — adopt them wholesale.
4. **Grow the docs as you go.** Start ADRs at `0001`, write journal entries per
   change-bundle, and open audit files per topic. The formats are seeded under
   [docs/](docs/).

## Stack

| Layer    | Tech                                                                   |
| -------- | ---------------------------------------------------------------------- |
| Monorepo | pnpm workspaces + Turborepo                                            |
| Frontend | Next.js 16 (App Router) + React 19 + Tailwind v4                       |
| API      | Next.js Route Handlers (`app/api/*`) calling pure CQRS handlers        |
| Domain   | Hand-rolled DDD/CQRS in `packages/{domain,application,infrastructure}` |
| Language | TypeScript (strict + `exactOptionalPropertyTypes`)                     |
| Tooling  | ESLint (flat config) + Prettier + Vitest + Playwright + Husky          |
| Database | _Optional_ — Supabase (Postgres + Realtime) behind a domain port       |
| Auth     | _Optional_ — Supabase Auth (or swap; see ADR 0002)                     |
| Hosting  | Vercel (web + API) + your DB host                                      |
| CI/CD    | GitHub Actions (verify gate) + host auto-deploy on push                |

Full version floors and the "why" behind each choice:
[docs/stack.md](docs/stack.md).

## Architecture

```
.
├── apps/
│   └── web/                       # Next.js – pages + API Route Handlers (app/api/*)
├── packages/
│   ├── domain/                    # Aggregates, value objects, repository ports (pure)
│   ├── application/               # CQRS commands/queries + handlers (pure, no framework)
│   ├── infrastructure/            # Adapters implementing domain ports (DB, email, …)
│   ├── types/                     # Shared DTOs & Zod schemas
│   └── config/                    # ESLint base (purity ratchet) + shared presets
└── docs/                          # Reference docs, ADRs, journal, audits
```

### Hexagonal / DDD flow

```
HTTP request
   → apps/web/src/app/api/widgets/route.ts   (validate w/ Zod, authenticate)
   → @app/application handler                (CreateWidgetHandler.execute(...))
   → @app/domain aggregate                   (Widget.create – enforces invariants)
   → @app/infrastructure repo                (SupabaseWidgetRepository.save)
```

Dependency direction is **strictly inward**: `apps/web → application → domain ←
infrastructure`. The domain has no idea your framework or database exist. Full
write-up in [docs/architecture.md](docs/architecture.md) and
[ADR 0001](docs/adr/0001-hexagonal-cqrs.md).

## Getting started (for a project built from this template)

### Prerequisites

- Node 22+ (`nvm use` — see [.nvmrc](.nvmrc))
- pnpm 9 (`corepack enable`)
- Your chosen Optional integrations' CLIs (e.g. Supabase CLI)

### Install

```bash
pnpm install
cp .env.example .env        # then fill in / delete blocks per integrations.md
```

### Run

```bash
pnpm dev                    # turbo runs the app(s) in parallel
```

### Verify (the gate that must pass before shipping)

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## Scripts (root)

| Script           | What it does                     |
| ---------------- | -------------------------------- |
| `pnpm dev`       | Run all apps in parallel         |
| `pnpm build`     | Build everything                 |
| `pnpm typecheck` | TS typecheck across all packages |
| `pnpm lint`      | Lint all packages                |
| `pnpm test`      | Run tests across all packages    |
| `pnpm format`    | Prettier write across the repo   |

## License

Add your license here. (The reference project ships MIT.)
