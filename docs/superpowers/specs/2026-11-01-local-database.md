# Local database and backend foundation

## Intent and scope

The owner asked to start backend preparation with a local database, then consider Supabase, Neon or another hosted provider. This milestone establishes the database and a working local API. The existing presentation UI remains browser-local until a separate, explicit persistence cutover; mixing browser and database writes would create two competing sources of truth. Existing browser records and original paperwork must not be overwritten.

## Implementation decisions

- Use pinned PGlite, an embedded PostgreSQL engine with native filesystem persistence, because this machine has no PostgreSQL service, psql or Docker executable. This is the implementer's choice under the owner's autonomous-work preference.
- Keep the Node HTTP server and current pure domain model. Commands must execute the existing domain rules on the server, inside a database transaction. No ORM or replacement web framework is required.
- Store entities in separate relational tables under a private `zealpro` schema. Use foreign keys, unique linked visits, money/stock constraints, ordered product lines and ordered payments. Preserve legacy fields in JSONB record payloads while extracting indexed/generated relational keys and values; product lines and payments are separate authoritative tables.
- Version SQL migrations with checksums. Opening an existing database must not reseed, rewrite records or rerun altered migrations silently. Maintain an exclusive process lock; a second process must fail safely rather than share the embedded data directory.
- Seed illustrative records only on explicit initialization, not on ordinary server start. The local API serves an empty valid version-two workspace until the owner chooses sample seed or imports a reviewed browser backup.
- Expose health, workspace snapshot, command execution and JSON backup/export endpoints on loopback only. Commands use an expected revision and a unique request ID. Exact retries must not deduct stock or collect payment twice; conflicting reuse of an ID must fail. Concurrent stale writes must return a conflict.
- Provide explicit offline CLI initialization/seed, import, backup and portable SQL export. Imports must validate/migrate the entire input before changing records, take a pre-import backup, require a revision, and preserve invoice payments/legacy review flags. SQL export uses PGlite's supported pg_dump tooling rather than copying its engine-specific data directory to a hosted service.
- Restrict HTTP Host and Origin, request type/size, accepted commands and error responses. The database directory, backups, dependency files and backend source must not be publicly served or committed. This remains an unauthenticated single-computer development backend; production auth/roles are a separate gate.

## Acceptance

1. Migrations and disk data survive close/reopen; duplicate processes and altered applied migrations fail safely.
2. SQL foreign keys and constraints reject broken links and negative balances/stock. Seed round-trips without changing domain data.
3. API catalog changes, scheduling, completion, report revision, stock, clients, assessments and payments reuse domain validation. Completion atomically commits report, stock deduction and the 30-day receivable.
4. Invalid operations roll back; stale revisions conflict; identical request retries return one committed result; reused IDs with changed payloads fail.
5. JSON backup/import preserves records. A portable SQL export restores into a fresh local PostgreSQL engine with matching records and migration metadata.
6. Existing UI/model/HTTP tests remain passing. Private files stay unserved; API errors omit internal database details.

## Provider direction

Prefer PostgreSQL portability now and defer a hosted account or migration. Supabase is a reasonable first candidate for Zealpro's role-based access and future report/proof storage; Neon also offers a PostgreSQL backend and an expanded backend product suite. Final selection requires validating the chosen provider's authentication, storage, region and operational needs. Neither service is provisioned by this milestone.

Primary references: [PGlite filesystem setup](https://pglite.dev/docs/), [transactions and API](https://pglite.dev/docs/api), [portable SQL dump](https://pglite.dev/docs/pglite-tools), [Supabase PostgreSQL](https://supabase.com/docs/guides/database/overview), [Neon documentation](https://neon.com/docs). The local SRS pages 2–3 ground inventory deduction, fulfillment, report compilation, payment collection and standing accounts.
