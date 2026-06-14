# Architecture

Hexagonal (ports-and-adapters) layering with a CQRS-lite read/write split. The
decision and its trade-offs are recorded in
[ADR 0001](adr/0001-hexagonal-cqrs.md); this doc is the working reference.

## The layers

```
@app/domain          ← aggregates, value objects, rules, repository PORTS, DomainError
@app/application     ← CQRS command/query handlers (orchestration only)
@app/infrastructure  ← ADAPTERS implementing the ports (DB, email, payments, …)
apps/web             ← Next.js: HTTP boundary + composition root
@app/types           ← shared DTOs / Zod schemas (importable by any layer)
```

Dependency direction is **strictly inward**:

```
apps/web ─────► @app/application ─────► @app/domain ◄───── @app/infrastructure
```

- `domain` imports nothing but `@app/types`. No framework, no DB, no React.
- `application` imports `domain` (+ `types`). No framework, no DB.
- `infrastructure` imports `domain` (to implement its ports). No app code.
- `apps/web` imports everything and **wires the concrete adapters** into the
  handlers — this wiring point is the **composition root**.

This is enforced by lint, not just convention: the `purityRatchet` in
[packages/config/eslint.base.mjs](../packages/config/eslint.base.mjs) bans
outward/framework imports from the inner layers, and the build fails the moment
one reappears.

## Request flow

```
HTTP request
  → apps/web/src/app/api/widgets/route.ts
        validate input with Zod, authenticate the caller
  → @app/application: CreateWidgetHandler.execute(cmd)
        orchestrates: load aggregate(s), call domain method, save
  → @app/domain: Widget.create(...) / widget.rename(...)
        enforces invariants; throws a typed DomainError on violation
  → @app/infrastructure: SupabaseWidgetRepository.save(widget)
        the only layer that knows the persistence library exists
```

The same domain rules are reused by **form validators in the browser** and the
**route handler on the server** — one source of truth, no drift.

## CQRS-lite: read vs. write

A repository port mixes two concerns **on purpose**:

| Method shape                     | Side  | Purpose                                   | Returns                |
| -------------------------------- | ----- | ----------------------------------------- | ---------------------- |
| `findById(id)` / `save(agg)`     | Write | Load → mutate → save the aggregate        | the aggregate          |
| `search(...)` / `getDetail(...)` | Read  | Denormalized projection shaped for the UI | `*Summary` / `*Detail` |

**Don't load an aggregate just to render it.** Aggregates are for state changes;
read models are for queries. There's no separate read store and no event
sourcing — that ceremony isn't worth it until scale demands it.

## Aggregate rules (the domain layer)

1. **No imports from outside the domain** (except `@app/types`).
2. **Aggregates enforce their own invariants.** State changes go through methods
   (`widget.activate()`), never field assignment from outside. Fields are
   `private` with `readonly` getters.
3. **Pure functions in `rules.ts`** for yes/no questions about domain state that
   don't need the aggregate's identity — reusable from validators, handlers, and
   migrations.
4. **Errors are typed** — throw a `DomainError` subclass (see [ADR 0004](adr/0004-typed-domain-errors.md)).
5. **Repository ports live with the aggregate** they read/write. Adapters live in
   `infrastructure`.

### Adding a state-changing operation

1. Add a method on the aggregate; validate preconditions, throw a typed error on
   failure, mutate state, push a domain event onto the aggregate's event buffer.
2. Add a unit test covering the happy path and each guard.
3. Add a command + handler in `application` that does `findById → method → save`.
4. Add a port method only if the operation can't be expressed as "load, mutate,
   save". Most can.

### Domain events & the outbox

Aggregates accumulate domain events via `raise(...)`, but **`raise()` does not
imply delivery** — a handler must drain them after `save()`. Any handler that
persists an event-raising aggregate should dispatch its outbox (e.g. to an
analytics/notification port) immediately after saving. Keep the mapper
fail-quiet so wiring a handler that currently raises nothing captured is a safe
no-op that future-proofs the next event.

## The composition root

The inner layers declare **ports** (interfaces). `apps/web` is the only place
that knows which concrete adapter implements each port — it builds the handlers
per request (or once at module load) and injects the adapters. Keep this wiring
in one file (e.g. `apps/web/src/lib/handlers.ts`) so there's a single place to
see how the app is assembled. Build authorization-sensitive handlers **per
request** so a session-scoped client (and its row-level security) is in play —
see the data-layer notes in [AGENTS.md](../AGENTS.md).

## Why this shape

- ✅ Domain rules are unit-testable in milliseconds with no DB.
- ✅ Swapping a persistence backend is mechanical — implement the port.
- ✅ Validators and handlers share one `rules.ts`.
- ❌ More indirection for trivial CRUD — accepted, because most routes aren't
  trivial CRUD. If yours genuinely are, this layering may be more than you need;
  see the alternatives in [ADR 0001](adr/0001-hexagonal-cqrs.md).
