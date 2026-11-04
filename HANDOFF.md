# Zealpro handoff

## Updated requirements UI: 2026-11-04

The owner's updated 11-page PDF supersedes the provisional role allocation. Four roles now use five public accounts: Owner, Administrator, Supervisor 1, Supervisor 2 and Technician. Field scope combines team membership, branch mapping and co-assignment. Administrator sees commercial values without margins; Supervisor sees assigned material costs/expenses without commercial figures; Technician sees quantities and personal expense submissions only.

Browser-only `src/presentation.js` adds draft/submission/return/approval/amendment histories, all-personnel scheduling/conflicts, cancellation/reservations, stock movements/requests, pending/proof/verified/reversed payments, simulated reminders, profiles/team/activation/delegation, pricing requests and client lifecycle. `src/workspace-ui.js` integrates new workspace panels; the app now has eleven destinations. Submission posts stock once, approval creates billing, correction applies net usage and staged amended charges wait for approval. Existing core/backend files and SQL migrations remain unchanged; full browser state persists with presentation metadata, never a scoped replacement.

All 90 tests passed, including actual template/controller checks for five profiles and eleven screens, isolated DB regressions and new policy/workflow cases. Independent reviews and scoped re-reviews resolved expense ownership, early billing, cross-team personnel, legacy contribution/linking and staged-charge correction issues. See `docs/QA_UPDATED_REQUIREMENTS_UI.md` and `docs/ROLES_AND_REPORTS.md` for current scope, credentials and acceptance limits.

Computer Use stopped current browser QA because the Windows browser URL could not be identified safely. No substitute browser automation was used. Current visual/mobile acceptance and saved-PDF pagination remain unverified. No real reminders, invitations, credentials, payments, hosted Auth/RLS/storage or migrations were created. The Owner explicitly requested UI-first work; backend integration remains deferred. The updated PDF is private, unchanged and excluded from Git/static output. The static artifact now contains fourteen files.

## Previous milestone: roles, cumulative PDF and ocular findings

Owner, Supervisor and Technician public demo sign-ins are implemented, with capability/route/action/record guards and protected financial inputs. The SRS hierarchy is mapped provisionally to those three roles; the private SRS has no detailed permission matrix. Technician sees assigned work; Supervisor operates across branches without financial visibility; Owner manages financials, agreements and catalogs. Sample credentials and the exact matrix are in `docs/ROLES_AND_REPORTS.md`.

Service reports now includes cumulative account/branch/date reporting with **Apply filters → Generate PDF report → Print / save PDF**. It uses the existing branded report masthead/account/acknowledgment layout, with operational copies for Supervisor and contribution figures for Owner. CSV was removed at the owner's explicit request. Each inspection supports 1–20 independent findings and multiple products; legacy fields and general notes are preserved. Pest graphs identify their historical sample and saved service-report sources; qualitative inspection findings do not add counts.

`src/access.js` and `src/reporting.js` join the browser allowlist; the static build now contains twelve files. All 63 tests, syntax/build/whitespace checks and dependency audit pass. Connected Brave role, foreign-route, quantity/completion, multi-finding validation, account-filter, source and narrow-preview checks passed on disposable origin 4490. Independent domain/UI re-review found no outstanding Important/Critical issues. Details and screenshots are in `docs/QA_ROLES_REPORTS_OCULAR.md`.

These are browser-local demo role previews, not secure hosted authentication. No password/token is persisted; reload signs out while records remain. The full workspace is retained on scoped saves. The unauthenticated local API remains loopback-only and unchanged in access policy. Native print was invoked, but PDF saving/pagination could not be accepted because its minimized native browser window was inaccessible to supported controls. Owner data, persistent database and source paperwork were not reset. Production authentication/server authorization and a reviewed persistence cutover remain the next security milestone.

Implementation `51f3e76` and correction `1d60430` were pushed directly to main. The existing Vercel domain serves their twelve browser assets byte-identically to Git; private/API paths are 404 and security headers remain present. Live Brave verified all three sign-ins, Owner financial/Supervisor operational PDF copies and Technician restrictions without modifying live records. The final source-navigation graph has no dangling endpoints or generated/private workspace nodes; SQL AST support remains unavailable. Only the disposable QA static server on 4490 was stopped. Latest evidence is `docs/QA_ROLES_REPORTS_OCULAR.md`.

## Current milestones

The UI milestone is committed and pushed as `f9d221b` on `origin/main`. It includes all six owner revisions, the calendar scroll fix, and separate completion/payment standing with 30-day service terms. The backend and client-edit commits through `531488c` were fast-forward merged from `feature/local-database` into `main` at the owner's request. `main` is the current working branch.

The local PostgreSQL/database API foundation is complete. This milestone deliberately leaves the presentation UI browser-local; it does not silently replace existing localStorage records or mix browser and server writes. The next milestone is an explicit UI persistence cutover with reviewed import and retry recovery.

## Client editing follow-up

The local UI now supports Edit details from client rows and profiles. The shared form edits account/branch/address, agreement values and optional contact person, role, phone and email. Existing contact strings remain roles; no person names are inferred. Search includes contacts and reminder previews use the named person/email when available. Edits preserve the client ID and linked historical charges/payments. Duplicate branches, invalid contacts and assessment relinking are rejected before mutation. The backend client command now passes its optional client ID through the same domain operation; client JSONB needs no SQL migration.

Browser checks used isolated port 4177 and restored only its sample records. The persistent API on 4176 was restarted gracefully to load the edit command. Current evidence is `docs/QA_CLIENT_EDIT.md`; the edit UI remains browser-local. Client-edit source changes are integrated into `main`.

## Calendar and brand refinement

The calendar now supports Year, Month, Week and Day. Annual totals and monthly drill-down reuse captured contribution calculations. Shared `moveCalendar()` clamps leap-day and month-end movement and rejects unsupported bounds. At desktop widths, both calendar and detail frames are 720 pixels high with internal overflow. On narrow screens they stack naturally. The day action fills its card, and white day cells, darker rules and a separate outside-month fill make empty spaces visible. Calendar date selection preserves page scroll.

The supplied logo remains unchanged and defines navy actions, cyan data accents and green completion states on white chrome. Taste's achromatic-ledger app direction was adapted to that explicit brand instruction. Evidence, screenshots, contrast, independent review and limitations are in `docs/QA_CALENDAR_REFINEMENT.md`. All 39 tests and syntax checks pass. Owner data and the persistent database were not reset; only disposable QA data on port 4389 was restored after a large-value check.

Drafting work now stays directly on `main`, followed by verified commit/push. Do not create feature branches or ceremonial merges. This refinement changes no storage schema or persistence boundary.

## Owner reference palette restoration

The latest owner screenshot supersedes the lighter chrome and exploratory hue direction. Navy sidebar, vivid lime active navigation, navy actions, cool grey canvas and white working panels are restored. `design.md` records this shared system. The original logo remains byte-identical and now declares its natural image dimensions. All nine routes and existing records/handlers remain intact.

Shared interface improvements include clearer type and table spacing, a contained mobile ledger with a visible 44-pixel row action, inset focus rings, 960-pixel menu collapse and two-column summary metrics below 1100 pixels. Calendar Year/Month/Week/Day still use equal 720-pixel desktop frames, full-width day actions, visible outside cells and preserved scroll. Final evidence is `docs/QA_BRAND_RESTORATION.md`; independent visual review says ship. All 39 tests pass. UI persistence remains browser-local and no records were reset.

## Vercel static hosting

The repository now has an explicit static hosting build. `npm run build` copies twelve browser assets into ignored `dist/`; `vercel.json` selects Other and that output directory. No local server, PGlite instance or API is deployed. The UI remains browser-local. `docs/VERCEL_HOSTING.md` records the existing `zealpro-demo.vercel.app` project, repository-root settings, fragment routing, response headers and troubleshooting.

Before this change the production URL returned HTTP 500 `FUNCTION_INVOCATION_FAILED`; the precise exception was not available from public responses. The static deployment removes the local server invocation path. All 41 tests, syntax checks and the static build pass. Two artifact/config regression tests were added, including stale/private canaries and byte-identical browser assets. The built site was verified in Brave: overview, calendar, Year and fragment refresh work with no browser errors; static private/API paths return 404. Independent review found no must-fix code issues; the README and CLI-upload boundary were corrected. Public isolation comes from the output allowlist, not an assumption that Git deployments honour CLI ignore rules. After pushing `0814dd0`, the existing production URL returned 200; all runtime assets matched committed Git blobs, configured security headers were present and API/private paths returned 404. Live Brave navigation and Year refresh passed with no warnings/errors. See the live acceptance section and screenshot in `docs/VERCEL_HOSTING.md`.

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

- Current `npm test`: 63 passed, zero failed. `npm run check`: passed. `npm audit --omit=dev`: zero vulnerabilities. Earlier milestone counts below are historical evidence.
- Tests cover disk reopen, exclusive ownership, migration drift, relational constraints, atomic completion/payment, exact replay, stale concurrent commands, import preservation, SQL write-failure rollback, and portable SQL restore with receipt replay.
- HTTP checks cover foreign origins, Host rebinding, body type/size, unsupported commands, private paths and malformed URLs.
- Independent review found one Important issue: malformed HTTP request targets crashed URL parsing and left a recovery lock. A regression reproduced ECONNRESET; guarded parsing now returns 400 and subsequent health requests succeed. Reviewer confirmed resolution; no outstanding Important/Critical findings.
- Live API smoke matched the stored seeded counts above. Previous UI/desktop/narrow-browser evidence remains in `docs/QA_SERVICE_PAYMENTS.md` and `docs/QA_REVISION2.md`; this backend phase changes no UI flow.
- Current backend evidence: `docs/QA_LOCAL_DATABASE.md`. Contract/provider references: `docs/LOCAL_DATABASE.md`.

## UI and record preservation

Nine presentation destinations cover overview, scheduling, service definitions, assessments, clients, reporting, products/stock, collection and pest analytics. Visits retain estimates; reports retain actual quantities/costs and allow stock-delta corrections. Calendar Year/Month/Week/Day contribution is independent of payment collection. Service fulfillment remains Completed while its linked balance is unpaid, partial, paid or overdue. Older unlinked services require explicit payment-link review; no aggregate invoice is guessed into a service relationship.

Browser storage remains `zealpro.demo.v1`, schema version two. Earlier version-one raw data is backed up before upgraded/recovery save. Legacy report financials require confirmation; reconstructed estimates and fractional piece history remain flagged. Payment calculations still use the fixed November 2, 2026 sample date.

## Skills and source navigation

Caveman ultracave and Ponytail full remain active. Project notes use Obsidian Markdown under `knowledge/`; MemPalace continuity is scoped to wing `zealpro`. Graphify now indexes application, server and backend code. Optional SQL AST extraction is unavailable (`tree_sitter_sql` is not installed), and some test/CLI files expose no symbols; the migration SQL and runtime tests remain authoritative. Community labels are local; no unauthenticated provider retry was made.

The host exposes no model switch or dedicated Chrome DevTools MCP. Earlier visual QA used connected Brave controls. No capability is claimed for physical-phone or screen-reader acceptance.

## Boundaries and next step

This is a single-computer development backend with no authentication or role enforcement; it must not be exposed publicly. Its first repository implementation rewrites one small workspace per transaction; targeted persistence is required before multi-user scale. There are no live reminders, real payment processing, proof uploads, signatures, legal tax invoices or complete business audit log.

The local engine is PostgreSQL 18.6. SQL restore was tested against a fresh local engine, not Supabase, Neon or an older PostgreSQL major version. Supabase is the provisional role/storage-integrated option, with Neon retained as another PostgreSQL backend. Provider/version/region selection, server PostgreSQL driver, auth/roles and staging migration acceptance remain future work. No hosted service or billable resource was created.

Next: connect UI mutations to server commands with durable same-payload retry, revision-conflict handling and explicit import review. Do not substitute full client-written snapshots for server domain commands. Review billing/tax rules, report financial visibility, recurrence, multiple technicians and the SRS Gel bathing terminology before production decisions.

Origin `nifajardo/zealpro` is public. The SRS and three signed reference photographs remain unchanged locally and ignored by Git. The logo and synthetic UI evidence are versioned. The existing Vercel project serves static browser assets; no hosted database migration occurred.

## Updated UI hosted acceptance

Implementation `74f7dbc` is pushed to main. All fourteen browser assets match Git on https://zealpro-demo.vercel.app/; private/API paths and both requirements PDFs return 404. Ninety tests pass. Current browser/mobile/PDF pagination acceptance remains blocked by Computer Use URL safety verification. No backend integration occurred. See `docs/QA_UPDATED_REQUIREMENTS_UI.md`. The user's session transcript remains untracked and unpublished.

## Login collage refresh

Sidebar scrollbar follow-up: the navigation now uses a thin transparent-track scrollbar with navy thumb, brighter hover/keyboard-focus state, no legacy arrow buttons and forced-colors fallback. Scrolling and stable gutter remain. Static build, whitespace and Hallmark source scan pass; current browser visual verification remains unavailable as documented above. This is a scoped CSS change only.

The login now pairs a clearer sign-in form and demo-role selector with three photographs extracted unchanged from the owner-supplied company presentation. The collage covers a site visit, hygiene inspection and silo work; the original logo/navy/lime palette remains. A finite entrance animation respects reduced-motion preference. The form comes first on narrow screens, and choosing a sample role fills public credentials without signing in. Manual credentials and activation checks remain intact.

The two reference decks are unchanged and Git-ignored; only three allowlisted JPEGs are public. Static output now contains seventeen files. Source hashes and provenance are in `docs/SOURCE_MANIFEST.json` and `docs/QA_LOGIN_REFRESH.md`. Full regression and focused login/hosting/HTTP checks passed; independent source review resolved an intrinsic portrait-image sizing risk by positioning photos inside layout-owned frames. Current browser visual/crop/mobile/animation acceptance remains unverified because Computer Use stopped on Windows URL safety verification. No backend business logic or owner records changed.

## Additional sample technicians — 5 November 2026

Eight technicians now have distinct public demo logins: Marco Reyes, Paolo Santos, Luis Mendoza, Carlo Garcia, Nina Cruz, Adrian Ramos, Bea Torres and Diego Santos. North and South each contain four members. Scheduling, co-personnel, inspection assessor and team controls use the expanded staff list. Login choices and credential rows identify the actual technician; credentials are in docs/ROLES_AND_REPORTS.md.

Existing browser workspaces receive missing profiles and the four new team members once. Existing records, activation/profile overrides and branch mappings remain intact; later Owner team changes are not reseeded. New names have no fabricated jobs. No backend integration occurred. All 93 tests, syntax checks, static build and whitespace checks passed; the template harness exercises all twelve profiles. Browser visual acceptance remains unverified.

## QA imagery, logo and client actions — 5 November 2026

The login now leads with the accepted swabbing portrait, with a non-human facility/equipment image and navy text alongside. Two rejected rear-facing photos are removed from public assets and both allowlists; output contains sixteen files. The sidebar visually centers the unchanged logo by compensating for unequal bitmap margins. Client branch actions now have explicit wrapping, spacing and 44-pixel targets.

All 93 tests, syntax, static build, whitespace and Hallmark source checks passed. Reference originals remain unchanged. Current browser navigation/screenshot controls failed, so visual crops/alignment and iPad/phone acceptance remain unverified. See docs/QA_LOGIN_REFRESH.md and docs/SOURCE_MANIFEST.json. Role and persistence behavior are unchanged; no backend integration occurred.
