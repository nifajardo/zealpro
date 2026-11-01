# Calendar year view and visual refinement

The owner requested a softer aesthetic than the saturated navy/lime pairing, a Year calendar option, and matching calendar/detail panel sizes across modes. They confirmed the sizing issue concerns uneven card/panel sizes rather than incorrect date-range totals. Drafting work must stay directly on main, with verification followed by commit/push.

## Direction

Use clean white/cool-neutral surfaces and the supplied logo as the authoritative brand palette: navy #0f346e for small actions, cyan #3bb3c2 with darker accessible shades for calendar/data highlights, and lime #84c225 with darker accessible shades for completion states. Avoid large navy or lime blocks. Preserve the supplied logo, General Sans, routes, records, forms and all existing workflows. The Taste achromatic-ledger direction is the starting point: navigation recedes, figures are in ink, surfaces separate with rules and colour carries meaning. The explicit logo-brand request overrides the sheet's achromatic primary-action colour; the existing nine-destination labelled sidebar is retained for findability. This is a refinement of the application, not a framework or asset replacement.

The primary calendar question is: what work and contribution belong to this period? Objects are dated service visits, assigned technicians, branch identities, captured theoretical contribution, confirmed actual contribution and payment standing. Seed magnitudes remain honest: 10 visits and 3 confirmed reports, all in November 2026, with other months empty. Existing figures are derived, never invented to fill a calendar.

## Behavior

- Year shows January through December of the selected year and annual theoretical/actual contribution from the same domain calculations as other scopes. Each of twelve equal-size month cards shows a six-week mini-calendar and that month's service count and contribution. Cards open the corresponding Month view. Empty actual contribution remains Not recorded.
- Previous/next advance by the active period. Leap-day/year and month-end navigation clamp to the last valid day; unsupported date bounds do not silently reset the view.
- At desktop widths, the calendar and selected-day detail panel share top and bottom edges and a stable frame height across Year/Month/Week/Day. Long agendas, month collections and service lists scroll inside their own panel. The right-side details remain usable; calendar clicks retain page scroll.
- On narrow screens, panels stack and use natural, bounded content rather than forcing equal blank heights. Month cards and controls fit without horizontal page overflow. Dense annual mini-calendar cells are visual; each entire month card is a large accessible link to Month view.
- The Add service for this day button spans the full inner width of its detail card. In-month day cells use a white surface with clear grid rules; outside-month spaces have a distinct muted fill and legend.
- Keep service/payment data, local browser records, private references and the local database unchanged. No UI/database persistence cutover or hosted service work is included.

## Verification and completion

Add domain regression tests for annual boundaries, annual/month reconciliation, leap/year navigation and empty years. Verify real browser behavior for all four modes, panel edge alignment and internal scrolling, month drilling, previous/next, selected-day details and preserved page scroll. Check desktop and narrow views, representative forms/lists, console errors, typography and colour contrast. Record before/after screenshots using supported browser controls, run existing tests/syntax checks, obtain an independent source review, update handoff and push main.

Automated browser inspector scripts are adapted to the connected browser's supported native controls and read-only DOM inspection; do not bypass the prior raw-CDP permission denial. Static Taste lint remains usable.
