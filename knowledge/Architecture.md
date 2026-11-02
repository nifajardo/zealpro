---
title: Zealpro architecture
date: 2026-11-01
tags:
  - zealpro
  - architecture
---

# Zealpro architecture

[[Project]] uses five native modules. `data.js` owns controlled vocabularies and sample fixtures. `model.js` owns state invariants. `access.js` owns public demo roles, view scoping and action guards. `reporting.js` owns cumulative report selection and pest-count provenance. `app.js` owns view rendering, native dialogs, URL navigation and storage feedback. Role-scoped `screen` data are read-only view input; mutations and persistence always use the full `state` workspace.

## Connected workflow

An assessment may reference an existing client branch or an unenrolled prospect. Enrollment links that assessment to the new branch. Scheduling reserves material stock and checks technician conflicts. Completing a service validates all inputs before changing stock, visit status and report records. Completion also creates a local service receivable with an optional `visitId` link on the invoice record. Payments update its balance independently of fulfillment. These local records do not issue legal tax invoices.

`summary()` computes overview figures from visits and invoices. `availableStock()` subtracts every estimated product allocation on unfulfilled visits. `completeVisit()` validates all actual product lines before deducting stock and creating a report; a second completion is rejected. `reviseReport()` adjusts stock by the usage difference and updates the linked service charge only when it is not below amounts already collected. `saveService()` and `saveProduct()` edit definitions; `setCatalogActive()` archives them without deleting references. `CALENDAR_VIEWS` defines the four supported modes. `calendarRange()` and `calendarProfit()` calculate scoped contribution totals from snapshots. `moveCalendar()` handles whole-period movement and clamps leap-day/month-end selections; `yearCalendar()` renders monthly drill-down using those existing totals. `migrateState()` preserves older records; `validateState()` checks the resulting version-two state before use.

An assessment references a stable service ID while retaining the original recommendation text. Renaming a service therefore does not change which definition is scheduled. An archived or unidentified recommendation requires an explicit owner choice.

## Payment standing

`serviceDueDate()` adds 30 calendar days to the delivery/report date using UTC date arithmetic. `paymentSummary()` derives unpaid, partially paid, paid or overdue status and countdown from the captured invoice balance, due date and sample status date. Day 30 remains payable; overdue starts the following day. A zero-charge service has no outstanding balance.

Older account invoices are preserved without guessed service links. `linkServicePayment()` requires a financially confirmed completed report and an explicit owner billing review in the UI. It can link only an unlinked invoice for the same client and exact charge, or create a new service balance. Aggregate invoices covering multiple services require separate reconciliation. `validateState()` rejects duplicate service links, mismatched clients or mismatched confirmed charges. See [[Project]] and `docs/QA_SERVICE_PAYMENTS.md`.

## Graphify

The local AST source map in `graphify-out/graph.json` and `graphify-out/graph.html` supports navigation. Query it with:

```powershell
graphify query "completeVisit materials reports inventory" --budget 1600
```

The map now covers application/backend/server code and supported repository sources. Optional SQL AST extraction is unavailable, and some test/CLI sources expose no symbols; consult migration SQL and runtime tests directly. It does not claim semantic extraction of the private PDF or photographs. The source files and SRS remain authoritative. Automatic community labeling was unavailable because the configured Claude command was not logged in; source navigation itself succeeded. No token-saving claim is made.

## Local backend foundation

`backend/database.mjs` owns one embedded PostgreSQL process, its filesystem lock and checksum-verified SQL migrations. `workspace.mjs` reconstructs domain arrays from relational records and executes existing model operations inside one transaction with a revision and durable idempotency receipt. `api.mjs` validates local Host/Origin and HTTP input boundaries. `backup.mjs` and `cli.mjs` provide explicit data import and SQL export. Storage sits in ignored `.local/`; no backend files are static assets.

The current UI remains a separate browser-local demonstration. Its later cutover must send commands to the server rather than upload arbitrary post-mutation snapshots, preserve ambiguous-request IDs across retry, and explicitly review existing browser imports before replacing a shared workspace.

The local engine reports PostgreSQL 18.6. SQL export restores locally with schema, data and request receipts; provider major-version compatibility still needs staging acceptance. JSON import is a logical data operation and retains destination receipts rather than restoring the source receipt ledger.

## Production seam

Replace localStorage mutations with authenticated transactional server operations before any real use. Preserve validation, stock-delta handling, captured costs and duplicate-submission protection at the server boundary. Multiple product lines and cost snapshots exist locally; role permissions, durable correction history, multiple personnel and approved report/invoice rules remain production work.

## Static hosting seam

`npm run build` executes `scripts/build.mjs` and copies an explicit browser-only allowlist to `dist/`. Vercel uses Other, the build command and `dist` from `vercel.json`; no function wraps the local server. Hash navigation does not need catch-all rewrites. Private files, local database state and backend code stay outside the artifact. See [hosting setup](../docs/VERCEL_HOSTING.md).
