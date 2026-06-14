# 0001. Hexagonal architecture with CQRS-lite

- **Status:** Accepted
- **Date:** YYYY-MM-DD

## Context

A non-trivial app has domain rules (eligibility, capacity math, state
transitions, authorization) that must be enforced **identically** from several
entry points:

- form validators in the browser
- server-side route handlers (`POST /api/...`)
- background jobs / crons
- direct admin tooling mutations

Embedding those rules in route handlers leads to drift — the same rule
implemented three slightly different ways. We also want the domain to be
testable without standing up a database.

## Decision

Use a **hexagonal (ports-and-adapters) architecture** with three layers plus a
shared types package:

```
@app/domain          ← aggregates, value objects, rules, repository ports, DomainError
@app/application     ← CQRS command/query handlers
@app/infrastructure  ← adapters (e.g. SupabaseWidgetRepository)
apps/web             ← Next.js: HTTP boundary + composition root
```

Dependency direction is **strictly inward** (`apps/web → application → domain ←
infrastructure`). The domain has no idea the framework or database exist. This is
enforced by an ESLint **purity ratchet**, not just convention.

We use a **CQRS-lite** split: write methods (`findById`, `save`) round-trip
through the aggregate; read methods (`search`, `getDetail`) return denormalized
read models shaped for the UI. Both sit on the same repository port — no separate
read store, no event sourcing.

## Consequences

- ✅ Domain rules are unit-testable in milliseconds with no DB.
- ✅ Adding a new persistence backend is mechanical (implement the port).
- ✅ Form validators and command handlers share the same `rules.ts` functions.
- ❌ More indirection for trivial CRUD. Accepted because most routes aren't
  trivial CRUD.
- 🔒 Committed to _not_ importing the framework or DB from `domain`/`application`
  — enforced by the lint purity ratchet (build fails on violation).

## Alternatives considered

- **Plain framework + DB calls in route handlers.** Fastest to start; the
  rule-drift problem above made it a no for a rules-heavy app.
- **Full event-sourcing CQRS** with separate read/write stores. Too much
  ceremony; revisit only if scale demands it.
- **tRPC.** Typed RPC is nice, but route handlers + Zod give ~90% of the benefit
  without the extra client dependency.
