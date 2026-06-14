# Audits

Point-in-time codebase audits, one file per topic, with a graded backlog and a
dated remediation log. Audits answer **what is broken / risky right now**; the
[journal](../journal/) answers **why** changes were made.

## Topics

Create a file per topic as you audit it. Common topics:

| Topic          | File               |
| -------------- | ------------------ |
| Security       | `security.md`      |
| Performance    | `performance.md`   |
| Architecture   | `architecture.md`  |
| Accessibility  | `accessibility.md` |
| SEO            | `seo.md`           |
| Privacy / PII  | `privacy.md`       |
| Documentation  | `documentation.md` |
| Per-feature UX | `<feature>-ux.md`  |

(Use these as a starting menu — add others as needed.)

## How findings are graded

| Severity | Meaning                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------- |
| **P1**   | Production-exploitable bug, data-loss risk, or broken user-visible behavior. Fix before next deploy. |
| **P2**   | Important hardening, correctness, or quality issue. Schedule into the next sprint.                   |
| **P3**   | Nice-to-have. Address opportunistically.                                                             |

Every finding needs:

- a **file link** (`path/file.ts#L10-L20`), and
- a **concrete recommended fix** — no vague "consider refactoring".

so it can be picked up later without re-running the audit.

## File conventions

- **Read the existing audit file before re-auditing a topic.** Open findings are
  the starting backlog.
- **Lead each file with its current status.** Add a dated **status update** block
  at the top; keep historical status blocks in a **remediation log** below.
- **Write findings into the file**, not into chat. Add a remediation-log entry
  when a fix lands.
- **Maintain an index table** (this README) with one **short** status cell per
  topic — open counts or `✅ closed` + date. The full narrative lives at the top
  of each audit file, _not_ in the table. (Pasting status blocks into a table
  cell has ballooned index files to un-openable sizes — keep cells short.)

## Index

| Topic        | Last audited | Status |
| ------------ | ------------ | ------ |
| _(none yet)_ | —            | —      |

> An ad-hoc chat-only summary is fine for a quick sanity scan — but **say so**
> ("quick scan, not a full audit") and offer to write it into the relevant file.
