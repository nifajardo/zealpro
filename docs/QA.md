# Zealpro UI verification

Current verification: **18 tests pass** after the service/product/profit revision. See [revision 2 evidence](QA_REVISION2.md) for catalog management, multiple actual products, corrections, calendar scope, migration and redesign acceptance. The initial-milestone evidence below is retained as history.

Verified on 1 November 2026. This records evidence for a local UI milestone, not production acceptance.

## Automated checks

- `npm test`: 9 tests passed, 0 failed. Covers reconciled totals; date, stock and technician-conflict validation; atomic fulfillment and duplicate-deduction protection; prospect assessment before enrollment; duplicate client branches; payment/restock validation; saved-state validation; public asset delivery and private-file/traversal rejection.
- `npm run check`: all four JavaScript modules passed Node syntax checks.
- `git diff --check`: no tracked whitespace errors. The repository is unborn and files are untracked, so new text files were also inspected separately.
- Hallmark static inspection: 0 FAIL, 0 REFLEX, 0 WARN; one spacing gate waived with a recorded reason (141 matching declarations); two Finish findings answered. The spacing waiver preserves compact service/calendar alignment. Base outlined buttons and the native modal’s border/elevation were inspected rather than treated as extra primary controls or content-card shadows.
- Taste static inspection: 0 FAIL, 5 WARN. Reviewed warnings concern native overlay shadows, print shadow removal, and date zero-padding. No decorative card shadows or zero-padded KPI labels remain.
- Graphify source extraction: 3 source files, 78 nodes, 304 edges, 9 communities, 0 dangling endpoints. Graph traversal reached the shared treatment, stock and payment functions; their source was inspected directly.

## Browser walkthrough

Connected Brave browser, using computer-use browser controls. Actual CSS viewport measurements were checked because Windows display scaling changes physical screenshot sizes.

| Check | Observed result |
| --- | --- |
| Desktop overview at 1440 × 900 | Branded logo, service queue, totals, fulfillment, attention, trend/report section headers and first report are visible; General Sans loaded |
| Tablet overview at 768 × 1024 | Labeled mobile navigation; single main column; summary and service table readable |
| Phone overview at 390 × 844 | Two-column summary; compact service rows; collapsed navigation; no page-wide overflow on the overview |
| Phone calendar | Month grid remains visible; day/service counts and next/previous month controls work; wide detail tables scroll inside their region |
| Scheduling failure | Excess material allocation displays “Not enough unallocated stock”; form remains open |
| Scheduling success | Valid service saved and appeared on 3 November; browser reload retained changes |
| Treatment failure | Time-out before time-in displays validation error; completion is blocked |
| Treatment success | Northpoint’s 11:00 service completed with 200 mL usage; stock changed from 4,200 to 4,000 mL; a report opened with findings and previous same-pest observations |
| Restocking | Gel bait increased from 180 to 280 g; low-stock state cleared |
| Payment | Recorded PHP 13,500 against INV-2026-0108; balance became zero and invoice appeared under Paid |
| Prospect flow | Created `Demo <Site> & Co` before enrollment; markup characters rendered as text; enrollment carried account/branch into the agreement and linked the assessment |
| Empty search | Unmatched client search displayed “No matching branches” |
| Calendar | Next month opened December; Sample day returned to 2 November |
| Dialog behavior | Native dialog opened with focus on its close control; Escape dismissed it |
| Cancellation regression | Before the fix, a valid restock + Cancel incorrectly changed 180 to 190 g. After adding `type="button"`, another valid restock + Cancel left 190 g unchanged |
| Console | No warning or error entries in captured browser logs after the walkthrough |
| Presentation reset | Reset through the app restored 8 sample-day services, 3 completed, PHP 42,500 projected, PHP 49,500 receivable and 180 g gel bait |

Screenshots in `docs/screenshots/` show the clean starting dataset. They are browser evidence, not physical-device acceptance.

## Independent review

A fresh reviewer inspected source, model invariants, static serving, rendering and tests. The reviewer found the Cancel/default-submit bug. It was reproduced, fixed once in the shared button helper, and rechecked in the browser. The follow-up review reported no remaining Important findings. Invoice issuance was identified as a declared scope omission; README and SRS traceability explicitly state that collection uses preloaded invoices.

## Limits

- Browser printing/PDF pagination, screen-reader behavior, physical phone hardware, multi-tab editing, unavailable-storage behavior and corrupt-storage recovery were not fully exercised in the browser. Invalid stored-record shapes are covered by unit tests. A raw browser-storage test capability was unavailable; no existing storage was modified through that capability.
- Automated Hallmark/Taste render scripts were not used; their static checks and connected-browser visual inspection were used. Dedicated Chrome DevTools MCP was not connected.
- Native HTML/CSS and local modules require no bundle build. No production deployment, authentication, role permissions, hosted database, automatic reminder delivery, actual payment/proof upload or customer signing was tested or implemented.
- Obsidian CLI could list the existing `knowledge` vault. Repository notes were written in Obsidian-compatible Markdown; their live Obsidian reading view was not checked or registered as a separate vault.
- Automatic Graphify community labeling was unavailable because its configured Claude CLI was not logged in. Local AST extraction succeeded; community names were curated without another provider call.
