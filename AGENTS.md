# Repository Guidelines

## Project Preferences

At the start of each session, read [PROJECT_PREFERENCES.md](PROJECT_PREFERENCES.md). It records the required skills, communication style, senior responsibilities, autonomy preference, and preferred model for this project. Apply it throughout the session and report any unavailable capability.

## Project Structure & Module Organization

This repository contains the Zealpro presentation UI and a local database/API foundation. The private root file `ZEALPRO - SRS.pdf` is the software requirements specification. Consult it when available before requirements changes and preserve the original. It and the signed reference photographs are excluded from the public repository; traceability and provenance are in `docs/`.

`src/` contains native browser modules and shared domain logic; `public/` contains static assets; `backend/` owns PostgreSQL persistence, commands, migrations and exports. Automated tests live in `tests/`. Durable project notes are in `knowledge/`; `HANDOFF.md` is the resume authority. The UI still writes browser-local data until a separate persistence cutover. Do not mix those records with the server workspace implicitly.

## Build, Test, and Development Commands

Use Node.js 22+ and `npm ci`. `npm start` runs the loopback server; `npm test` runs all checks; `npm run test:db` focuses database/API/export tests; `npm run check` checks JavaScript syntax. There is no compilation step. Database setup, seed, backup and export commands are documented in `README.md` and `docs/LOCAL_DATABASE.md`.

Useful repository checks from the root:

- `git status --short`: inspect pending changes before and after work.
- `git diff --check`: check tracked changes for whitespace errors.
- `git diff --stat`: summarize tracked changes for review.

These diff commands exclude untracked files; inspect new files separately. When adding tooling, record exact setup, development, build, and test commands in a `README.md`.

## Coding Style & Naming Conventions

Use the existing native JavaScript module style and shared validation in `src/model.js`. Keep SQL migrations immutable after application; add a new migration for schema changes. No formatter or linter is configured; syntax checks and whitespace checks are required. Keep naming consistent within each module.

For Markdown, use descriptive headings, concise instructions, fenced command examples, and spaces rather than tabs. Use UTF-8 for text files. Avoid unrelated formatting changes.

## Testing Guidelines

Tests use Node's built-in runner. Database tests use isolated memory or temporary directories, never the owner's `.local/db`. Cover SRS behavior and failure cases, including rollback, stale revisions and idempotent payment/completion. No coverage threshold is configured. Describe browser verification separately from automated checks.

## Commit & Pull Request Guidelines

Use concise, imperative subjects, such as `feat: add local database foundation`. The origin is public; never stage local databases, exports, credentials or signed private paperwork.

Pull requests should explain the change, reference relevant SRS sections or issues, and report checks performed. Include screenshots for interface changes and setup instructions for new tooling.

## Security & Configuration

Keep credentials and local secrets outside version control. If configuration is introduced, document required variables and provide examples containing placeholders only.
