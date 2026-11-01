# Local database implementation plan

> **For agentic workers:** Use executing-plans to implement inline, with one fresh read-only review at completion.

**Goal:** Establish a durable local PostgreSQL database and transactional API without changing the browser demonstration's persistence yet.

**Architecture:** Versioned SQL in `backend/migrations/`, a small PGlite connection/migration owner, a relational workspace repository reusing `src/model.js`, an HTTP API mounted by `server.mjs`, and an offline administration CLI. Portable JSON and SQL exports preserve a later PostgreSQL migration seam.

**Tech stack:** Node.js 22+, native HTTP/test modules, pinned PGlite and matching pg_dump tools. No hosted service or credentials.

**Spec:** `docs/superpowers/specs/2026-11-01-local-database.md`.

## Global constraints

Preserve original sources, browser-local records and existing domain validation. Bind to loopback. Keep database/backups out of Git and static serving. No provider provisioning, hosted migration, authentication claims or implicit sample resets. Do not run two processes against one embedded database directory.

## Review focus

- Interrupted/ambiguous payment responses must not duplicate collection on exact retry.
- Two commands based on the same revision must not overwrite one another.
- Invalid imports or failed stock/report writes must leave the previous workspace intact.
- Database reopen or migration drift must never quietly reset data.
- Browser-local demonstration and server workspace must be explicitly identified as separate until cutover.

## Tasks and verification

- [x] Write failing persistence/relational constraint tests. Add the pinned packages, versioned schema, migration checksums, filesystem lock and connection cleanup. Verify disk reopen and lock behavior.
- [x] Write failing repository command tests. Implement relational snapshot read/write, explicit seed/import backup, revision locking and request receipts. Verify atomic completion/payment/correction, rollback, concurrent conflict and exact retry.
- [x] Write failing API tests. Mount local health/workspace/commands/backup endpoints with Host/Origin/type/size guards. Verify old static-file security and all domain regressions.
- [x] Add CLI initialization, status, backup, import and SQL export. Round-trip exports into an isolated database, document startup and provider migration boundaries, run focused/full checks, and request one independent review.

## Execution ledger

- Baseline: UI commit `f9d221b` pushed to `origin/main`; 25 tests and syntax checks passed. Origin is public; original SRS/signed photographs remain local.
- Ruling: implement the database/API foundation before UI persistence cutover to avoid silently replacing existing browser records or mixing two write authorities.
- Ruling: PGlite is the local development engine; PostgreSQL SQL/exports are the portability boundary. No unsupported direct claim of provider migration testing.

- Task results: persistence/constraint/revision/receipt tests passed; API security tests passed; SQL export restored into a fresh engine with records and receipts unchanged.
- Review fix: a malformed HTTP request target previously crashed the server and left a lock. A failing regression reproduced ECONNRESET; guarded URL parsing now returns HTTP 400 and subsequent health requests succeed.
- Additional verification: SQL write-failure injection proves rollback after row deletion, and seed rejects a nonempty workspace.
