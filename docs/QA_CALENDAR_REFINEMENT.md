# Calendar and brand refinement QA

## Result

The supplied logo now governs the quieter white interface: navy actions, cyan calendar marks and green completion states. Year joins Month, Week and Day. Annual totals use the existing captured-cost contribution calculations, and twelve equal month cards open their corresponding Month view. Desktop calendar and day-detail frames align; the detail action fills the card's inner width. White in-month cells, darker grid rules and a distinct outside-month fill separate the calendar from the page.

The UI continues to save browser-local records. No database migration, browser import or hosted deployment is included.

## Automated and source checks

- `npm test`: 39 passed, zero failed/skipped. The three new tests cover annual/leap boundaries, clamped navigation, unsupported date bounds, annual/month reconciliation and empty actual profit.
- `npm run check` and `git diff --check`: passed.
- Independent calendar source review: no outstanding Important/Critical findings. The review suggested checking unusually large totals; the browser check below covers that case.
- Taste static lint: zero failures, five warnings. Two are legitimate ISO-date zero padding; three are existing real overlay shadows for dialogs, mobile navigation and feedback. No suppression was added.
- Text contrast against its paired surface: navy/white 12.09:1, ink/white 13.37:1, muted/white 5.45:1, cyan ink/tint 5.60:1 and green ink/tint 6.01:1.
- All five original source-file SHA-256 hashes still match `docs/SOURCE_MANIFEST.json`.
- Graphify refreshed the local source map without provider calls. Optional SQL parsing remains unavailable; migration source and tests remain authoritative.

## Real browser evidence

Connected Brave controls and read-only DOM measurements were used. Dedicated Chrome DevTools MCP and an isolated in-app browser were unavailable. The Taste inspector was adapted to supported screenshots and DOM measurements; no raw-CDP retry was made.

- At measured viewport 1371 by 621 CSS pixels, all four modes had calendar and detail panels exactly 720 pixels high, both top 464.05 and bottom 1184.05 before page scroll. Document width 1361 did not exceed the viewport. Day mode was rechecked after removing a conflicting calendar-day wrapper class.
- The footer action and footer each measure 336.56 pixels wide; the bordered detail card reports 337 pixels of integer-rounded client width. The action fills the card's inner width. Its form uses the selected date; opening and cancelling the November 4 form preserved records.
- Year 2026 showed 10 visits, theoretical contribution PHP 50,880, actual contribution PHP 12,390 and service value PHP 56,000. Next/previous year, November drill-down and selected-day details were verified. Empty months display Not recorded for actual contribution.
- Selecting a fully visible November 6 date retained page scroll at 405 pixels before and after. Global smooth scrolling is disabled; existing calendar route scroll restoration remains in place.
- Outside-month fill is RGB 225/232/237, grid rules 184/200/210, weekends 246/249/250 and selected dates 234/246/247. In-month cells use white.
- Requested narrow viewport 390 by 844 produced measured 278 CSS-pixel width under the user's existing browser zoom. All four modes had document width 268 and equal stacked panel widths 235.87, with no horizontal page overflow. The temporary viewport override was reset.
- On disposable QA origin port 4389 only, a temporary PHP 1,000,000,000 service tested long figures. All twelve month cards remained equal at 228.09 pixels high; each footer's content fit its 60-pixel height, and totals wrapped within their available width. Only that QA origin was restored to seed data afterward. Owner browser records and the persistent local database were not reset.
- Captured browser warnings/errors: none. General Sans loaded successfully.

## Visual record and design review

Before: [overview](screenshots/overview-before-refinement.png), [calendar](screenshots/calendar-before-refinement.png).

After: [overview](screenshots/overview-after-refinement.png), [Year](screenshots/calendar-year-after-refinement.png), [Month](screenshots/calendar-month-after-refinement.png), [full-width detail action](screenshots/calendar-detail-after-refinement.png).

The Taste achromatic-ledger app direction supplies the restrained chrome and ink figures. The explicit logo instruction overrides its achromatic action colour. Existing labelled navigation stays because nine destinations need findable names. Screenshots were inspected and the sizing, overflow and colour treatments revised; no new framework, generated imagery or decorative assets were needed.

These are native viewport captures, not a full-page montage. Browser zoom affects measured CSS dimensions. Physical-phone, screen-reader and print acceptance were not performed. This is a verified local draft, not production acceptance.
