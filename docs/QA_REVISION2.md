# Revision 2: service catalog, products and calendar profit

The six owner comments are implemented as connected local UI behavior. All records used for browser mutation tests below were isolated on port 4174. Existing records on port 4173 were not reset or modified by these tests.

## Automated evidence

`npm test`: 18 passed, 0 failed. `npm run check`: passed. The nine added checks cover service/product lifecycle, immutable visit estimates, multiple actual product deductions and corrections, captured costs, day/week/month ranges, version-one migration, fractional piece compatibility and stable assessment service IDs. Existing failure-case and HTTP exposure tests remain passing.

Hallmark static inspection reports no failures, unwaived reflexes or warnings. The previously documented compact-spacing waiver remains. Taste static inspection reports no failures; remaining warnings concern real overlay shadows and print shadow removal. Connected-browser visual inspection was used instead of automated render scripts.

## Browser evidence

| Request / behavior | Verified result |
| --- | --- |
| Product definitions | Created a monitoring-card product with description, `pcs` unit, PHP 60 unit cost, opening stock 10 and reorder level 3; subsequently edited its cost |
| Service definitions | Created a named service with description, PHP 6,000 charge, PHP 300 planned expenses, 50 mL concentrate and two monitoring cards; estimate preview showed PHP 220 products and PHP 5,480 theoretical profit |
| Scheduling defaults | Selecting the definition copied its charge, expenses and both product lines; saved a service for 3 November |
| Actual reporting | Entered 80 mL concentrate at PHP 2, one monitoring card at PHP 65, actual charge PHP 5,800 and expenses PHP 250; generated report showed PHP 225 actual product cost and PHP 5,325 actual profit |
| Captured costs | Changed the service’s default charge to PHP 7,000 and product catalog cost to PHP 100; the prior visit still showed PHP 6,000 quoted, PHP 5,480 theoretical and PHP 5,325 actual profit |
| Usage correction | Revised actual quantities to 50 mL and two cards while retaining captured PHP 65 card cost; actual product cost became PHP 230, profit PHP 5,320, concentrate stock 4,150 mL and card stock eight pieces |
| Calendar scope | Day view for 3 November showed PHP 5,480 theoretical, PHP 5,320 actual and minus PHP 160 like-for-like variance; week/month aggregates included the appropriate other services |
| Empty period | Previous week, 26 October–1 November, showed zero planned profit and “Not recorded” actual profit rather than a fabricated recorded zero |
| Calendar placement | At 1440 × 900 CSS pixels, calendar and daily detail panel shared the same top coordinate; the detail panel began to the right of the calendar |
| Archive safety | Product archival was blocked while an active service recipe required it; archiving the service then allowed product archival; both could be restored, with history and quantities retained |
| Renamed recommendations | Created an assessment for a custom service, renamed the service, then selected Plan service; the renamed service, its current charge and its correct recipe were selected through the stable ID |
| Archived recommendations | Archiving that service produced an explicit “Recommended service unavailable” dialog; no unrelated service was substituted |
| Cancel regression | Edited a product cost to PHP 99 then canceled; catalog cost stayed PHP 2. Canceled a fully populated actual report without completing its visit or consuming stock |
| Phone | At 390 × 844 CSS pixels, calendar fit the page width; details stacked. The actual-products form stayed within the viewport, with two product rows and 16 px inputs |
| Existing browser data | Original port 4173 records were read through the upgrade path; legacy report finances remain unconfirmed until owner review. Mutation tests and reset affected only the isolated port 4174 sample data |

## Review and repairs

An independent reviewer found two important issues: migration rejected previously allowed fractional piece records before retaining a backup, and assessments referred to mutable service names. Both were fixed with failing-then-passing regression tests. The reviewer’s follow-up found no remaining Important issues in scope.

Raw saved data is now retained before parsing. Before a first upgraded or recovery save, the original string must be backed up successfully; otherwise the original store is not overwritten. Fractional piece balances and imported quantities are preserved and flagged for review. New entries continue to require whole pieces. Actual profit from old reports is withheld until charge and costs are confirmed.

Browser testing also caught a native number-input step-offset issue for pieces. The shared product-line control now uses `min=1, step=1` for pieces and `min=0.01, step=0.01` for other units.

## Presentation screenshots

The complete desktop calendar, catalog and product views were inspected live. Native full-page captures were horizontally truncated and were discarded. A further raw-CDP screenshot request was denied by browser approval; no workaround was attempted.

- `report-actual-entry-v2.png`: actual quantity and unit-cost entry across multiple products.
- `calendar-phone-v2.png` and `report-phone-entry-v2.png`: responsive browser evidence.
- `overview-desktop-v2.png`: revised brand shell, comparable with the original `desktop-overview.png`.

The isolated sample dataset was restored after mutation testing. Original references and the original port 4173 dataset were preserved.

## Calendar scroll regression

November 1, 2026: selecting a date now restores the pre-render scroll position instantly during calendar navigation. Desktop browser verification changed November 5 to November 4 at a scroll offset of about 352 px without jumping to the top (less than 1 px browser rounding). Syntax checks and all 18 automated tests passed. Phone scroll behavior was not rechecked.

## Limits

This remains a local browser demonstration. Profit is service contribution before unrecorded overhead and tax, recognized from financially confirmed completed reports rather than collections. No tax engine, full accounting, durable audit log, multi-user database, login or live integrations are connected. Browser storage failure simulation, printed PDF pagination, screen-reader acceptance and physical phone hardware remain unverified. Additional full-page screenshot capture was denied by browser approval; retained images are existing viewport captures. Automated migration tests prove record preservation and the backup guard was reviewed in source; browser storage failure was not injected into the owner’s existing origin.
