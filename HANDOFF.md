# Zealpro UI handoff

## Current state

The owner payment-status follow-up and all six earlier comments are implemented in `D:\zealpro`: service management with descriptions and estimated products; actual product quantity/cost entry during reporting; scoped theoretical and actual calendar profits; right-side day details; product definitions; and a stronger visual system.

Run `npm start` and open `http://127.0.0.1:4173/#schedule`. The default server was left running. A separate clean presentation/QA origin is running at `http://127.0.0.1:4174/#schedule`; mutation testing and sample reset used only that origin. Existing browser records on port 4173 were not reset by revision testing. Node.js 22+ is sufficient; no runtime package installation or secrets are needed.

## Implemented behavior

- Nine destinations include the new Services catalog and Products & stock management.
- Services support name, description, default charge, planned expenses, multiple estimated products, editing, archive and restore. Scheduling copies an independent estimate snapshot.
- Products support name, description, base unit, unit cost, opening stock, reorder threshold, editing, restock, archive and restore. Referenced units are protected. Active recipes/open allocations block product archival.
- Reports record actual charge, expenses and multiple product quantities/unit costs. Completion deducts once; corrections adjust stock by the usage difference. Captured names, units and prices remain unchanged by catalog edits.
- Month, Week and Day profit totals belong to the visible range. Theoretical profit is quoted charge less estimated products and planned expenses for all visits in range. Actual profit uses confirmed completed reports. Variance compares those same completed visits. These are contribution figures before unrecorded overhead and tax, independent of collection.
- Calendar details sit to the right on desktop; narrow layouts stack. The original logo is retained within navy workspace framing, lime selections, larger type, service recipe cards and a distinct profit band.

## Record preservation

State schema is version two; the key remains `zealpro.demo.v1` for continuity. Old records migrate in memory. The raw original is retained before parsing and must be backed up before the first upgraded or recovery save, under `zealpro.demo.v1.backup` or a timestamped backup. If backup/storage fails, the original store is not overwritten.

Old report charges and prices were not captured, so their actual profit is withheld until the owner confirms the report. Legacy estimates are reconstructed from current catalog costs with zero unrecorded planned expenses, and labeled accordingly. Legacy fractional piece balances/quantities are preserved and flagged; new piece entries require whole numbers. Assessments store stable service IDs. Renamed recommendations remain linked; archived or unidentified recommendations require an explicit choice rather than a silent replacement.

## Verification

- `npm test`: 25 passed, 0 failed. `npm run check`: passed. Payment-specific evidence is in `docs/QA_SERVICE_PAYMENTS.md`; the earlier revision evidence remains historical below.
- Browser checks covered product/service create/edit, two-product estimate defaults, actual quantities/costs/charge, stock corrections, price snapshots, calendar scopes and empty periods, archive guards/restore, Cancel, renamed/archived recommendations and responsive forms.
- A sample visit showed PHP 5,480 theoretical and PHP 5,325 actual profit; correcting usage produced PHP 5,320 actual, with stock reconciled. Catalog price changes did not rewrite prior figures.
- At 1440 by 900 CSS pixels, calendar and right-hand details share their top coordinate. At 390 by 844, calendar fits and product-entry fields use 16 px type within the viewport.
- Independent review identified and cleared migration preservation and service-name reference defects. Both have regression tests. Native whole-piece input stepping was also fixed during browser verification.
- Hallmark static inspection has no failures, unwaived reflexes or warnings; the existing compact-spacing waiver remains. Taste has no failures; overlay/print-shadow warnings were reviewed. Automated render scripts were not used.
- Graphify map: 105 nodes, 482 stored links, nine locally named communities, no dangling endpoints. Source and tests remain authoritative.
- Current evidence: `docs/QA_REVISION2.md`. Historical evidence remains in `docs/QA.md`. Retained current screenshots use `-v2` suffixes. Horizontally truncated full-page captures were discarded; an additional raw-CDP screenshot request was denied by browser approval, with no bypass attempted. `.hallmark/compare.html` compares the overview redesign.

## Skills and capabilities

Caveman ultracave and Ponytail full remain active for chat; persisted documents stay professional. Hallmark, MemPalace, Obsidian Markdown and Taste are installed and applied. Graphify supports source navigation. MemPalace recall is scoped to wing `zealpro`; project notes remain in `knowledge/`. Planning, testing, debugging, verification and independent-review workflows were used.

The host exposes no model switch. Dedicated Chrome DevTools MCP is unavailable; verification used connected Brave controls. Obsidian CLI reaches the existing vault, but project notes were not registered as a new vault. Graphify provider labeling was unavailable in the first milestone and was not retried; labels were curated locally.

## Service payment follow-up

Fulfillment remains Completed independently of payment. New completions create one linked local invoice record due 30 calendar days after the service/report date; due day itself is not overdue. Calendar, visit, report, history and billing views show payment state and due/balance details. Status calculations use the fixed sample date, November 2, 2026. Report charge corrections update linked invoice amounts atomically and cannot go below amounts collected.

Existing invoices and their due dates/payments are never guessed into a service relationship. Old unlinked services show Payment not linked. After confirming the report financials, the owner can review billing and explicitly link a matching same-client, same-charge unlinked invoice or confirm a new service balance. Consolidated invoices need separate reconciliation. Version two and the existing storage key remain supported.

Browser mutation checks used isolated port 4175 and restored only that origin to seed data. Existing port 4174 owner records were not reset or modified. The isolated preview remains running at `http://127.0.0.1:4175/#schedule?date=2026-11-02&view=day`. Screenshots: `docs/screenshots/service-payments-desktop.png` and `service-payments-phone.png`. Independent source review found no Important issues.

## Calendar scroll follow-up

Calendar-to-calendar navigation preserves the viewport scroll position across rerenders; cross-page navigation retains its existing scroll behavior. Desktop date selection was verified at approximately 352 px with less than 1 px browser rounding. Syntax checks and all 18 tests passed. Phone scroll behavior was not rechecked. See `docs/QA_REVISION2.md`.

## Boundaries

This remains a browser-local demonstration with illustrative records. No production authentication, role permissions, shared database, durable correction/audit history, live reminders, real payments/proof uploads or customer signatures are connected. Completion creates a linked local service receivable. These are not issued tax invoices; existing account invoice records remain available. Visits reserve one hour, use one technician and complete within one day. Up to 50 distinct product lines are supported. Printed PDF pagination, browser storage failure injection, screen-reader acceptance and physical phone acceptance remain unverified.

Obtain client decisions on tax/invoice rules, report visibility of financials, the SRS `Gel bathing` terminology, recurrence, multiple personnel and production access rules. Original references remain untouched. Source commit and push were authorized on November 1, 2026. The origin repository is public, so the SRS and three signed reference photographs are excluded from version control. Hosted deployment and migrations have not been performed.
