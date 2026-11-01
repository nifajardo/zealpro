# Continue Zealpro

Read `PROJECT_PREFERENCES.md` and `HANDOFF.md` first. The current branch is `feature/local-database`; the UI baseline `f9d221b` is on `origin/main`.

Local database/API foundation is verified with 36 passing tests. The live backend at port 4176 owns ignored `.local/db`. Read `docs/LOCAL_DATABASE.md` before database administration. The presentation UI still saves browser-local records; preserve existing owner data and do not infer that old Node processes have the new API.

Client editing and optional person/role/phone/email fields are implemented on this branch; see `docs/QA_CLIENT_EDIT.md`.

Next milestone: explicit UI persistence cutover, command retry/conflict recovery and reviewed legacy import. Hosted provider provisioning, authentication and live integrations remain separate work.
