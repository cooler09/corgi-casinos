# @app/web

The Next.js (App Router) application: pages, the API tier (Route Handlers under
`app/api/*`), and the **composition root** where concrete adapters are wired into
application handlers. This is the only package that imports the framework, the
DB clients, and every other package.

> Agents: read [AGENTS.md](../../AGENTS.md) at the repo root first. The page,
> server-action, and error-handling conventions there are the rules for this app.

## Suggested layout

```
src/
├── app/                         # App Router: routes, layouts, route handlers
│   ├── api/                     # Route Handlers (the HTTP boundary)
│   └── <route>/
│       ├── page.tsx             # thin orchestrator (< ~150 LOC)
│       ├── _components/         # co-located, non-route sub-components
│       └── <feature>-actions.ts # co-located 'use server' actions
├── components/                  # shared UI primitives (Button vocab, Alert, …)
├── lib/
│   ├── handlers.ts              # composition root: build handlers, inject adapters
│   ├── api-helpers.ts           # DomainError → HTTP status mapping (one place)
│   ├── form-data.ts             # field()/bool() helpers for FormData actions
│   └── supabase.ts              # getServerSupabase() (if using Supabase)
├── hooks/
└── test/
```

## Conventions (see AGENTS.md for the full list)

- **Pages are thin orchestrators.** Decompose into `_components/` and co-located
  `*-actions.ts` once a page grows ([ADR 0005](../../docs/adr/0005-page-decomposition.md)).
- **Map snake_case → camelCase at the page boundary.** Components take camelCase.
- **Server components by default.** Lift `'use client'` only when needed. Never
  pass a function prop from a Server Component to a Client Component.
- **Mutating server actions revalidate.** End with `revalidatePath(returnPath)`;
  invalidate tagged caches by tag in the same action.
- **Throw typed `DomainError`s; let `api-helpers.ts` map them.** No ad-hoc status
  codes in route handlers.
- **No `force-dynamic` on public pages** without a documented reason.

## The composition root

`lib/handlers.ts` is where the inner layers' **ports** meet their concrete
**adapters**. Build authorization-sensitive handlers **per request** so a
session-scoped DB client (and its RLS) is in play. This is the seam that lets the
domain stay framework-free.

## Package deps (template)

See [package.json](package.json): core deps (`next`, `react`, `tailwindcss`,
workspace packages) are listed; Optional integrations (Supabase, Stripe, Sentry,
…) are commented — uncomment per [docs/integrations.md](../../docs/integrations.md).
