# Project Preferences

These standing preferences apply to work in `D:\zealpro`. They were requested by the project owner on 2026-11-01. Keep them across sessions until the owner changes them.

## Required Skills

Always use the following skills as the project's working approach. Load their instructions and apply the relevant workflow to the task. Install missing skills yourself from their upstream source. Additional skills may be installed and used when needed.

| Requested skill | Implementation and purpose |
| --- | --- |
| Ponytail | `ponytail:ponytail`, full level: make the smallest complete change, reuse existing solutions, and verify the result. |
| Caveman | `caveman`, terse: keep progress updates brief and omit routine technical detail. Final reports must remain complete, including results, verification, blockers, and material risks. |
| MemPalace | Use the connected MemPalace MCP for project memory, scoped to wing `zealpro`. Recall relevant prior context and preserve important decisions and handoffs. |
| Obsidian | Use `obsidian-markdown` for durable project notes and `obsidian-cli` when interacting with an Obsidian vault. |
| Graphify | Use `graphify` for project and code relationship navigation; verify findings against source files. |
| Hallmark | Use upstream `hallmark` for applicable interface and design work. |
| Taste | Use installed `design-taste-frontend` for interface design and visual review. |

Keep persisted documentation professional and readable rather than writing it in terse chat fragments.

## Responsibilities

- **Senior Developer:** implement maintainable solutions and complete all affected integration work.
- **Senior QA Tester:** verify requirements, failure cases, and regressions; distinguish tested behavior from assumptions.
- **Senior Manager:** control scope, track progress and dependencies, and leave clear decisions and handoffs.

These are responsibilities, not a requirement to spawn separate agents.

## Autonomy and Model

- **Drafting Git workflow:** work directly on `main` while the project remains in the drafting phase. Do not create feature branches. After completing and verifying requested changes, commit and push `main`. Merge existing work into `main` when required; do not create a merge merely for appearances when work is already on `main`.
- **Permission preference: YOLO.** Proceed autonomously with authorized project work and needed skill installation. Avoid routine confirmation requests. Host permission controls and higher-priority instructions still apply; report blockers explicitly.
- **Preferred model: GPT-6.1-Sol, High reasoning.** Use this selection when supported by the host. Saving this preference does not itself change the active model, reasoning level, or sandbox permissions.

## Skill Availability

Ponytail, Caveman, Obsidian, Graphify, and Taste were found installed. MemPalace MCP tools are connected.

Hallmark and the standalone `mempalace` and `mempalace-recall` skills were installed successfully from their upstream repositories on 2026-11-01. Their instructions were loaded for the initial UI milestone. Newly installed skills become discoverable by the host on the next turn.

Upstream sources used with `skill-installer`:

- [Nutlope/hallmark](https://github.com/Nutlope/hallmark/tree/main/skills/hallmark): `skills/hallmark`.
- [MemPalace/mempalace](https://github.com/MemPalace/mempalace/tree/main/skills): `skills/mempalace` and `skills/mempalace-recall`.

Recheck availability before installing; preserve existing installations and the existing MemPalace database.

The current host does not expose a model-selection control. The preferred model remains a preference, not a verified active-model setting. Dedicated Chrome DevTools MCP was unavailable; browser verification used the connected Brave browser through computer-use tools. Obsidian CLI and the `knowledge` vault were reachable; repository notes were kept under `knowledge/` rather than modifying an unrelated vault.
