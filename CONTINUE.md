# Continue Zealpro

Read `PROJECT_PREFERENCES.md` and `HANDOFF.md` first. The current branch is `main`. The backend and client-edit work through `531488c` has been fast-forward merged from `feature/local-database`; the earlier UI baseline is `f9d221b`.

Latest implementation: three public demo roles, cumulative PDF reports matching the existing report layout, source-aware pest charts and multiple ocular findings. Read `docs/ROLES_AND_REPORTS.md` for credentials, the proposed SRS permission matrix and usage; `docs/QA_ROLES_REPORTS_OCULAR.md` has current evidence. All 63 tests pass. Build output is twelve browser files. Role previews are not secure authentication; the local API remains unauthenticated/loopback-only. UI saves must always retain the full workspace, never a scoped view. Saved-PDF pagination remains unverified.

Local database/API foundation is verified with 41 passing tests. The live backend at port 4176 owns ignored `.local/db`. Read `docs/LOCAL_DATABASE.md` before database administration. The presentation UI still saves browser-local records; preserve existing owner data and do not infer that old Node processes have the new API.

Client editing and optional person/role/phone/email fields are implemented on this branch; see `docs/QA_CLIENT_EDIT.md`.

Next milestone: explicit UI persistence cutover, command retry/conflict recovery and reviewed legacy import. Hosted provider provisioning, authentication and live integrations remain separate work.

Year calendar and logo-guided white/neutral refinement are implemented; see `docs/QA_CALENDAR_REFINEMENT.md`. All four desktop calendar/detail panels align, the day action fills its card, and outside-month cells have a distinct fill. Draft directly on `main`; verify, commit and push without creating feature branches.

Latest visual authority: the owner screenshot restores navy navigation, lime selection, blue actions and white working panels. Read `design.md` and `docs/QA_BRAND_RESTORATION.md`; preserve this scheme unless the owner changes it. Calendar and mobile usability fixes remain implemented.

Vercel hosting: `npm run build` creates browser-only `dist/`, and `vercel.json` selects Other with that output. The local Node/PGlite API is deliberately excluded. Read `docs/VERCEL_HOSTING.md` before changing hosting or retrying the existing project; preserve browser-local records.

Live acceptance after `0814dd0`: https://zealpro-demo.vercel.app/ returns 200; static assets, security headers, private-path 404s and browser Year/refresh checks passed. This is the browser-local presentation, not a hosted database deployment.
