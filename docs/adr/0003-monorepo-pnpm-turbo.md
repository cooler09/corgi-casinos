# 0003. pnpm workspaces + Turborepo monorepo

- **Status:** Accepted
- **Date:** YYYY-MM-DD

## Context

The hexagonal layering ([ADR 0001](0001-hexagonal-cqrs.md)) splits the codebase
into packages that depend on each other (`domain`, `application`,
`infrastructure`, `types`, `config`) plus the app. We need: enforced package
boundaries, fast incremental builds/tests, and a single `pnpm install`.

## Decision

A **pnpm workspaces** monorepo orchestrated by **Turborepo**.

- pnpm — content-addressed store (fast, disk-cheap) and strict node_modules that
  surfaces phantom dependencies. Workspaces via [pnpm-workspace.yaml](../../pnpm-workspace.yaml).
- Turborepo — a task graph (`build`, `lint`, `typecheck`, `test`) with caching,
  so re-running the verify chain after a small change is near-instant. The graph
  is declared in [turbo.json](../../turbo.json); `dependsOn: ["^build"]` makes a
  package's task wait on its dependencies.

Packages are scoped (`@app/*`) and reference each other with `workspace:*`.

## Consequences

- ✅ One install; cross-package changes are atomic in a single PR.
- ✅ Cached builds/tests — the four-gate verify chain stays fast.
- ✅ The package graph makes the inward-dependency rule visible and lintable.
- ❌ Slightly more setup than a single package, and a learning curve for the
  Turbo cache model. Accepted.

## Alternatives considered

- **Single package, folders not packages.** Loses the enforced import boundary —
  the purity ratchet relies on real package edges.
- **Nx.** More powerful, more to learn; Turbo's caching + task graph is enough.
- **npm/yarn workspaces.** Workable, but pnpm's strictness and speed won.
