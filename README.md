# Zealpro operations workspace

A local browser demonstration of the Zealpro Web-Based Management System. The supplied SRS, Zealpro service paperwork and original logo informed the interface. All operational records, staff, account examples, prices and pest counts are illustrative. A persistent local PostgreSQL/API foundation is now available; the presentation UI continues to use browser-local records until a separate persistence cutover. See [local database setup and contract](docs/LOCAL_DATABASE.md).

## Run

Requires Node.js 22 or newer and npm. Install the two pinned local database packages with `npm ci`. No Docker, hosted account, API key or environment file is required. For a UI-only presentation without starting the existing local API/database, run `npm run build` then `python -m http.server 4494 --bind 127.0.0.1 --directory dist` and open port 4494. Python is only a static preview server; the hosted Vercel version also serves static files.

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

The browser loads native JavaScript modules without compilation. `npm run build` creates an explicit browser-only `dist/` artifact for static hosting. The local server and the hosting build each allowlist application assets; neither publishes the repository or source paperwork.

## Vercel hosting

The repository is configured for **Other**, build command **`npm run build`**, output directory **`dist`**, and repository-root deployment. Vercel serves the browser demonstration without invoking the local Node/PGlite server. No environment variables are required. Local browser records remain on their existing origin; a new hosted origin has its own sample workspace.

See [Vercel setup and function-failure recovery](docs/VERCEL_HOSTING.md) for the existing `zealpro-demo.vercel.app` project, verification and the separate hosted-database milestone.

## Presentation walkthrough

The 4 November updated requirements now define four roles and five public demo accounts. Read [credentials and workflows](docs/ROLES_AND_REPORTS.md). This is a browser-local client presentation; no backend integration or real authentication/delivery is enabled.

1. **Owner** sees company-wide records and contribution after direct job costs; **Administrator** sees commercial operations without margins; **Supervisor 1/2** see assigned operations/costs; **Technician** sees assigned work and personal claims.
2. **Services/products:** Owner maintains services/pricing. Administrator manages products/restock and requests service-rate changes for Owner review. Field users get applicable instructions/quantities and permitted scoped costs.
3. **Ocular visits:** save incomplete drafts, submit independent findings, return with a reason and approve. Only approved recommendations inform enrollment/planning.
4. **Clients & branches:** office roles manage contacts, approved commercial terms and Draft/Active/Archived lifecycle. Field roles get assigned contacts/location/history without agreement terms.
5. **Schedule:** Year/Month/Week/Day remain. Assign a lead and additional personnel; everyone participates in conflicts. Reschedule/cancel with preserved identity/history and safe reservations.
6. **Fieldwork:** Technician saves a draft or submits actual quantities/findings/expense. Submission posts actual use once and releases reservations; billing waits for approval.
7. **Service reports:** Supervisor returns or **Approves & finalizes**. Approved reports lock; authorized amendments preserve versions and apply net stock corrections. Customer signatures remain uncollected.
8. **Cumulative PDF:** choose account/branch/dates, **Apply filters → Generate PDF report → Print / save PDF**. Existing branding remains, with approval/personnel/comparison information. No CSV export. Saved-PDF pagination remains unverified.
9. **Products & stock:** inspect scoped quantities/costs, movement history and stock-adjustment requests. Supervisor requests do not directly change inventory.
10. **Billing:** office roles record pending evidence, optionally attach a local proof up to 1 MB, verify partial payments and review history. Owner can reverse with a reason. Reminder scheduling and delivery/retry logs are explicit simulations; no messages are sent.
11. **Staff & access / Activity:** Owner manages roles, activation, teams and collection delegation. Administrator maintains safe profiles/prepares invitations. Field directory and history are scoped. Invitations/reset are previews only.

Pest graphs combine labeled historical samples and approved report counts, with previous/current branch/pest comparisons. Missing observations remain gaps and do not prove effectiveness. Qualitative ocular findings add no counts.

As Owner, **Demo guide → Reset sample records** resets only the current origin's browser workspace. Do not reset an owner's existing records for QA. Current verification and browser limitations are in [updated requirements QA](docs/QA_UPDATED_REQUIREMENTS_UI.md).

## Checks

```powershell
npm test
npm run check
npm run build
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
src/access.js           Public demo credentials, role capabilities, scope and action guards
src/reporting.js        Cumulative report data, account grouping and pest-source provenance
src/presentation.js     Browser-only approvals, reservations, ledger and demo account workflows
src/workspace-ui.js     Staff/settings/activity and billing/stock workflow panels
src/app.js              Eleven destinations, forms, calendar and browser persistence
backend/                Local PostgreSQL lifecycle, SQL migrations, transaction repository/API and exports
scripts/build.mjs       Explicit fourteen-file static hosting artifact builder
dist/                   Ignored static browser output for Vercel
vercel.json             Static framework/build/output settings and response headers
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

This is not a production system. Changes persist only in the current browser and origin; tabs do not coordinate concurrent edits. Do not enter real personal, financial or confidential client data. Public sample logins and browser role checks are not secure authentication or server authorization. The local API/backend foundation is separate from the browser UI and remains loopback-only. There is no live reminder delivery, payment processing, proof upload or customer signature capture. Backend command receipts protect retries but are not a complete business audit trail. Scheduling reserves a fixed one-hour window and treatment completion is same-day. Up to 50 distinct products can be planned or reported per service. Client agreements are demonstration fields, not signed contracts. Billing uses sample account invoices and linked service receivables; these are not issued tax invoices. Legal invoice issuance, tax rules and recurrence need client validation. See [roles/reporting QA](docs/QA_ROLES_REPORTS_OCULAR.md) for current verification.

The SRS spells the treatment category **Gel bathing**. The demo preserves it. Confirm this terminology with the client before production.

## Design and assets

- Brand: the owner reference screenshot defines navy navigation, lime active selection, blue actions and white working panels on a cool grey canvas. The supplied logo is unchanged. See [design system](design.md).
- Design workflows: Hallmark brand app redesign and Taste app review; the supplied logo and owner screenshot govern the palette.
- Typeface: General Sans, supplied by [Fontshare](https://www.fontshare.com/fonts/general-sans), downloaded from the official Fontshare API. The unmodified license is included at `public/assets/General-Sans-FFL.txt`.
- Reference mapping: [SRS traceability](docs/SRS_TRACEABILITY.md).
- Current palette: [overview](docs/screenshots/brand-restored-overview.jpg), [calendar](docs/screenshots/brand-restored-calendar.jpg), [phone](docs/screenshots/brand-restored-phone.jpg) and [QA](docs/QA_BRAND_RESTORATION.md). Year/calendar alignment evidence remains in [calendar QA](docs/QA_CALENDAR_REFINEMENT.md). Earlier screenshots: [workspace](docs/screenshots/overview-desktop-v2.png), [actual-product entry](docs/screenshots/report-actual-entry-v2.png), [phone calendar](docs/screenshots/calendar-phone-v2.png), [phone report form](docs/screenshots/report-phone-entry-v2.png). The live calendar contains the complete desktop layout; additional full-page capture was unavailable.
