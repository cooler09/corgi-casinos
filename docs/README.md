# docs/ — map

Entry point for the `docs/` tree. The repo's two primary instruction files live
at the root: [AGENTS.md](../AGENTS.md) (conventions + gotchas for agents) and
[README.md](../README.md) (human setup + stack). This file maps everything under
`docs/`.

The tree has four kinds of doc. **Reference** docs describe how things work now
and are kept current. **Decision** records (`adr/`) and the **journal** are
append-only history — the "why" and the journey. **Audits** are point-in-time
snapshots with a remediation backlog.

## Reference docs (kept current)

- [stack.md](stack.md) — the full tech stack: every layer, version floor, and
  one line on why.
- [architecture.md](architecture.md) — hexagonal / DDD / CQRS-lite layering,
  the inward-dependency rule, and the composition root.
- [integrations.md](integrations.md) — every external service, tiered **Core /
  Recommended / Optional**, with env vars, where it wires in, and how to remove
  it cleanly.
- [testing.md](testing.md) — the three test surfaces and when to add a test.
- [design-system.md](design-system.md) — Tailwind v4 + Material-3-style tokens,
  semantic role colors, the type scale, and the CTA/field class vocabularies
  (with the lint-ratchet strategy that keeps them from drifting).

## History & decisions (append-only)

- [adr/](adr/) — architecture decision records, one per decision. Numbered,
  long-lived, **immutable** (supersede, don't edit). See [adr/README.md](adr/README.md).
- [journal/](journal/) — dated narrative per change-bundle: trigger, decisions,
  rejected alternatives, patterns, follow-ups. See [journal/README.md](journal/README.md)
  for the format and [journal/INDEX.md](journal/INDEX.md) to navigate.

## Audits (point-in-time, with backlog)

- [audits/](audits/) — per-topic codebase audits (security, performance,
  accessibility, …) graded P1/P2/P3 with a dated remediation log. Start at the
  [audits/README.md](audits/README.md) index.

> This template seeds the **formats** (ADR template, journal/audit READMEs) and
> the reference docs, but not project-specific history. As you build, add real
> ADRs, journal entries, and audit files.
