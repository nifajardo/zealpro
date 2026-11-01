# Local database QA

Date: November 1, 2026. Scope: local PostgreSQL database/API foundation, preserving the existing browser-local UI and source references.

## Verified

- Pinned PGlite 0.5.14 and pg_dump tools 0.4.14 installed through npm. Engine reports PostgreSQL 18.6. Dependency audit reported zero vulnerabilities.
- Initialized persistent `.local/db` and explicitly seeded illustrative records: 6 products, 6 services, 5 clients, 10 visits, 3 reports, 8 invoices, 1 assessment and 15 observations. Revision is 1. Repeated ordinary startup does not seed.
- JSON and SQL exports created under ignored `.local/backups/`. SQL restored into a fresh isolated engine with identical domain records, revision, migration metadata and idempotency receipt replay.
- Database close/reopen preserved records; a second owner was rejected; changing an applied migration checksum prevented reopening without resetting data.
- Relational foreign-key and stock constraints rejected invalid references/negative stock. Product lines and payments round-tripped separately from owner payloads.
- Completion committed stock/report/30-day receivable together. Exact command and payment retries did not duplicate collection or stock deduction. Changed payload under the same request ID and stale concurrent writes returned conflicts.
- Validation errors, invalid imports and an injected SQL write failure rolled back records, revision and receipts. Import saved a pre-replacement snapshot. Sample seed refused a nonempty workspace.
- API rejected foreign Origin, Host rebinding, cross-site fetch metadata, unsupported actions, malformed JSON, wrong content type and payloads over 2 MiB. Backend, database and package files stayed outside static serving.
- Independent review found a malformed-request-target crash: `http://[` caused an unhandled URL error and persistent recovery lock. Reproduced with a failing regression, fixed by guarded parsing, and verified that HTTP 400 is followed by successful health requests.
- Live API smoke at `http://127.0.0.1:4176/api/health`: ready, PostgreSQL 18.6, browser-local UI mode. Workspace snapshot matched the seeded counts above. The live process remains the exclusive owner of `.local/db`.

## Commands

```powershell
npm test
npm run check
npm audit --omit=dev
git diff --check
```

The full suite contains 32 tests. Database-specific checks run with `npm run test:db`. Tests use isolated memory or temporary directories; they do not modify the owner's database. The seed/export command smoke ran before starting its live owner.

## Limits

No UI persistence cutover, imported owner browser state, hosted PostgreSQL/Supabase/Neon migration, public API, authentication or role/storage policy acceptance was performed. SQL restore acceptance currently covers a fresh local PostgreSQL engine of the same version, not an older hosted major version. JSON export is a logical record-transfer format; complete recovery with receipt history uses SQL export. The local API serializes and rewrites one small workspace per command; multi-user scale requires targeted persistence and production access controls.
