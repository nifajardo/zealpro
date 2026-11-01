# Graph Report - zealpro  (2026-11-02)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 372 nodes · 891 edges · 31 communities (26 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f335192a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.js
- model.js
- server.mjs
- scripts
- Repository Guidelines
- Revision 2: service catalog, products and calendar profit
- Zealpro handoff
- Zealpro operations workspace
- Zealpro UI demonstration design
- Zealpro project
- Zealpro architecture
- Vercel hosting
- vercel.json
- Design: Zealpro operations workspace
- Local PostgreSQL foundation
- Service payment standing QA
- Local database implementation plan
- Zealpro UI Demonstration Implementation Plan
- Local database and backend foundation
- Brand restoration and usability QA
- Calendar and brand refinement QA
- SRS and paperwork traceability
- Calendar year view and visual refinement
- Client and branch editing QA
- Local database QA
- Services, products and calendar profitability revision
- Services and calendar profitability implementation plan
- Calendar refinement implementation plan
- CONTINUE.md
- brand-spec.md

## God Nodes (most connected - your core abstractions)
1. `e()` - 30 edges
2. `button()` - 21 edges
3. `schedule()` - 20 edges
4. `need()` - 20 edges
5. `icon()` - 19 edges
6. `client()` - 16 edges
7. `money()` - 16 edges
8. `render()` - 15 edges
9. `validateState()` - 15 edges
10. `overview()` - 14 edges

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

## Communities (31 total, 5 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.13
Nodes (66): Model and migrations, analytics(), app, assessmentAccount(), badge(), billing(), button(), changeParam() (+58 more)

### Community 1 - "model.js"
Cohesion: 0.14
Nodes (47): collections, nested, operations, Connected workflow, Payment standing, CALENDAR_VIEWS, createDemo(), DEMO_DATE (+39 more)

### Community 2 - "server.mjs"
Cohesion: 0.07
Nodes (23): handleApi(), json(), readCommand(), exportBackup(), exportSql(), readImport(), openDatabase(), canonical() (+15 more)

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
Cohesion: 0.15
Nodes (12): Backend implementation, Boundaries and next step, Calendar and brand refinement, Client editing follow-up, Current milestones, Owner reference palette restoration, Run and live state, Skills and source navigation (+4 more)

### Community 7 - "Zealpro operations workspace"
Cohesion: 0.22
Nodes (9): Checks, Demonstration boundary, Design and assets, Layout, Presentation walkthrough, Profit and saved records, Run, Vercel hosting (+1 more)

### Community 9 - "Zealpro UI demonstration design"
Cohesion: 0.25
Nodes (7): Acceptance and limits, Architecture and constraints, Demonstration scope, Intent and authority, Product and visual decisions, Source inventory, Zealpro UI demonstration design

### Community 10 - "Zealpro project"
Cohesion: 0.25
Nodes (8): Asset provenance, Calendar refinement, Client contacts, Decisions, Local database milestone, Navigation, Shared visual system, Zealpro project

### Community 11 - "Zealpro architecture"
Cohesion: 0.29
Nodes (5): Graphify, Local backend foundation, Production seam, Static hosting seam, Zealpro architecture

### Community 12 - "Vercel hosting"
Cohesion: 0.29
Nodes (7): Deployment shape, Existing GitHub-connected project, Local verification, Readiness verification, References, Reported function failure, Vercel hosting

### Community 13 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, framework, headers, installCommand, outputDirectory, $schema

### Community 14 - "Design: Zealpro operations workspace"
Cohesion: 0.33
Nodes (5): Composition and controls, Design: Zealpro operations workspace, Motion and exports, System, Tokens

### Community 15 - "Local PostgreSQL foundation"
Cohesion: 0.33
Nodes (6): Backup, import and SQL export, Hosted path and recommendation, HTTP contract, Local PostgreSQL foundation, Lock recovery, Setup and run

### Community 16 - "Service payment standing QA"
Cohesion: 0.33
Nodes (5): Automated checks, Behavior, Browser verification, Limits, Service payment standing QA

### Community 17 - "Local database implementation plan"
Cohesion: 0.33
Nodes (5): Execution ledger, Global constraints, Local database implementation plan, Review focus, Tasks and verification

### Community 18 - "Zealpro UI Demonstration Implementation Plan"
Cohesion: 0.33
Nodes (5): Completion ledger, Global constraints, Review focus, Tasks, Zealpro UI Demonstration Implementation Plan

### Community 19 - "Local database and backend foundation"
Cohesion: 0.33
Nodes (5): Acceptance, Implementation decisions, Intent and scope, Local database and backend foundation, Provider direction

### Community 20 - "Brand restoration and usability QA"
Cohesion: 0.40
Nodes (5): Brand restoration and usability QA, Checks and review, Evidence, Final captures, Final direction

### Community 21 - "Calendar and brand refinement QA"
Cohesion: 0.40
Nodes (5): Automated and source checks, Calendar and brand refinement QA, Real browser evidence, Result, Visual record and design review

### Community 22 - "SRS and paperwork traceability"
Cohesion: 0.40
Nodes (5): Assumptions needing client decisions, Owner payment-standing follow-up, Owner revision 2, Paperwork mapping, SRS and paperwork traceability

### Community 23 - "Calendar year view and visual refinement"
Cohesion: 0.40
Nodes (4): Behavior, Calendar year view and visual refinement, Direction, Verification and completion

### Community 24 - "Client and branch editing QA"
Cohesion: 0.50
Nodes (4): Client and branch editing QA, Implemented behavior, Limits, Verification

### Community 25 - "Local database QA"
Cohesion: 0.50
Nodes (4): Commands, Limits, Local database QA, Verified

### Community 26 - "Services, products and calendar profitability revision"
Cohesion: 0.50
Nodes (3): Decisions, Scope and checks, Services, products and calendar profitability revision

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Zealpro architecture` connect `Zealpro architecture` to `model.js`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13128729752770674 - nodes in this community are weakly interconnected._
- **Why does `Connected workflow` connect `model.js` to `app.js`, `Zealpro architecture`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Should `model.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14223057644110276 - nodes in this community are weakly interconnected._
- **Why does `Local PostgreSQL foundation` connect `Local PostgreSQL foundation` to `README.md`, `app.js`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Should `server.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.07180851063829788 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._