# Graph Report - zealpro  (2026-11-03)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 445 nodes · 1133 edges · 36 communities (31 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `43e6d24f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.js
- model.js
- ref_node_assert
- scripts
- Repository Guidelines
- Revision 2: service catalog, products and calendar profit
- Zealpro handoff
- demo-access.test.js
- reporting.js
- Zealpro project
- Zealpro operations workspace
- Zealpro UI demonstration design
- Vercel hosting
- Demo roles and cumulative reports
- Roles, cumulative reporting and ocular findings
- Zealpro architecture
- vercel.json
- Design: Zealpro operations workspace
- Local PostgreSQL foundation
- Roles, cumulative PDF and ocular findings QA
- Service payment standing QA
- SRS and paperwork traceability
- Local database implementation plan
- Zealpro UI Demonstration Implementation Plan
- Local database and backend foundation
- Brand restoration and usability QA
- Calendar and brand refinement QA
- Calendar year view and visual refinement
- Client and branch editing QA
- Local database QA
- Services, products and calendar profitability revision
- Services and calendar profitability implementation plan
- Calendar refinement implementation plan
- CONTINUE.md
- brand-spec.md

## God Nodes (most connected - your core abstractions)
1. `e()` - 39 edges
2. `button()` - 27 edges
3. `schedule()` - 22 edges
4. `can()` - 21 edges
5. `icon()` - 21 edges
6. `need()` - 20 edges
7. `render()` - 19 edges
8. `client()` - 18 edges
9. `money()` - 17 edges
10. `dateLabel()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Implemented behavior` --references--> `client()`  [INFERRED]
  docs/QA_CLIENT_EDIT.md → src/app.js
- `Completion ledger` --references--> `button()`  [INFERRED]
  docs/superpowers/plans/2026-11-01-ui-demo.md → src/app.js
- `Calendar and brand refinement` --references--> `moveCalendar()`  [INFERRED]
  HANDOFF.md → src/model.js
- `HTTP contract` --references--> `client()`  [INFERRED]
  docs/LOCAL_DATABASE.md → src/app.js
- `Connected workflow` --references--> `yearCalendar()`  [INFERRED]
  knowledge/Architecture.md → src/app.js

## Import Cycles
- None detected.

## Communities (36 total, 5 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.12
Nodes (80): Model and migrations, can(), analytics(), app, assessmentAccount(), assessmentDetail(), assessmentForm(), assessmentLine() (+72 more)

### Community 1 - "model.js"
Cohesion: 0.12
Nodes (53): canonical(), collections, nested, operations, readState(), writeState(), Connected workflow, Payment standing (+45 more)

### Community 2 - "ref_node_assert"
Cohesion: 0.08
Nodes (22): handleApi(), json(), readCommand(), exportBackup(), exportSql(), readImport(), openDatabase(), WorkspaceError (+14 more)

### Community 3 - "scripts"
Cohesion: 0.08
Nodes (23): dependencies, @electric-sql/pglite, @electric-sql/pglite-tools, engines, node, name, private, scripts (+15 more)

### Community 4 - "Repository Guidelines"
Cohesion: 0.13
Nodes (13): Build, Test, and Development Commands, Coding Style & Naming Conventions, Commit & Pull Request Guidelines, Project Preferences, Project Structure & Module Organization, Repository Guidelines, Security & Configuration, Testing Guidelines (+5 more)

### Community 5 - "Revision 2: service catalog, products and calendar profit"
Cohesion: 0.14
Nodes (12): Automated checks, Browser walkthrough, Independent review, Limits, Automated evidence, Browser evidence, Calendar scroll regression, Limits (+4 more)

### Community 6 - "Zealpro handoff"
Cohesion: 0.14
Nodes (13): Backend implementation, Boundaries and next step, Calendar and brand refinement, Client editing follow-up, Current milestones, Latest milestone: roles, cumulative PDF and ocular findings, Owner reference palette restoration, Run and live state (+5 more)

### Community 7 - "demo-access.test.js"
Cohesion: 0.28
Nodes (11): assertDemoAction(), authenticateDemo(), canView(), DEMO_USERS, permissions, protectedValues(), scopeWorkspace(), allowed() (+3 more)

### Community 8 - "reporting.js"
Cohesion: 0.35
Nodes (11): accountKey(), accountName(), accountOptions(), buildCumulativeReport(), byDate(), compare(), legacySeed(), pestObservations() (+3 more)

### Community 10 - "Zealpro project"
Cohesion: 0.22
Nodes (9): Asset provenance, Calendar refinement, Client contacts, Decisions, Local database milestone, Navigation, Roles, reporting and inspection findings, Shared visual system (+1 more)

### Community 11 - "Zealpro operations workspace"
Cohesion: 0.22
Nodes (9): Checks, Demonstration boundary, Design and assets, Layout, Presentation walkthrough, Profit and saved records, Run, Vercel hosting (+1 more)

### Community 12 - "Zealpro UI demonstration design"
Cohesion: 0.25
Nodes (7): Acceptance and limits, Architecture and constraints, Demonstration scope, Intent and authority, Product and visual decisions, Source inventory, Zealpro UI demonstration design

### Community 13 - "Vercel hosting"
Cohesion: 0.25
Nodes (8): Deployment shape, Existing GitHub-connected project, Live acceptance: 2026-11-02, Local verification, Readiness verification, References, Reported function failure, Vercel hosting

### Community 14 - "Demo roles and cumulative reports"
Cohesion: 0.29
Nodes (7): Cumulative PDF workflow, Demo roles and cumulative reports, Multiple ocular findings, Persistence and verification limits, Pest graph data, Public sample credentials, Role allocation

### Community 15 - "Roles, cumulative reporting and ocular findings"
Cohesion: 0.29
Nodes (6): Implementation slices, Owner format clarification, Requirements and rulings, Role allocation, Roles, cumulative reporting and ocular findings, Task ownership

### Community 16 - "Zealpro architecture"
Cohesion: 0.29
Nodes (5): Graphify, Local backend foundation, Production seam, Static hosting seam, Zealpro architecture

### Community 17 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, framework, headers, installCommand, outputDirectory, $schema

### Community 18 - "Design: Zealpro operations workspace"
Cohesion: 0.33
Nodes (5): Composition and controls, Design: Zealpro operations workspace, Motion and exports, System, Tokens

### Community 19 - "Local PostgreSQL foundation"
Cohesion: 0.33
Nodes (6): Backup, import and SQL export, Hosted path and recommendation, HTTP contract, Local PostgreSQL foundation, Lock recovery, Setup and run

### Community 20 - "Roles, cumulative PDF and ocular findings QA"
Cohesion: 0.33
Nodes (6): Automated checks, Connected browser checks, Hosted acceptance, Limits, Requirements and review, Roles, cumulative PDF and ocular findings QA

### Community 21 - "Service payment standing QA"
Cohesion: 0.33
Nodes (5): Automated checks, Behavior, Browser verification, Limits, Service payment standing QA

### Community 22 - "SRS and paperwork traceability"
Cohesion: 0.33
Nodes (6): Assumptions needing client decisions, Owner payment-standing follow-up, Owner revision 2, Paperwork mapping, Roles, cumulative reporting and multiple findings follow-up, SRS and paperwork traceability

### Community 23 - "Local database implementation plan"
Cohesion: 0.33
Nodes (5): Execution ledger, Global constraints, Local database implementation plan, Review focus, Tasks and verification

### Community 24 - "Zealpro UI Demonstration Implementation Plan"
Cohesion: 0.33
Nodes (5): Completion ledger, Global constraints, Review focus, Tasks, Zealpro UI Demonstration Implementation Plan

### Community 25 - "Local database and backend foundation"
Cohesion: 0.33
Nodes (5): Acceptance, Implementation decisions, Intent and scope, Local database and backend foundation, Provider direction

### Community 26 - "Brand restoration and usability QA"
Cohesion: 0.40
Nodes (5): Brand restoration and usability QA, Checks and review, Evidence, Final captures, Final direction

### Community 27 - "Calendar and brand refinement QA"
Cohesion: 0.40
Nodes (5): Automated and source checks, Calendar and brand refinement QA, Real browser evidence, Result, Visual record and design review

### Community 28 - "Calendar year view and visual refinement"
Cohesion: 0.40
Nodes (4): Behavior, Calendar year view and visual refinement, Direction, Verification and completion

### Community 29 - "Client and branch editing QA"
Cohesion: 0.50
Nodes (4): Client and branch editing QA, Implemented behavior, Limits, Verification

### Community 30 - "Local database QA"
Cohesion: 0.50
Nodes (4): Commands, Limits, Local database QA, Verified

### Community 31 - "Services, products and calendar profitability revision"
Cohesion: 0.50
Nodes (3): Decisions, Scope and checks, Services, products and calendar profitability revision

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Zealpro architecture` connect `Zealpro architecture` to `model.js`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11842491918895093 - nodes in this community are weakly interconnected._
- **Why does `Connected workflow` connect `model.js` to `app.js`, `Zealpro architecture`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Should `model.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12135176651305683 - nodes in this community are weakly interconnected._
- **Why does `Local PostgreSQL foundation` connect `Local PostgreSQL foundation` to `app.js`, `README.md`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Should `ref_node_assert` be split into smaller, more focused modules?**
  _Cohesion score 0.07908163265306123 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._