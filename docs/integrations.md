# Integrations registry

Every external dependency, tiered so a new project takes only what it needs.
This is the doc to read when deciding what to keep. Each entry lists **what it
does**, its **env vars**, **where it wires in**, and **how to remove it cleanly**.

- **Core** — the template's reason for existing. Don't remove without re-thinking
  the whole stack.
- **Recommended** — strongly suggested; remove only with a reason.
- **Optional** — adopt per project; each is independently removable.

Removing an integration always means: delete its env block from
[.env.example](../.env.example), drop its var(s) from `turbo.json` `globalEnv`,
uninstall the package(s), and delete its adapter/wiring.

---

## Core

### Next.js (App Router) + React

- **What:** The app shell, routing, Server Components, and the API tier (Route
  Handlers under `app/api/*`).
- **Env:** `NEXT_PUBLIC_SITE_URL`.
- **Wires:** `apps/web`. The composition root (`apps/web/src/lib/handlers.ts`)
  injects adapters into application handlers here.
- **Remove:** Not removable — it's the frame. Swapping to another React
  meta-framework means re-homing only `apps/web`; the inner packages are
  framework-free and move unchanged.

### Tailwind CSS v4

- **What:** Utility-first styling; design tokens live in `@theme`.
- **Wires:** `apps/web` PostCSS + `globals.css`. See [design-system.md](design-system.md).
- **Remove:** Possible but invasive (touches every component). Not recommended.

### TypeScript (strict) + pnpm + Turborepo

- **What:** Language, package manager, task runner. The monorepo backbone.
- **Wires:** root configs ([tsconfig.base.json](../tsconfig.base.json),
  [pnpm-workspace.yaml](../pnpm-workspace.yaml), [turbo.json](../turbo.json)).
- **Remove:** Core. See [ADR 0003](adr/0003-monorepo-pnpm-turbo.md).

---

## Recommended

### Zod — runtime validation

- **What:** Validate input at the HTTP boundary; one schema reused by form
  validators and route handlers.
- **Wires:** `@app/types` (schemas) → route handlers + form components.
- **Remove:** Replace with manual validation, but you lose the single-source-of-
  truth between client and server. Keep it.

### Sentry — error monitoring

- **What:** Server + client error capture, source-mapped stack traces, release
  tracking.
- **Env:** `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`,
  `SENTRY_AUTH_TOKEN`, `SENTRY_ENVIRONMENT`.
- **Wires:** `@sentry/nextjs` config files + `next.config` wrapper. Pin the
  `release` and set the user context from your auth state so traces are
  actionable.
- **Remove:** Uninstall `@sentry/nextjs`, delete the config files and the
  `withSentryConfig` wrapper, drop the env block.

### PostHog — product analytics

- **What:** First-party product analytics / funnels. Pair with an
  `AnalyticsPort` in the domain so events are dispatched from the outbox rather
  than sprinkled through UI.
- **Env:** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`.
- **Wires:** browser provider + a server-side capture helper. In serverless,
  flush captures inside the framework's `after()` so they aren't dropped.
- **Remove:** Uninstall `posthog-js`, delete the provider + capture helper, drop
  the env block. Keep the `AnalyticsPort` interface as a no-op if you want to
  swap analytics later.

### Radix UI — headless accessible primitives

- **What:** Dialog, popover, toast, dropdown — the widgets where focus
  management and ARIA are the hard part.
- **Wires:** `apps/web/src/components/*`. Style with your design tokens; bridge
  `data-state` attributes to motion via CSS keyframes.
- **Remove:** Per-primitive. Each is a separate `@radix-ui/react-*` package.

---

## Optional

### Supabase — Postgres + Auth + Realtime + Storage

- **What:** The reference data/auth/realtime backend. Sits **behind a domain
  port** — `domain`/`application` never import it. Auth choice recorded in
  [ADR 0002](adr/0002-auth-provider.md).
- **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (browser); `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (server-only).
- **Wires:** `@app/infrastructure` adapters + `packages/supabase` typed clients
  (browser / server / admin). Migrations under `supabase/migrations`. See the
  data-layer + migration rules in [AGENTS.md](../AGENTS.md).
- **Remove / swap:** Because the repository **ports** live in the domain, swapping
  to Prisma/Drizzle/raw SQL means writing new adapters in `infrastructure` and
  re-wiring the composition root — the domain and application layers don't change.
  Delete `packages/supabase`, the `supabase/` dir, and the env block.

### Stripe — payments / Connect

- **What:** Checkout, subscriptions, and (optionally) Connect marketplace payouts.
- **Env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_CLIENT_ID`.
- **Wires:** checkout server actions + a webhook route handler (`/api/webhooks/
stripe`) running on the admin/session-less client, with idempotency on the
  event id. Mutations after payment are webhook-driven, so checkout-redirecting
  actions defer their revalidation (leave a comment — see pitfall #1 in AGENTS.md).
- **Remove:** Uninstall `stripe`, delete checkout actions + the webhook route,
  drop the env block.

### Resend — transactional email

- **What:** Send transactional email behind a `NotificationPort`-style adapter.
- **Env:** `RESEND_API_KEY`, `RESEND_FROM`.
- **Wires:** `@app/infrastructure` email adapter, drained from the notification
  outbox.
- **Remove:** Uninstall `resend`, delete the email adapter, drop the env block.

### Leaflet + react-leaflet — maps

- **What:** Client-side maps / clustered pin views.
- **Wires:** a `'use client'` map component (dynamic-imported so it stays off the
  server bundle). Note geometry decoding gotchas if your DB returns EWKB hex.
- **Remove:** Uninstall `leaflet`/`react-leaflet`/cluster + `@types/*`, delete the
  map component.

### web-push — browser push notifications

- **What:** VAPID web push, drained from the notification outbox by a cron-driven
  worker route.
- **Env:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`.
- **Wires:** subscribe route + worker route + service worker. Note: cron-driven
  workers typically only run in production on most hosts — push won't drain on
  preview deployments.
- **Remove:** Uninstall `web-push`, delete the subscribe/worker routes + service
  worker, drop the env block.

### Cloudflare Turnstile — bot / CAPTCHA

- **What:** Bot protection on public forms (signup, guest flows).
- **Env:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
- **Wires:** a widget on the form + server-side token verification in the action.
- **Remove:** Delete the widget + verification helper, drop the env block.

### Smaller utilities

| Package        | What                          | Remove                              |
| -------------- | ----------------------------- | ----------------------------------- |
| `date-fns`     | Date formatting/arithmetic    | Replace with `Intl` / `Temporal`.   |
| `qrcode.react` | QR codes (e.g. kiosk/display) | Delete the component using it.      |
| `tz-lookup`    | lat/lng → IANA timezone       | Drop if you don't store geo events. |

---

## Adding a new integration

1. Decide its tier and add a row here with the four facts (what / env / wires /
   remove).
2. If it's a backend capability the domain depends on, define a **port** in the
   domain and an **adapter** in `infrastructure` — don't let the SDK leak inward.
3. Add its env vars to [.env.example](../.env.example) (under the right tier
   header) and `turbo.json` `globalEnv`.
4. If the decision is non-obvious, write an ADR.
