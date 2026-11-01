---
title: Zealpro architecture
date: 2026-11-01
tags:
  - zealpro
  - architecture
---

# Zealpro architecture

[[Project]] uses three small native modules. `data.js` owns controlled vocabularies and sample fixtures. `model.js` owns state invariants. `app.js` owns view rendering, native dialogs, URL navigation and storage feedback.

## Connected workflow

An assessment may reference an existing client branch or an unenrolled prospect. Enrollment links that assessment to the new branch. Scheduling reserves material stock and checks technician conflicts. Completing a service validates all inputs before changing stock, visit status and report records. Completion also creates a local service receivable with an optional `visitId` link on the invoice record. Payments update its balance independently of fulfillment. These local records do not issue legal tax invoices.

`summary()` computes overview figures from visits and invoices. `availableStock()` subtracts every estimated product allocation on unfulfilled visits. `completeVisit()` validates all actual product lines before deducting stock and creating a report; a second completion is rejected. `reviseReport()` adjusts stock by the usage difference and updates the linked service charge only when it is not below amounts already collected. `saveService()` and `saveProduct()` edit definitions; `setCatalogActive()` archives them without deleting references. `calendarRange()` and `calendarProfit()` calculate scoped contribution totals from snapshots. `migrateState()` preserves older records; `validateState()` checks the resulting version-two state before use.

An assessment references a stable service ID while retaining the original recommendation text. Renaming a service therefore does not change which definition is scheduled. An archived or unidentified recommendation requires an explicit owner choice.

## Payment standing

`serviceDueDate()` adds 30 calendar days to the delivery/report date using UTC date arithmetic. `paymentSummary()` derives unpaid, partially paid, paid or overdue status and countdown from the captured invoice balance, due date and sample status date. Day 30 remains payable; overdue starts the following day. A zero-charge service has no outstanding balance.

Older account invoices are preserved without guessed service links. `linkServicePayment()` requires a financially confirmed completed report and an explicit owner billing review in the UI. It can link only an unlinked invoice for the same client and exact charge, or create a new service balance. Aggregate invoices covering multiple services require separate reconciliation. `validateState()` rejects duplicate service links, mismatched clients or mismatched confirmed charges. See [[Project]] and `docs/QA_SERVICE_PAYMENTS.md`.

## Graphify

The local AST source map in `graphify-out/graph.json` and `graphify-out/graph.html` supports navigation. Query it with:

```powershell
graphify query "completeVisit materials reports inventory" --budget 1600
```

The map covers `src/` only. It does not claim semantic extraction of the PDF or photographs. The source files and SRS remain authoritative. Automatic community labeling was unavailable because the configured Claude command was not logged in; source navigation itself succeeded. No token-saving claim is made.

## Production seam

Replace localStorage mutations with authenticated transactional server operations before any real use. Preserve validation, stock-delta handling, captured costs and duplicate-submission protection at the server boundary. Multiple product lines and cost snapshots exist locally; role permissions, durable correction history, multiple personnel and approved report/invoice rules remain production work.
