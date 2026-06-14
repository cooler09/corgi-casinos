# 0004. Typed `DomainError` hierarchy over string codes

- **Status:** Accepted
- **Date:** YYYY-MM-DD

## Context

Domain and application code needs to signal failure (not found, conflict,
capacity exceeded, unauthorized, bad input, invariant violated). Two common
approaches: throw `Error('NOT_FOUND')`-style strings, or return ad-hoc result
objects. Both push the burden of mapping failure → HTTP status onto every call
site, where it drifts.

## Decision

Define a small **typed `DomainError` hierarchy** in the domain layer, each
subclass carrying a stable `code`:

| Class                | Code                  | When                                    |
| -------------------- | --------------------- | --------------------------------------- |
| `NotFoundError`      | `NOT_FOUND`           | Missing aggregate / row                 |
| `ConflictError`      | `CONFLICT`            | Duplicate / already-in-state            |
| `ValidationError`    | `VALIDATION`          | Bad input not caught at the boundary    |
| `UnauthorizedError`  | `UNAUTHORIZED`        | Caller lacks permission / not signed in |
| `InvariantViolation` | `INVARIANT_VIOLATION` | Generic state-machine guard             |

Application handlers and the domain throw these. **One** HTTP boundary helper
(`apps/web/src/lib/api-helpers.ts`) maps each subclass to a status code
(404/401/400/409/422) and a `{ error: code, message, details }` body. Client
components consuming server actions branch on the typed `Result<T, code>` instead
of parsing strings.

## Consequences

- ✅ Status mapping lives in exactly one place; route handlers just throw.
- ✅ `instanceof` branching is exhaustive and type-checked.
- ✅ A bare `throw new Error(...)` becomes a smell — it bypasses the mapper and
  surfaces as a generic 500, which is easy to spot in review.
- 🔒 Lint/convention: never throw string-coded `Error`s for domain failures; never
  add ad-hoc status mapping in route handlers.

## Alternatives considered

- **String error codes.** No type safety; the mapping drifts across handlers.
- **Result objects everywhere (no throwing).** Verbose for deep call stacks;
  we use typed results at the _client-invoked server-action_ boundary but let the
  domain throw internally.
