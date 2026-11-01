# Services and calendar profitability implementation plan

> Use executing-plans inline; obtain one independent review of the resulting change.

**Goal:** Implement all six owner comments as connected local UI behavior.

**Spec:** `docs/superpowers/specs/2026-11-01-service-profit-revision.md`.

- [x] Extend model tests first for catalog lifecycle, multiple product lines, atomic actual usage/corrections, price snapshots, range profit and non-destructive migration.
- [x] Implement version-two fixtures and model functions, retaining version-one input compatibility where existing tests exercise it. Verify model tests.
- [x] Add service and product management, reusable product-line form controls, estimated scheduling and actual reporting/revision. Update existing callers and report rendering.
- [x] Recompose calendar into scoped profitability, month/week/day planning and right-hand selected-day details. Strengthen the visual system across the workspace.
- [x] Verify all requested flows in a real browser, including cancellation, failure cases and responsive layouts. Run automated and design checks; fix independent review findings.
- [x] Update source map, QA, walkthrough, source traceability, Obsidian notes and handoff; preserve original assets and existing demo data.

## Completion evidence

All six comments are implemented. Eighteen tests and syntax checks pass. Independent review findings were repaired with regression tests. Browser mutation tests used an isolated origin and left the original data intact; the isolated presentation data was restored. See `docs/QA_REVISION2.md` for measured layouts, exact workflow figures and capture/production limits.
