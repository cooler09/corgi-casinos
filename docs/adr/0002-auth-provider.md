# 0002. Auth provider — managed, DB-native (Supabase Auth)

- **Status:** Accepted
- **Date:** YYYY-MM-DD

## Context

The app needs authentication (email/password + OAuth, ideally anonymous/guest
sessions) without building and securing it from scratch. The decision interacts
with the database choice: if auth shares a JWT with the database, we get
row-level security "for free."

## Decision

Use **Supabase Auth** (the reference choice). It shares a JWT with the Postgres
database, enabling row-level security keyed on `auth.uid()`; has a generous free
tier; and ships first-party server-side helpers (`@supabase/ssr`) for the App
Router.

This is an **Optional integration** at the template level — it's behind the same
port discipline as the rest of the data layer, so it can be swapped.

| Provider      | Free tier         | Notes                                                  |
| ------------- | ----------------- | ------------------------------------------------------ |
| **Supabase**  | generous          | **Chosen.** Native to the DB, RLS, OAuth, SSR helpers. |
| Clerk         | generous          | Best DX, but a separate user store from your DB.       |
| Auth.js       | self-hosted, free | More wiring, no managed UI.                            |
| Firebase Auth | unlimited (Spark) | Adds another vendor; weak Postgres story.              |

## Consequences

- ✅ One JWT for app + DB → RLS becomes the authorization backbone.
- ✅ Managed OAuth, email, and anonymous sign-ins; minimal code.
- ❌ Couples auth to the DB vendor. Mitigated by keeping auth access behind the
  data adapter, so a swap is contained to `infrastructure` + the composition root.
- 🔒 **Authorization is enforced on the session-scoped client (RLS), never on the
  admin/service-role client.** See the data-layer rules in [AGENTS.md](../../AGENTS.md).

## Alternatives considered

- **Clerk** — excellent DX, but a separate user table means reconciling identity
  with your DB and no native RLS story.
- **Auth.js (NextAuth)** — flexible and free, but more wiring and no managed UI.
- **Roll your own** — rejected; auth is a security-critical wheel not worth
  reinventing.

> If you choose a non-Supabase database, revisit this ADR — the "shared JWT →
> RLS" benefit is the main reason for the pairing.
