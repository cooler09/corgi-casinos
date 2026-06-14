# Testing strategy

Three test surfaces. Match each new test to the layer that owns the logic —
don't push a domain invariant into Playwright, and don't assert UI plumbing in a
domain unit test.

| Surface        | Runner                  | Where                                            | What belongs here                                                                                                          |
| -------------- | ----------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Unit**       | Vitest                  | `packages/{domain,application}/src/**/*.test.ts` | Pure business rules, aggregate invariants, command/query handler edge cases, value-object construction, typed-error paths. |
| **Unit (web)** | Vitest (`apps/web`)     | `apps/web/src/**/*.test.ts`                      | Framework-glue you can isolate by mocking (`vi.mock('next/server', …)`). Form-data helpers, money math, consent gates.     |
| **End-to-end** | Playwright _(optional)_ | `apps/web/tests/e2e/`                            | Cross-cutting user journeys against a real server + DB: signup → core action, paid checkout round-trips.                   |

## When to add a test

**Always add or update a test when:**

- You fix a production-reachable bug. The test should **fail before the fix and
  pass after** — this encodes _why_ the change was made in executable form, the
  highest-signal context you can leave the next agent.
- You add a domain rule (capacity, eligibility, a state transition). Goes in
  `packages/domain`.
- You add an application handler. Cover the happy path **and** each typed-error
  branch (`NotFoundError`, `ConflictError`, …).
- You add a non-trivial flow touching payments, authorization/RLS, or a consent
  gate — the layers where regressions are silent in prod.

**Skip the test when:**

- The change is a pure type tweak, doc/comment edit, or rename the typecheck
  already covers.
- The behavior is exhaustively constrained by the type system (discriminated
  unions, `exactOptionalPropertyTypes`).

## How to write the test

- **Use the test name as the decision record.** `'rejects join when at capacity'`
  beats `'capacity works'`. The next agent reads the failing name first.
- **Mock at module boundaries, not call sites.** `vi.mock('next/server', …)`
  keeps the test honest about what the unit owns vs. delegates.
- **Don't test framework internals.** Don't assert `revalidatePath` was called
  inside a server action's unit test — that's plumbing the integration layer
  validates. Do assert the action throws the right `DomainError` or redirects to
  the expected flash-param URL.
- **Playwright is for "did the user get what they wanted," not "did the handler
  return the right shape."** Reserve it for regressions that only surface as a
  broken click-path (auth cookie quirks, authorization gaps, external redirect
  round-trips). For internal logic write a Vitest case — it runs 100× faster and
  pins the cause, not the symptom.

## Verify order

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

E2E is **not** part of the default verify chain — run it manually against a
deployed environment when the change touches a covered journey. Authoring an e2e
is not the same as running it green; run a new mutating spec against a real
environment before calling it done.
