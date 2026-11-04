# Continue Zealpro

## Updated requirements UI: 2026-11-04

The owner's updated 11-page PDF supersedes the provisional role allocation. Four roles now use five public accounts: Owner, Administrator, Supervisor 1, Supervisor 2 and Technician. Field scope combines team membership, branch mapping and co-assignment. Administrator sees commercial values without margins; Supervisor sees assigned material costs/expenses without commercial figures; Technician sees quantities and personal expense submissions only.

Browser-only `src/presentation.js` adds draft/submission/return/approval/amendment histories, all-personnel scheduling/conflicts, cancellation/reservations, stock movements/requests, pending/proof/verified/reversed payments, simulated reminders, profiles/team/activation/delegation, pricing requests and client lifecycle. `src/workspace-ui.js` integrates new workspace panels; the app now has eleven destinations. Submission posts stock once, approval creates billing, correction applies net usage and staged amended charges wait for approval. Existing core/backend files and SQL migrations remain unchanged; full browser state persists with presentation metadata, never a scoped replacement.

All 90 tests passed, including actual template/controller checks for five profiles and eleven screens, isolated DB regressions and new policy/workflow cases. Independent reviews and scoped re-reviews resolved expense ownership, early billing, cross-team personnel, legacy contribution/linking and staged-charge correction issues. See `docs/QA_UPDATED_REQUIREMENTS_UI.md` and `docs/ROLES_AND_REPORTS.md` for current scope, credentials and acceptance limits.

Computer Use stopped current browser QA because the Windows browser URL could not be identified safely. No substitute browser automation was used. Current visual/mobile acceptance and saved-PDF pagination remain unverified. No real reminders, invitations, credentials, payments, hosted Auth/RLS/storage or migrations were created. The Owner explicitly requested UI-first work; backend integration remains deferred. The updated PDF is private, unchanged and excluded from Git/static output. The static artifact now contains fourteen files.


Read `PROJECT_PREFERENCES.md` and `HANDOFF.md` first. The current branch is `main`. The backend and client-edit work through `531488c` has been fast-forward merged from `feature/local-database`; the earlier UI baseline is `f9d221b`.

Latest implementation: three public demo roles, cumulative PDF reports matching the existing report layout, source-aware pest charts and multiple ocular findings. Read `docs/ROLES_AND_REPORTS.md` for credentials, the proposed SRS permission matrix and usage; `docs/QA_ROLES_REPORTS_OCULAR.md` has current evidence. All 63 tests pass. Build output is twelve browser files. Role previews are not secure authentication; the local API remains unauthenticated/loopback-only. UI saves must always retain the full workspace, never a scoped view. Saved-PDF pagination remains unverified.

Live acceptance: `51f3e76` and `1d60430` pushed to main; all twelve assets match Git on the existing Vercel domain, private/API paths are 404, and all three role sign-ins plus cumulative PDF copies passed connected-browser checks. No live operational records were changed.

Local database/API foundation is verified with 41 passing tests. The live backend at port 4176 owns ignored `.local/db`. Read `docs/LOCAL_DATABASE.md` before database administration. The presentation UI still saves browser-local records; preserve existing owner data and do not infer that old Node processes have the new API.

Client editing and optional person/role/phone/email fields are implemented on this branch; see `docs/QA_CLIENT_EDIT.md`.

Next milestone: explicit UI persistence cutover, command retry/conflict recovery and reviewed legacy import. Hosted provider provisioning, authentication and live integrations remain separate work.

Year calendar and logo-guided white/neutral refinement are implemented; see `docs/QA_CALENDAR_REFINEMENT.md`. All four desktop calendar/detail panels align, the day action fills its card, and outside-month cells have a distinct fill. Draft directly on `main`; verify, commit and push without creating feature branches.

Latest visual authority: the owner screenshot restores navy navigation, lime selection, blue actions and white working panels. Read `design.md` and `docs/QA_BRAND_RESTORATION.md`; preserve this scheme unless the owner changes it. Calendar and mobile usability fixes remain implemented.

Vercel hosting: `npm run build` creates browser-only `dist/`, and `vercel.json` selects Other with that output. The local Node/PGlite API is deliberately excluded. Read `docs/VERCEL_HOSTING.md` before changing hosting or retrying the existing project; preserve browser-local records.

Live acceptance after `0814dd0`: https://zealpro-demo.vercel.app/ returns 200; static assets, security headers, private-path 404s and browser Year/refresh checks passed. This is the browser-local presentation, not a hosted database deployment.

## Updated UI hosted acceptance

Implementation `74f7dbc` is pushed to main. All fourteen browser assets match Git on https://zealpro-demo.vercel.app/; private/API paths and both requirements PDFs return 404. Ninety tests pass. Current browser/mobile/PDF pagination acceptance remains blocked by Computer Use URL safety verification. No backend integration occurred. See `docs/QA_UPDATED_REQUIREMENTS_UI.md`. The user's session transcript remains untracked and unpublished.

## Login collage refresh

The login now pairs a clearer sign-in form and demo-role selector with three photographs extracted unchanged from the owner-supplied company presentation. The collage covers a site visit, hygiene inspection and silo work; the original logo/navy/lime palette remains. A finite entrance animation respects reduced-motion preference. The form comes first on narrow screens, and choosing a sample role fills public credentials without signing in. Manual credentials and activation checks remain intact.

The two reference decks are unchanged and Git-ignored; only three allowlisted JPEGs are public. Static output now contains seventeen files. Source hashes and provenance are in `docs/SOURCE_MANIFEST.json` and `docs/QA_LOGIN_REFRESH.md`. Full regression and focused login/hosting/HTTP checks passed; independent source review resolved an intrinsic portrait-image sizing risk by positioning photos inside layout-owned frames. Current browser visual/crop/mobile/animation acceptance remains unverified because Computer Use stopped on Windows URL safety verification. No backend business logic or owner records changed.
