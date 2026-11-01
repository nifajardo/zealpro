# Zealpro handoff

## Current milestones

The UI milestone is committed and pushed as `f9d221b` on `origin/main`. It includes all six owner revisions, the calendar scroll fix, and separate completion/payment standing with 30-day service terms. Current backend work is on `feature/local-database`.

The local PostgreSQL/database API foundation is complete. This milestone deliberately leaves the presentation UI browser-local; it does not silently replace existing localStorage records or mix browser and server writes. The next milestone is an explicit UI persistence cutover with reviewed import and retry recovery.

## Run and live state

- Install with `npm ci` (Node.js 22+). `npm start` runs the loopback server and opens `.local/db` by default. Migrations run on startup; seeding never runs implicitly.
- The new backend owner is currently running at `http://127.0.0.1:4176`. `/api/health` reports ready, PostgreSQL 18.6, and `uiPersistence: browser-local`.
- Older presentation processes on ports 4173/4174/4175 may still serve the UI without the new API. Do not assume a previously running Node process reloads server code. Existing owner records on port 4174 were not reset or imported.
- The persistent database is revision 1 with illustrative 6 products, 6 services, 5 clients, 10 visits, 3 reports, 8 invoices, 1 assessment and 15 observations. JSON and SQL exports were created in ignored `.local/backups/` before its live server started.
- A single process owns `.local/db`; its sidecar lock contains the PID. Stop its owner gracefully before offline CLI commands. Never delete a live owner's lock; recovery instructions are in `docs/LOCAL_DATABASE.md`.

## Backend implementation

`backend/database.mjs` owns PGlite, exclusive filesystem access and checksum-verified SQL migrations. `backend/workspace.mjs` reconstructs ordered domain records from relational tables and runs existing `src/model.js` operations in one transaction. Expected revisions prevent stale overwrites. Durable request receipts prevent exact retry from repeating completion, stock deduction or payment collection.

`backend/api.mjs` exposes local health/workspace/commands/JSON export with Host/Origin, body-size/content-type, command and error guards. `backup.mjs` and `cli.mjs` provide explicit initialization, sample seed only for a new empty workspace, status, backup, reviewed import and SQL export. `.local/` is never served or committed. Applied SQL is immutable; add a new migration rather than editing an applied file.

`npm run db:init`, `db:seed`, `db:status`, `db:backup`, `db:export:sql`, and `db:import` are documented in `docs/LOCAL_DATABASE.md`. Offline CLI commands refuse concurrent access. JSON import validates first and takes a pre-replacement snapshot. JSON is logical domain transfer, not restoration of the source command ledger; SQL export preserves data, migrations, backups and receipts.

## Verification

- `npm test`: 32 passed, zero failed. `npm run check`: passed. `npm audit --omit=dev`: zero vulnerabilities.
- Tests cover disk reopen, exclusive ownership, migration drift, relational constraints, atomic completion/payment, exact replay, stale concurrent commands, import preservation, SQL write-failure rollback, and portable SQL restore with receipt replay.
- HTTP checks cover foreign origins, Host rebinding, body type/size, unsupported commands, private paths and malformed URLs.
- Independent review found one Important issue: malformed HTTP request targets crashed URL parsing and left a recovery lock. A regression reproduced ECONNRESET; guarded parsing now returns 400 and subsequent health requests succeed. Reviewer confirmed resolution; no outstanding Important/Critical findings.
- Live API smoke matched the stored seeded counts above. Previous UI/desktop/narrow-browser evidence remains in `docs/QA_SERVICE_PAYMENTS.md` and `docs/QA_REVISION2.md`; this backend phase changes no UI flow.
- Current backend evidence: `docs/QA_LOCAL_DATABASE.md`. Contract/provider references: `docs/LOCAL_DATABASE.md`.

## UI and record preservation

Nine presentation destinations cover overview, scheduling, service definitions, assessments, clients, reporting, products/stock, collection and pest analytics. Visits retain estimates; reports retain actual quantities/costs and allow stock-delta corrections. Calendar Month/Week/Day contribution is independent of payment collection. Service fulfillment remains Completed while its linked balance is unpaid, partial, paid or overdue. Older unlinked services require explicit payment-link review; no aggregate invoice is guessed into a service relationship.

Browser storage remains `zealpro.demo.v1`, schema version two. Earlier version-one raw data is backed up before upgraded/recovery save. Legacy report financials require confirmation; reconstructed estimates and fractional piece history remain flagged. Payment calculations still use the fixed November 2, 2026 sample date.

## Skills and source navigation

Caveman ultracave and Ponytail full remain active. Project notes use Obsidian Markdown under `knowledge/`; MemPalace continuity is scoped to wing `zealpro`. Graphify now indexes application, server and backend code. Optional SQL AST extraction is unavailable (`tree_sitter_sql` is not installed), and some test/CLI files expose no symbols; the migration SQL and runtime tests remain authoritative. Community labels are local; no unauthenticated provider retry was made.

The host exposes no model switch or dedicated Chrome DevTools MCP. Earlier visual QA used connected Brave controls. No capability is claimed for physical-phone or screen-reader acceptance.

## Boundaries and next step

This is a single-computer development backend with no authentication or role enforcement; it must not be exposed publicly. Its first repository implementation rewrites one small workspace per transaction; targeted persistence is required before multi-user scale. There are no live reminders, real payment processing, proof uploads, signatures, legal tax invoices or complete business audit log.

The local engine is PostgreSQL 18.6. SQL restore was tested against a fresh local engine, not Supabase, Neon or an older PostgreSQL major version. Supabase is the provisional role/storage-integrated option, with Neon retained as another PostgreSQL backend. Provider/version/region selection, server PostgreSQL driver, auth/roles and staging migration acceptance remain future work. No hosted service or billable resource was created.

Next: connect UI mutations to server commands with durable same-payload retry, revision-conflict handling and explicit import review. Do not substitute full client-written snapshots for server domain commands. Review billing/tax rules, report financial visibility, recurrence, multiple technicians and the SRS Gel bathing terminology before production decisions.

Origin `nifajardo/zealpro` is public. The SRS and three signed reference photographs remain unchanged locally and ignored by Git. The logo and synthetic UI evidence are versioned. No hosted deployment or hosted migration occurred.
