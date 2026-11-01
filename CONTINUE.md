# Continue Zealpro

Read `PROJECT_PREFERENCES.md` and `HANDOFF.md` first. The current branch is `main`. The backend and client-edit work through `531488c` has been fast-forward merged from `feature/local-database`; the earlier UI baseline is `f9d221b`.

Local database/API foundation is verified with 39 passing tests. The live backend at port 4176 owns ignored `.local/db`. Read `docs/LOCAL_DATABASE.md` before database administration. The presentation UI still saves browser-local records; preserve existing owner data and do not infer that old Node processes have the new API.

Client editing and optional person/role/phone/email fields are implemented on this branch; see `docs/QA_CLIENT_EDIT.md`.

Next milestone: explicit UI persistence cutover, command retry/conflict recovery and reviewed legacy import. Hosted provider provisioning, authentication and live integrations remain separate work.

Year calendar and logo-guided white/neutral refinement are implemented; see `docs/QA_CALENDAR_REFINEMENT.md`. All four desktop calendar/detail panels align, the day action fills its card, and outside-month cells have a distinct fill. Draft directly on `main`; verify, commit and push without creating feature branches.
