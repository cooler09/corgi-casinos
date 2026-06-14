# Design system

The reference project evolved a Material-3-flavored design system on top of
Tailwind v4. You can adopt it wholesale, take the ideas, or swap it — but the
**three disciplines below are what keep a UI consistent as it grows**, and they
transfer to any token system.

## 1. Tokens carry light + dark — surfaces never hand-roll `dark:`

Define semantic **role tokens** in Tailwind's `@theme` (in `globals.css`) so
each role already encodes its light and dark value. A component paints with the
role, not the raw palette, and therefore needs **no `dark:` variant**:

| Semantic | bg                     | text                        | border              |
| -------- | ---------------------- | --------------------------- | ------------------- |
| error    | `bg-error-container`   | `text-on-error-container`   | `border-error/30`   |
| warning  | `bg-warning-container` | `text-on-warning-container` | `border-warning/30` |
| success  | `bg-success-container` | `text-on-success-container` | `border-success/30` |
| info     | brand `primary` tint   | `text-primary`              | `border-primary/30` |

The recurring dark-mode contrast bugs in the source project all came from
hand-rolling per-theme palette guesses (`bg-red-50 dark:bg-red-950 …`). Routing
every status surface through an `<Alert variant>` / toast that consumes role
tokens fixed them by construction. `warning`/`success` are custom roles (Material
ships neither) — seed them with the **same tones** as `error` so contrast is
correct automatically.

**Surfaces (page / card / dialog) use a tonal elevation ramp**, not piles of
shadow: page = `surface`, base card = `surface-container`, raised dialog/menu =
`surface-container-high`, nested emphasis = `surface-container-highest`.
Elevation comes from _tone_, which is how dark mode reads depth.

**Caveat:** not every red/green is semantic. Decorative or functional colors
(a scoreboard's team colors, a brand accent) are **not** error/success and must
not be remapped onto these roles.

## 2. Headings use a type scale — not raw `text-Nxl`

Define a type scale in `@theme` (`text-headline-lg`, `text-title-lg`,
`text-display-sm`, …) that sets font-size **and** line-height, and use those
roles for headings. A representative mapping:

| Role               | Typical use             |
| ------------------ | ----------------------- |
| `text-title-lg`    | card / section subtitle |
| `text-headline-sm` | section header (h2/h3)  |
| `text-headline-lg` | page title (h1)         |
| `text-display-sm`  | marketing hero h1       |

Keep the weight (`font-bold`) alongside the role class. Body/caption text can
stay on raw sizes until you decide its mapping — that's a judgment call, not 1:1.

## 3. Centralized class vocabularies — enforced by a lint ratchet

There is **one** home for button and field class strings. Don't hand-roll
`bg-primary hover:bg-primary/90 text-white …` or a local `const inputClass = '…'`.

- **Buttons:** import from a `primary-button.tsx` vocabulary —
  `primaryButtonClass` / `secondaryButtonClass` / `tonalButtonClass` /
  `textButtonClass`, plus an `error*` family for destructive actions. Each takes
  a size (`'sm' | 'md'`).
- **Fields:** import from a `field-styles.ts` vocabulary — `fieldInputClass` /
  `fieldLabelClass` / `fieldHintClass` / `fieldErrorClass` — or a richer
  `TextField` primitive with auto-wired `aria`.

Enforce both with a `no-restricted-syntax` ESLint rule that errors on the raw
patterns. The strategy is **migrate-to-zero-then-lock**: first sweep existing
drift to zero, then turn the rule on so it can't re-accumulate. (ESLint rules are
single-severity, so a "warn" phase doesn't work as a ratchet — migrate fully,
then set it to `error`.)

## Accessibility patterns worth keeping

- **Reach for headless primitives** (Radix) for focus traps, `aria-live`
  regions, and dismissal behavior rather than hand-rolling. Preserve your
  component's public API when migrating so call sites don't change.
- **Reveal form alerts to scrolled-down users.** A long form's error banner at
  the top is invisible to a user at the submit button. Wire a small
  `useAlertReveal(trigger, active)` hook that scrolls the `role="alert"` node into
  view **only when off-screen** and moves focus to it (the WCAG error-summary
  pattern). Pass the `useFormState` state object as the trigger so a repeated
  error still re-fires.
- **Make alerts actionable.** Never bake a route into an error string
  (`"finish setup at /settings/billing"` is a dead end). Carry a typed
  `cta: { href, label }` on the result and render a real link — but only attach a
  CTA the _current viewer_ can act on.

## Adopting vs. swapping

These three disciplines (role tokens with built-in dark values, a type scale,
centralized + lint-locked class vocabularies) are the transferable part. If you
bring your own design system, keep the _disciplines_ even if you drop the
Material-3 token names — they're what stop a UI from drifting into 30 slightly
different button styles.
