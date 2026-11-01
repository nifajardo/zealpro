# Zealpro operations workspace

A local browser demonstration of the Zealpro Web-Based Management System. The supplied SRS, Zealpro service paperwork and original logo informed the interface. All operational records, staff, account examples, prices and pest counts are illustrative. A persistent local PostgreSQL/API foundation is now available; the presentation UI continues to use browser-local records until a separate persistence cutover. See [local database setup and contract](docs/LOCAL_DATABASE.md).

## Run

Requires Node.js 22 or newer and npm. Install the two pinned local database packages with `npm ci`. No Docker, hosted account, API key or environment file is required.

```powershell
cd D:\zealpro
npm ci
npm start
```

Open **http://127.0.0.1:4173**. The server listens only on loopback. Keep the terminal running during the presentation. `npm run dev` runs the same server; reload the browser after source edits.

If port 4173 is occupied:

```powershell
$env:PORT = '4174'
npm start
```

The server initializes a local database in `.local/db` and exposes `/api/health`; startup never seeds or overwrites existing data. To populate only a new empty database with illustrative records, run `npm run db:seed` before starting the server. Offline database commands require the server to be stopped.

There is no compilation or production build step. The browser loads native JavaScript modules. The server exposes an explicit allowlist of application assets; it does not expose the repository or source paperwork.

## Presentation walkthrough

1. **Services and products:** open **Products & stock → Define product** to add a name, description, unit, unit cost, opening quantity and reorder level. Open **Services → Define service** to set a description, default charge, planned expenses and multiple estimated product quantities. Definitions can be edited, archived and restored; history is retained.
2. **Ocular visits:** create an assessment for a new prospect, using the problem, solution and material lists. Select **Enroll client** to carry its account and branch into the service agreement. Existing branches can also be assessed directly.
3. **Clients & branches:** select **Edit details** in a row or client profile to update the account, branch, address, agreement and optional contact person, role, phone and email. Search also matches contact details. Saving keeps the branch ID and existing service/payment records; previously captured charges remain unchanged.
4. **Schedule:** switch between Year, Month, Week and Day. Year shows twelve equal month cards with month totals; select a card to open that month. Profit totals cover the displayed range; selected-day details sit on the right at desktop widths. Select a service definition to copy its charge, planned expenses and product estimates into a new visit. Adjust those values before saving. Insufficient available stock and technician conflicts are rejected.
5. **Actual reporting:** open Northpoint Residences’ 11:00 service and select **Record service report**, or start from **Service reports → Record service report**. Enter actual products and quantities, actual unit costs, actual charge, expenses and findings. Add different products or remove unused products. Completion deducts actual usage once.
6. **Service reports:** compare estimated and actual quantities in the report. **Edit actual usage** corrects the report and adjusts stock by the difference. Charges and product costs are captured, so later catalog edits do not rewrite past profits. The print button opens the browser print flow; pagination remains unverified. Signatures are explicitly uncollected.
7. **Products & stock:** inspect on-hand, allocated and available quantities. Restock the low-stock gel bait. Referenced units cannot be changed; products required by active recipes or open visits cannot be archived.
8. **Billing & collection:** completing a service creates a linked local payment record due 30 calendar days after its delivery date. Service status remains **Completed** while payment moves through **Unpaid**, **Partially paid**, **Paid** or **Overdue**. Calendar and service views say **Awaiting payment** or **Payment overdue** and show a balance/countdown. Payment status uses the fixed sample date, 2 November 2026. Existing invoice due dates and payments are retained. Older completed services without an invoice link show **Payment not linked**; open the visit and select **Review payment link** after confirming report financials. Link a matching single-service invoice or explicitly confirm a new balance after reviewing existing billing. Consolidated account invoices require separate reconciliation. No money moves and no reminder is sent.
9. **Pest analytics:** filter by client branch and inspect dated observations. Missing observations remain gaps. November is partial; these sample counts do not demonstrate treatment effectiveness.

Select **Demo guide → Reset sample data → Reset sample records** to restore the starting dataset. This resets only the app’s localStorage key, `zealpro.demo.v1`, on the current origin.

## Checks

```powershell
npm test
npm run check
git diff --check
```

Tests live in `tests/*.test.js`, use Node’s built-in test runner, and need no running development server. The HTTP tests launch their own ephemeral loopback server. See [calendar and brand QA](docs/QA_CALENDAR_REFINEMENT.md), [client editing QA](docs/QA_CLIENT_EDIT.md), [database QA evidence](docs/QA_LOCAL_DATABASE.md), [payment QA evidence](docs/QA_SERVICE_PAYMENTS.md) and [revision 2 QA](docs/QA_REVISION2.md) for current coverage and remaining verification limits.

## Profit and saved records

Theoretical profit is quoted service charge minus estimated product costs and planned expenses for every service in the displayed calendar range. Actual profit is actual service charge minus recorded product costs and actual expenses for financially confirmed completed reports. These are contribution figures before unrecorded overhead and tax, independent of payment collection. Variance compares the same completed services’ actual profit with their own estimates. A period with no confirmed reports displays **Not recorded**.

Existing version-one records migrate in memory without discarding visits, clients, stock or reports. Before the first upgraded save, the old raw value is preserved under `zealpro.demo.v1.backup` (or a timestamped backup when necessary). A failed backup prevents overwriting the original store. Legacy theoretical estimates use current product costs and zero unrecorded planned expenses; a notice labels that limitation. Old reports require charge/cost review before their profits count as actual; historical prices were not captured in version one. Previously permitted fractional piece balances and quantities are retained and flagged, while new piece entries require whole numbers.

## Layout

```text
public/                 HTML, token stylesheet, responsive styles and public assets
public/assets/          Unmodified supplied logo, locally served fonts and font license
src/data.js             Fixed demonstration date, controlled vocabularies and sample records
src/model.js            Catalogs, migration, profit ranges, reporting, stock and payments
src/app.js              Nine views, product-line forms, calendar and browser persistence
backend/                Local PostgreSQL lifecycle, SQL migrations, transaction repository/API and exports
.local/                 Ignored database and private backups
server.mjs              Dependency-free loopback server with a file allowlist
tests/                  State invariants and HTTP exposure tests
docs/                   Design, implementation plan, QA, screenshots and SRS traceability
knowledge/              Obsidian-compatible project notes
graphify-out/           Generated local source-navigation graph
HANDOFF.md              Verified state, decisions, limits and next work
```

The SRS, logo and three original reference photographs remain untouched at the repository root. Client requirements and signed reference paperwork are excluded from the public Git repository; obtain those files separately for source review. The application serves a byte-identical copy of the logo, not the paper photographs or their signatures.

## Demonstration boundary

This is not a production system. Changes persist only in the current browser and origin; tabs do not coordinate concurrent edits. Do not enter real personal, financial or confidential client data. The local API/backend foundation is separate from the browser UI. There is no production login, role authorization, live reminder delivery, payment processing, proof upload or customer signature capture. Backend command receipts protect retries but are not a complete business audit trail. Scheduling reserves a fixed one-hour window and treatment completion is same-day. Up to 50 distinct products can be planned or reported per service. Client agreements are demonstration fields, not signed contracts. Billing uses sample account invoices and linked service receivables; these are not issued tax invoices. Legal invoice issuance, tax rules and recurrence need client validation.

The SRS spells the treatment category **Gel bathing**. The demo preserves it. Confirm this terminology with the client before production.

## Design and assets

- Brand: the supplied Zealpro logo defines navy actions, cyan calendar highlights and green completion states on white surfaces. Darker accent shades preserve text contrast.
- Design workflows: Taste achromatic-ledger app refinement and Hallmark app rules; the supplied brand overrides the dealt theme colors.
- Typeface: General Sans, supplied by [Fontshare](https://www.fontshare.com/fonts/general-sans), downloaded from the official Fontshare API. The unmodified license is included at `public/assets/General-Sans-FFL.txt`.
- Reference mapping: [SRS traceability](docs/SRS_TRACEABILITY.md).
- Current refinement: [overview](docs/screenshots/overview-after-refinement.png), [Year calendar](docs/screenshots/calendar-year-after-refinement.png) and [calendar/detail alignment](docs/screenshots/calendar-detail-after-refinement.png). Earlier screenshots: [workspace](docs/screenshots/overview-desktop-v2.png), [actual-product entry](docs/screenshots/report-actual-entry-v2.png), [phone calendar](docs/screenshots/calendar-phone-v2.png), [phone report form](docs/screenshots/report-phone-entry-v2.png). The live calendar contains the complete desktop layout; additional full-page capture was unavailable.
