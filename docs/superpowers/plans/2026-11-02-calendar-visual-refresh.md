# Calendar refinement implementation plan

**Goal:** Add annual planning and make the calendar and application visually coherent without changing stored business data.

**Spec:** `docs/superpowers/specs/2026-11-02-calendar-visual-refresh.md`.

- [x] Record the current calendar/overview visuals and mismatched panel measurements.
- [x] Prove annual scope/navigation and reconciliation with failing tests; add Year and shared navigation through the existing domain model.
- [x] Render twelve consistent month cards and drill-down, retaining right-side day details and existing scope profitability.
- [x] Refine tokens/chrome and align panel frames, with internal overflow and responsive behavior.
- [x] Verify all four calendar modes, representative forms, colours/contrast and scrolling in the real browser. Run full tests and independent review; fix findings.
- [x] Update QA/handoff and prepare the verified direct-main commit/push. Do not create a feature branch.

## Execution notes

- Main baseline is `4d01404`; the prior complete suite was 36 tests.
- The owner's later explicit logo instruction superseded the optional palette question. The supplied navy/lime/cyan logo defines the palette, with white chrome and darker accessible accent shades.
- All 39 tests and syntax checks pass. Independent review found no Important/Critical issues. A nested equal-row month grid lets large monetary values wrap without clipping the footer or making cards uneven.
- Browser evidence and limitations are recorded in `docs/QA_CALENDAR_REFINEMENT.md`.
