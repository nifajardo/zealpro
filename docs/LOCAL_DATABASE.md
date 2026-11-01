# Local PostgreSQL foundation

This milestone provides an actual persistent local PostgreSQL database and transactional API. The presentation UI still uses browser-local records. The API and browser demo are separate workspaces until the next persistence cutover; no browser records have been copied or replaced automatically.

## Setup and run

Requires Node.js 22+ and npm. No Docker, PostgreSQL Windows service, hosted account or credentials are required.

```powershell
cd D:\zealpro
npm ci
npm run db:init
npm run db:seed
npm start
```

`db:init` applies migrations and creates an empty version-two workspace. `db:seed` is optional and only succeeds on a new empty workspace; it inserts illustrative records. Ordinary server startup applies pending migrations but never reseeds existing records. Open `http://127.0.0.1:4173/api/health` for readiness and `http://127.0.0.1:4173/api/workspace` for the stored snapshot.

The default directory is `.local/db`, excluded from Git and static serving. Set `ZEALPRO_DB_DIR` to use another persistent directory. Set `PORT` for another HTTP port. `ZEALPRO_DB_DIR=:memory:` is for isolated tests only. The included `.env.example` can be copied to `.env` and loaded explicitly with `node --env-file=.env server.mjs`; `npm start` does not load `.env` automatically.

Only one process can own a persistent database directory. Stop the server with Ctrl+C before offline administration commands. A second server must use a different database directory; changing HTTP port alone does not isolate its data.

## Model and migrations

`backend/migrations/001_workspace.sql` creates a private `zealpro` schema:

| Records | Tables |
| --- | --- |
| Definitions and branches | `materials`, `services`, `clients` |
| Fulfillment | `visits`, `reports`, `assessments`, `observations` |
| Products and captured quantities/costs | `service_products`, `visit_products`, `report_products` |
| Collection | `invoices`, `payments` |
| Recovery and coordination | `workspace_meta`, `schema_migrations`, `command_receipts`, `workspace_backups` |

Each entity has a stable ID and ordering. Record payloads retain compatible domain/legacy fields in JSONB; relational keys, charges, costs and stock are generated from those payloads and constrained/indexed by PostgreSQL. Product lines and payment entries have their own authoritative tables and are reconstructed by the repository. Foreign keys prevent broken references, a visit has at most one report and one linked receivable, and stock/balances cannot be negative. Domain validation remains the authority for cross-record business rules and cost snapshots.

Business dates remain validated ISO date strings from the existing domain model. Payment status uses the fixed sample day; persistence does not turn this demo into live accounting.

Applied SQL migrations are checksummed with normalized line endings. Edited or missing applied migrations fail startup rather than resetting records. Add a new numbered migration instead of editing one that has already been applied. The SQL uses PostgreSQL features, without a provider-specific extension or ORM schema.

## HTTP contract

All endpoints are local-only. Host must be the current `127.0.0.1:PORT` or `localhost:PORT`; an Origin header must match one of those origins. Foreign origins and cross-site requests are rejected. There are no CORS grants, authentication, public hosting or direct SQL execution routes.

| Method and path | Result |
| --- | --- |
| `GET /api/health` | Readiness, engine version and explicit browser-local UI mode |
| `GET /api/workspace` | `{ revision, state }` |
| `POST /api/commands` | Execute one validated atomic operation |
| `GET /api/backup` | Consistent JSON data export |

Command shape:

```json
{
  "requestId": "unique-client-request-id",
  "revision": 1,
  "action": "restock",
  "id": "m1",
  "values": { "quantity": 100 }
}
```

Successful commands return `{ revision, state, result, replayed }`. Supported actions are `service`, `product`, `catalog-active`, `visit`, `complete`, `report-revision`, `payment`, `restock`, `client`, `assessment`, `service-payment`, `seed` and `import`. Values use the existing `src/model.js` inputs; `catalog-active` takes `collection` and `active`, and import takes `{ state }`. Client creation takes an optional `assessmentId` inside values.

The server loads the workspace, runs the shared domain operation, writes relational records, advances the revision and stores its receipt in one transaction. Completion therefore commits stock deduction, the service report, completion status and its 30-day payment record together. Corrections and payments use the existing guards. The initial repository rewrites this single small workspace inside the transaction; targeted row updates are required before multi-user scale.

Repeat an ambiguous request with the same request ID and identical payload, including its original revision. The stored receipt prevents a second deduction/collection even after restart. Reusing that ID for different data returns `409 REQUEST_REUSED`. A new command with an old revision returns `409 REVISION_CONFLICT`; reload the workspace and review changes before creating a new request ID. Replay responses include current state and the original result.

Errors use `{ error: { code, message } }`: malformed input `400`, local-origin restriction `403`, route/method unavailable `404`, conflicts `409`, payload over 2 MiB `413`, unsupported content type `415`, domain validation `422`, internal failure `500`. Internal SQL messages and request bodies are not returned/logged. Malformed request targets return `400` without crashing the database owner.

## Backup, import and SQL export

With the server stopped:

```powershell
npm run db:status
npm run db:backup
npm run db:export:sql
```

Exports default to timestamped files in `.local/backups/`; use `-- --out PATH` to choose a file. Existing files are not overwritten. While the server runs, `GET /api/backup` provides a consistent data export without opening the database from another process.

JSON is a logical data-transfer/review format. It contains domain records and source revision, not the original command receipt ledger. To import a reviewed JSON backup or old version-one/two browser-state JSON, stop the server, inspect `db:status`, then explicitly name the expected destination revision:

```powershell
npm run db:import -- --file .local/backups/reviewed.json --revision 1 --confirm
```

Import validates/migrates the whole input before replacement and saves the prior workspace in `zealpro.workspace_backups` inside the same transaction. It preserves historical invoice dates, payments, estimate/review flags and supported fractional quantities. A conflict or invalid input leaves the destination unchanged. After logical import, clients must reload and use new request IDs. Do not manually replay pre-import financial requests against a different database identity.

Use the SQL export for complete database recovery or a staging migration: it contains schema/migration metadata, data, pre-import backups and idempotency receipts. It is PostgreSQL SQL from supported `pg_dump` tooling, not a copy of PGlite's engine-specific data directory. A fresh-engine SQL restore and exact receipt replay are covered by automated tests. Restore only into a deliberately empty, compatible target; do not run it over an existing hosted workspace.

## Lock recovery

The sidecar `.local/db.lock` contains the owner PID. A normal graceful close removes it. A hard termination can leave it behind; startup will refuse access rather than guess that concurrent access is safe. Inspect the PID and verify that its process is no longer running before removing only that lock file. Never remove a lock belonging to a live database owner. Back up the directory before manual recovery; do not delete the database directory as a restart fix.

## Hosted path and recommendation

PGlite 0.5.14 currently reports PostgreSQL 18.6 in this environment. Full SQL export must be rehearsed against a provider with a compatible PostgreSQL major version; a direct restore into an older major version is not assumed. Keep the checked-in migration and logical JSON data path available if target versions differ.

Supabase is the provisional fit for Zealpro's role-aware application and future service-report/payment-proof storage. Both Supabase and Neon provide PostgreSQL-based backends, and Neon's current suite also includes auth/storage capabilities; the final choice depends on version, region, operational and integration requirements. No account, hosted database or billable resource was created.

Before hosted use: add a server PostgreSQL connection driver, choose a staging instance/version, apply/rehearse migrations and data transfer, compare record/stock/receivable totals and idempotency behavior, and implement authentication, roles, audit requirements and storage policies. Keep this schema private; no direct browser database credentials or public access should be enabled as a shortcut.

References checked November 1, 2026: [PGlite filesystem setup](https://pglite.dev/docs/), [API and transactions](https://pglite.dev/docs/api), [SQL dump tooling](https://pglite.dev/docs/pglite-tools), [Supabase PostgreSQL](https://supabase.com/docs/guides/database/overview), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Neon products](https://neon.com/docs), [Neon PostgreSQL versions](https://api-docs.neon.tech/reference/createproject).
