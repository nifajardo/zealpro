# Repository Guidelines

## Project Preferences

At the start of each session, read [PROJECT_PREFERENCES.md](PROJECT_PREFERENCES.md). It records the required skills, communication style, senior responsibilities, autonomy preference, and preferred model for this project. Apply it throughout the session and report any unavailable capability.

## Project Structure & Module Organization

This repository is currently a requirements-only starting point. The root contains `ZEALPRO - SRS.pdf`, the software requirements specification. Consult that document before proposing implementation changes, and preserve the original file.

No application source, tests, assets, or dependency manifests exist yet. When introducing the first implementation, document its directory layout and keep application code, automated tests, and static assets in clearly named locations.

## Build, Test, and Development Commands

No build system, package manager, or local development server is configured. There are currently no build or test commands to run.

Useful repository checks from the root:

- `git status --short`: inspect pending changes before and after work.
- `git diff --check`: check tracked changes for whitespace errors.
- `git diff --stat`: summarize tracked changes for review.

These diff commands exclude untracked files; inspect new files separately. When adding tooling, record exact setup, development, build, and test commands in a `README.md`.

## Coding Style & Naming Conventions

No language-specific style, formatter, or linter is established. Configure these alongside the first source files and follow the chosen language's standard conventions. Keep naming consistent within each module.

For Markdown, use descriptive headings, concise instructions, fenced command examples, and spaces rather than tabs. Use UTF-8 for text files. Avoid unrelated formatting changes.

## Testing Guidelines

No testing framework or coverage threshold is configured. Introduce appropriate tests with executable behavior, and document test locations, naming patterns, and execution commands. Cover requirements from the SRS, including failure cases. Until automated checks exist, describe manual verification and its limitations in the pull request.

## Commit & Pull Request Guidelines

The Git repository has no commits, so no historical message convention exists. Use concise, imperative subjects, such as `docs: describe initial setup`, as a starting convention.

Pull requests should explain the change, reference relevant SRS sections or issues, and report checks performed. Include screenshots for interface changes and setup instructions for new tooling.

## Security & Configuration

Keep credentials and local secrets outside version control. If configuration is introduced, document required variables and provide examples containing placeholders only.
