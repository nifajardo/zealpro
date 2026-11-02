# Roles, cumulative PDF and ocular findings QA

Date: 2026-11-03. Scope: browser-local presentation and shared ocular domain; the local API remains unauthenticated and loopback-only.

## Requirements and review

The private SRS was inspected from its three locally rendered pages without modifying the original. The role mapping is a proposed allocation because the SRS lists the hierarchy without detailed permissions. The owner's navy/lime reference remains the visual authority. No framework, PDF dependency, hosted authentication provider or billable resource was introduced.

Independent domain and UI reviews found three issues during implementation: missing general inspection notes in cumulative output, Supervisor service-change code assuming Owner-only price fields existed, and an account literally named All colliding with the aggregate filter. All three were fixed; general and finding notes are independent, optional finance inputs are guarded, and account keys are prefixed. Re-review reported no outstanding Important/Critical findings. The owner's later clarification removed CSV generation and retained the existing PDF preview/print workflow.

## Automated checks

- `npm test`: **63 passed**, zero failed, skipped or cancelled.
- `npm run check`: passed for all application, build and backend modules.
- `npm run build`: **12 browser files**, local server/database excluded.
- `npm audit --omit=dev`: zero vulnerabilities.
- `git diff --check`: passed.
- SHA-256 checks matched all five original assets in `SOURCE_MANIFEST.json`; the public logo remains byte-identical to its original.
- Hallmark app static sweep: zero failures, reflexes or warnings; existing compact-spacing waivers plus one 6-pixel print-table spacing waiver remain, with three existing Finish findings answered. Taste runtime-source sweep: zero failures; five intentional warnings cover actual overlay shadows and ISO-date padding. Generated Graphify output and model validation example text are outside the runtime visual scan. Connected browser screenshots/DOM checks substitute for the unavailable scripted render inspector.

New tests cover fail-closed demo credentials and permissions, foreign record rejection, full-workspace preservation, protected prices/assessor identity, account/date/branch boundaries, an account named All, captured product units/costs, unconfirmed actuals, source provenance, independent general/finding notes, 20-row/product limits, sparse/malformed inputs, legacy migration, archived references and isolated PostgreSQL JSONB round-trips with atomic failure. Existing stock, payment, migration, API, export and calendar regressions remain green.

## Connected browser checks

Testing used connected Brave and a fresh static QA origin, `http://127.0.0.1:4490/`, serving the generated artifact. Only this origin received synthetic QA entries. Owner browser origins and `.local/db` were not reset or imported.

- Technician sign-in displayed only Marco Reyes's three assigned visits. Billing/analytics/scheduling and financial totals were absent. Direct Billing navigation returned to Overview with an access notice.
- A final hosted check found the Technician Overview still offered its analytics teaser even though the destination was denied. The teaser now uses the same analytics capability check; the remaining recent-reports panel spans that row. This was verified again in the browser after rebuilding.
- Completing an assigned visit captured quantity, expense and pest counts without charge/unit-cost fields. Re-entering as Owner retained all ten visits and showed four reports, proving the scoped Technician screen did not overwrite other records.
- A two-finding assessment selected separate areas, services and two products per finding. An incomplete second row rejected the whole save and preserved both rows. After correction, both findings and their products appeared in the detail. General instructions remained independent of the first finding's note.
- Supervisor scheduling changed the selected service and updated description/products without accessing absent pricing inputs.
- Cumulative All accounts showed ten visits, four completed reports and two assessments in the disposable workspace. Abenson/Pasig filtering yielded two visits, one report and one inspection; both findings and both kinds of notes appeared.
- Supervisor PDF preview used the existing logo masthead, account/date blocks and acknowledgment. No currency, financial band or CSV control appeared. The final printable findings use report-style narrative sections. The print action invoked the native browser print interface; actual PDF saving was not completed.
- At a 375-pixel viewport, the cumulative page and PDF-preview dialog fit without document/dialog horizontal overflow. The original logo loaded. Temporary viewport overrides were reset afterward.
- Analytics identified illustrative seeds and service-report sources, including the newly entered QA count, with Cockroaches, Rodents and Flying insects represented. No financial fields appeared for Supervisor.
- Sign out cleared the dialog contents and returned to the demo sign-in screen; refresh also ended the demo session while retaining saved records.

Evidence: [branded cumulative preview](screenshots/cumulative-pdf-preview.jpg), [multiple ocular findings](screenshots/ocular-multiple-findings.jpg). Source records in these screenshots are synthetic.

## Limits

Public sample logins preview workflows; they do not secure browser data. Server authentication/authorization, synchronized persistence and multi-user acceptance remain separate work. No real client data, signature, reminder or payment was created. Native Save as PDF pagination, physical printing, physical devices and screen readers have not been accepted. The native print window was minimized and unavailable to supported native controls; the blocked disposable browser tab was closed without touching owner tabs.

## Hosted acceptance

The existing Git-connected Vercel deployment is verified separately after pushing main. Results are appended here after that deployment is live.
