# 0005. Page composition: `_components/` + co-located actions

- **Status:** Accepted
- **Date:** YYYY-MM-DD

## Context

Next.js App Router pages tend to grow into 500-line files mixing data loading,
mapping, markup, and server actions. That's hard to read, hard to test, and
pushes DB-shaped data into reusable components. We want a consistent
decomposition rule so pages stay thin and components stay reusable.

## Decision

Pages are **thin orchestrators** (target < ~200 LOC, ideally < 150). When a page
grows:

- **Co-locate sub-components under `_components/`.** The underscore prefix keeps
  Next.js from treating them as routes.
- **Co-locate server actions next to (not inside) the page** — `*-actions.ts`
  files marked `'use server'` at the top.
- **Map snake_case DB rows → camelCase props at the page boundary.** Components
  take camelCase props; the page does the mapping. Don't push DB shape into
  reusable components.
- **Extract pure helpers into the file of their primary consumer.** No shared
  util file for one-time use.
- **Server components by default; lift `'use client'` only when needed.**

For `FormData` actions, wrap typed actions with thin adapters bound at the call
site and read fields through a shared `form-data.ts` helper; always pass a
`returnPath` so the action can `revalidatePath()` the right URL.

## Consequences

- ✅ Pages read like a table of contents; logic lives in testable units.
- ✅ Reusable components never depend on DB row shape.
- ❌ More files per route. Accepted — the alternative is unreadable mega-pages.
- 🔒 Watch the RSC boundary: passing a function from a Server Component to a
  Client Component throws at runtime (invisible to typecheck/build). Any
  `'use client'` primitive taking a function prop forces its callers to be client
  components too. See pitfall #5 in [AGENTS.md](../../AGENTS.md).

## Alternatives considered

- **Everything inline in `page.tsx`.** Simplest until ~150 LOC, then unmaintainable.
- **A `features/` directory parallel to `app/`.** Adds a layer of indirection;
  co-location keeps related code physically together and discoverable.
