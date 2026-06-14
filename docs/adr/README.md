# Architecture Decision Records

Short, dated records of significant architectural choices. New decisions go in
their own numbered file. **Existing ADRs are immutable** — if a decision changes,
add a new ADR that supersedes the old one and update the old one's status to
`Superseded by NNNN`. Never edit the substance of an accepted ADR.

Copy [0000-template.md](0000-template.md) to start a new one. Number sequentially.

| #                                   | Title                                                 | Status   |
| ----------------------------------- | ----------------------------------------------------- | -------- |
| [0001](0001-hexagonal-cqrs.md)      | Hexagonal architecture with CQRS-lite                 | Accepted |
| [0002](0002-auth-provider.md)       | Auth provider (managed, DB-native)                    | Accepted |
| [0003](0003-monorepo-pnpm-turbo.md) | pnpm workspaces + Turborepo monorepo                  | Accepted |
| [0004](0004-typed-domain-errors.md) | Typed `DomainError` hierarchy over string codes       | Accepted |
| [0005](0005-page-decomposition.md)  | Page composition: `_components/` + co-located actions | Accepted |

> These five are seeded as the architecture-defining decisions this template
> mirrors. Your project's ADRs continue from here — record the choices that were
> non-obvious or that you'd otherwise re-litigate in six months.
