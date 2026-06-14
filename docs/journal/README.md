# Journal

Audits record **what** is broken; the journal records **why** a change was made
and **how** the codebase reached its current state. After shipping a non-trivial
bundle of changes, add a dated entry here.

Use [INDEX.md](INDEX.md) to navigate by initiative.

## When to write an entry

After any non-trivial **bundle** of changes (a feature, a refactor, a fix that
took real reasoning). Skip it for typo fixes and one-line tweaks.

## File naming

```
docs/journal/YYYY-MM-DD-short-kebab-slug.md
```

One entry per bundle. Multiple bundles a day get distinct slugs.

## Entry format

```markdown
# YYYY-MM-DD — <Title>

## Trigger

What prompted this bundle — the bug report, the audit finding, the user ask.

## Decisions

What was changed and the reasoning. Link the ADR if one backs it.

## Rejected alternatives

What you considered and didn't do, and why. (This is the highest-value section
for the next reader — it prevents re-litigating.)

## Patterns surfaced

Recurring issues this change exposed (a lint rule that keeps tripping, a missing
primitive). Promote durable patterns into AGENTS.md "Common pitfalls".

## Follow-ups

What you deliberately deferred, so the next agent can pick it up.
```

## Digest convention

Keep the **current month** as individual dated files. When a month closes, roll
its entries into a single `YYYY-MM-digest.md` — one anchored section per bundle,
with citations rewritten to `…-digest.md#<slug>`. This keeps the directory
listing scannable as history accumulates.

> This template seeds the format only. Your first real entry starts the history.
