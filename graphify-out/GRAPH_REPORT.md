# Graph Report - zealpro  (2026-11-04)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 593 nodes · 1722 edges · 39 communities (34 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a0d49f24`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.js
- presentation.js
- ui-presentation-harness.mjs
- model.js
- scripts
- Repository Guidelines
- Zealpro handoff
- Revision 2: service catalog, products and calendar profit
- reporting.js
- Zealpro project
- Demo roles and report workflows
- Vercel hosting
- Zealpro operations workspace
- Zealpro UI demonstration design
- SRS and paperwork traceability
- Roles, cumulative reporting and ocular findings
- Updated requirements presentation scope
- vercel.json
- Design: Zealpro operations workspace
- Local PostgreSQL foundation
- Roles, cumulative PDF and ocular findings QA
- Service payment standing QA
- Updated requirements UI QA
- Local database implementation plan
- Zealpro UI Demonstration Implementation Plan
- Local database and backend foundation
- Zealpro architecture
- Brand restoration and usability QA
- Calendar and brand refinement QA
- Calendar year view and visual refinement
- Client and branch editing QA
- Local database QA
- Updated Requirements UI Implementation Plan
- Services, products and calendar profitability revision
- Continue Zealpro
- Services and calendar profitability implementation plan
- Calendar refinement implementation plan
- brand-spec.md

## God Nodes (most connected - your core abstractions)
1. `e()` - 44 edges
2. `can()` - 41 edges
3. `button()` - 28 edges
4. `need()` - 28 edges
5. `event()` - 27 edges
6. `transaction()` - 26 edges
7. `render()` - 24 edges
8. `schedule()` - 24 edges
9. `reportDetail()` - 23 edges
10. `scopeWorkspace()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Implemented behavior` --references--> `client()`  [INFERRED]
  docs/QA_CLIENT_EDIT.md → src/app.js
- `Completion ledger` --references--> `button()`  [INFERRED]
  docs/superpowers/plans/2026-11-01-ui-demo.md → src/app.js
- `Calendar and brand refinement` --references--> `moveCalendar()`  [INFERRED]
  HANDOFF.md → src/model.js
- `UI-first workflow layer` --references--> `jobStatus()`  [INFERRED]
  knowledge/Architecture.md → src/presentation.js
- `HTTP contract` --references--> `client()`  [INFERRED]
  docs/LOCAL_DATABASE.md → src/app.js

## Import Cycles
- None detected.

## Communities (39 total, 5 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.10
Nodes (98): Model and migrations, can(), canView(), allowed(), analytics(), app, approved(), assessmentAccount() (+90 more)

### Community 1 - "presentation.js"
Cohesion: 0.10
Nodes (81): assertDemoAction(), assignedPersonnel(), authenticateDemo(), currentProfile(), DEFAULT_TEAMS, DEMO_USERS, ownTeam(), permissions (+73 more)

### Community 2 - "ui-presentation-harness.mjs"
Cohesion: 0.05
Nodes (36): handleApi(), json(), readCommand(), exportBackup(), exportSql(), readImport(), openDatabase(), WorkspaceError (+28 more)

### Community 3 - "model.js"
Cohesion: 0.08
Nodes (61): canonical(), collections, nested, operations, readState(), writeState(), Connected workflow, Payment standing (+53 more)

### Community 4 - "scripts"
Cohesion: 0.08
Nodes (24): dependencies, @electric-sql/pglite, @electric-sql/pglite-tools, engines, node, name, private, scripts (+16 more)

### Community 5 - "Repository Guidelines"
Cohesion: 0.13
Nodes (13): Build, Test, and Development Commands, Coding Style & Naming Conventions, Commit & Pull Request Guidelines, Project Preferences, Project Structure & Module Organization, Repository Guidelines, Security & Configuration, Testing Guidelines (+5 more)

### Community 6 - "Zealpro handoff"
Cohesion: 0.13
Nodes (14): Backend implementation, Boundaries and next step, Calendar and brand refinement, Client editing follow-up, Current milestones, Owner reference palette restoration, Previous milestone: roles, cumulative PDF and ocular findings, Run and live state (+6 more)

### Community 7 - "Revision 2: service catalog, products and calendar profit"
Cohesion: 0.14
Nodes (12): Automated checks, Browser walkthrough, Independent review, Limits, Automated evidence, Browser evidence, Calendar scroll regression, Limits (+4 more)

### Community 9 - "reporting.js"
Cohesion: 0.35
Nodes (11): accountKey(), accountName(), accountOptions(), buildCumulativeReport(), byDate(), compare(), legacySeed(), pestObservations() (+3 more)

### Community 10 - "Zealpro project"
Cohesion: 0.20
Nodes (10): Asset provenance, Calendar refinement, Client contacts, Decisions, Local database milestone, Navigation, Roles, reporting and inspection findings, Shared visual system (+2 more)

### Community 11 - "Demo roles and report workflows"
Cohesion: 0.22
Nodes (9): Current requirements, Demo roles and report workflows, Fieldwork and stock, Inspections and client lifecycle, Payments and reminder previews, Permissions and scope, Persistence and acceptance limits, Public sample credentials (+1 more)

### Community 12 - "Vercel hosting"
Cohesion: 0.22
Nodes (9): Deployment shape, Existing GitHub-connected project, Live acceptance: 2026-11-02, Live role/report update: 2026-11-03, Local verification, Readiness verification, References, Reported function failure (+1 more)

### Community 13 - "Zealpro operations workspace"
Cohesion: 0.22
Nodes (9): Checks, Demonstration boundary, Design and assets, Layout, Presentation walkthrough, Profit and saved records, Run, Vercel hosting (+1 more)

### Community 14 - "Zealpro UI demonstration design"
Cohesion: 0.25
Nodes (7): Acceptance and limits, Architecture and constraints, Demonstration scope, Intent and authority, Product and visual decisions, Source inventory, Zealpro UI demonstration design

### Community 15 - "SRS and paperwork traceability"
Cohesion: 0.29
Nodes (7): Assumptions needing client decisions, Owner payment-standing follow-up, Owner revision 2, Paperwork mapping, Roles, cumulative reporting and multiple findings follow-up, SRS and paperwork traceability, Updated requirements: 4 November 2026

### Community 16 - "Roles, cumulative reporting and ocular findings"
Cohesion: 0.29
Nodes (6): Implementation slices, Owner format clarification, Requirements and rulings, Role allocation, Roles, cumulative reporting and ocular findings, Task ownership

### Community 17 - "Updated requirements presentation scope"
Cohesion: 0.29
Nodes (6): Authority and intent, Defaults for the presentation, Implementation boundaries, Presentation requirements, Review and acceptance, Updated requirements presentation scope

### Community 18 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, framework, headers, installCommand, outputDirectory, $schema

### Community 19 - "Design: Zealpro operations workspace"
Cohesion: 0.33
Nodes (5): Composition and controls, Design: Zealpro operations workspace, Motion and exports, System, Tokens

### Community 20 - "Local PostgreSQL foundation"
Cohesion: 0.33
Nodes (6): Backup, import and SQL export, Hosted path and recommendation, HTTP contract, Local PostgreSQL foundation, Lock recovery, Setup and run

### Community 21 - "Roles, cumulative PDF and ocular findings QA"
Cohesion: 0.33
Nodes (6): Automated checks, Connected browser checks, Hosted acceptance, Limits, Requirements and review, Roles, cumulative PDF and ocular findings QA

### Community 22 - "Service payment standing QA"
Cohesion: 0.33
Nodes (5): Automated checks, Behavior, Browser verification, Limits, Service payment standing QA

### Community 23 - "Updated requirements UI QA"
Cohesion: 0.33
Nodes (6): Automated evidence, Browser limitation, Hosting verification, Independent review, Screen mapping, Updated requirements UI QA

### Community 24 - "Local database implementation plan"
Cohesion: 0.33
Nodes (5): Execution ledger, Global constraints, Local database implementation plan, Review focus, Tasks and verification

### Community 25 - "Zealpro UI Demonstration Implementation Plan"
Cohesion: 0.33
Nodes (5): Completion ledger, Global constraints, Review focus, Tasks, Zealpro UI Demonstration Implementation Plan

### Community 26 - "Local database and backend foundation"
Cohesion: 0.33
Nodes (5): Acceptance, Implementation decisions, Intent and scope, Local database and backend foundation, Provider direction

### Community 27 - "Zealpro architecture"
Cohesion: 0.33
Nodes (6): Graphify, Local backend foundation, Production seam, Static hosting seam, UI-first workflow layer, Zealpro architecture

### Community 28 - "Brand restoration and usability QA"
Cohesion: 0.40
Nodes (5): Brand restoration and usability QA, Checks and review, Evidence, Final captures, Final direction

### Community 29 - "Calendar and brand refinement QA"
Cohesion: 0.40
Nodes (5): Automated and source checks, Calendar and brand refinement QA, Real browser evidence, Result, Visual record and design review

### Community 30 - "Calendar year view and visual refinement"
Cohesion: 0.40
Nodes (4): Behavior, Calendar year view and visual refinement, Direction, Verification and completion

### Community 31 - "Client and branch editing QA"
Cohesion: 0.50
Nodes (4): Client and branch editing QA, Implemented behavior, Limits, Verification

### Community 32 - "Local database QA"
Cohesion: 0.50
Nodes (4): Commands, Limits, Local database QA, Verified

### Community 33 - "Updated Requirements UI Implementation Plan"
Cohesion: 0.50
Nodes (3): Constraints and review focus, Slices, Updated Requirements UI Implementation Plan

### Community 34 - "Services, products and calendar profitability revision"
Cohesion: 0.50
Nodes (3): Decisions, Scope and checks, Services, products and calendar profitability revision

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Zealpro architecture` connect `Zealpro architecture` to `README.md`, `model.js`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `button()` (e.g. with `Completion ledger` and `uiContext()`) actually correct?**
  _`button()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10376237623762376 - nodes in this community are weakly interconnected._
- **Why does `Connected workflow` connect `model.js` to `app.js`, `Zealpro architecture`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Should `presentation.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09607843137254903 - nodes in this community are weakly interconnected._
- **Why does `Local PostgreSQL foundation` connect `Local PostgreSQL foundation` to `README.md`, `app.js`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Should `ui-presentation-harness.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.05023796932839767 - nodes in this community are weakly interconnected._