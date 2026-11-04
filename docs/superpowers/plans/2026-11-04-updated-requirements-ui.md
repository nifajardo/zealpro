# Updated Requirements UI Implementation Plan

> **For agentic workers:** Use subagent-driven-development for independent policy and browser workflow modules, with primary-agent UI integration and verification. Follow this plan in testable slices.

**Goal:** Present the updated four-role and approval-led workflows to the client with browser-local data only.

**Architecture:** Preserve the existing native application and shared domain operations. Extend capability scoping and add one browser presentation workflow module; keep backend files and SQL unchanged. Store demo metadata in the same full browser snapshot to avoid split-store writes.

**Tech Stack:** Native JavaScript modules, CSS tokens, Node built-in tests, existing browser print/PDF workflow.

**Spec:** `docs/superpowers/specs/2026-11-04-updated-requirements-ui.md`.

## Constraints and review focus

- Preserve original assets, owner records, backend separation and navy/lime branding.
- Administrator must not inherit margin access or fieldwork approval. Supervisor costs must not imply commercial access.
- Staff co-assignment must affect conflict checks, visibility and self-approval checks.
- Returned reports retain posted consumption; edits apply only net changes. Approval never posts consumption again.
- A submitted report must not create a receivable before approval. Replayed approval/payment verification must fail without duplicate effects.
- Browser role checks and simulated delivery are presentation behavior, never production security or delivery acceptance.

## Slices

- [x] Review PDF and specification with a fresh-context builder.
- [x] Add tested four-role/five-account policies, team/branch scope and financial field capabilities in `src/access.js` and `tests/demo-access.test.js`.
- [x] Add tested browser-only review, stock, personnel, payment/reminder and user-history transitions in `src/presentation.js` and `tests/presentation.test.js`.
- [x] Integrate role dashboards, restricted details and schedule/report/ocular review forms in `src/app.js`.
- [x] Integrate stock ledger, payment proof/verification/reminder simulation, staff/settings and audit screens, using existing form/table/dialog components.
- [x] Update app/PDF comparison and approval labels, CSS, static allowlists and test/check scripts.
- [x] Verify automated behavior, resolve independent review findings, update traceability, credentials and handoff. Real-browser flows remain blocked by Computer Use URL safety verification; template/controller tests are separate evidence.
- [ ] Commit/push main and verify the existing static Vercel deployment.
