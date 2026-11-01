# Graph Report - zealpro  (2026-11-01)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 302 nodes · 774 edges · 24 communities (20 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f9d221b3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.js
- model.js
- server.mjs
- Repository Guidelines
- scripts
- Zealpro UI handoff
- Zealpro UI demonstration design
- Zealpro operations workspace
- Revision 2: service catalog, products and calendar profit
- api.test.js
- Local PostgreSQL foundation
- Service payment standing QA
- Local database implementation plan
- Zealpro UI Demonstration Implementation Plan
- Local database and backend foundation
- Zealpro UI verification
- SRS and paperwork traceability
- Zealpro architecture
- Zealpro project
- Local database QA
- Services, products and calendar profitability revision
- Services and calendar profitability implementation plan
- CONTINUE.md

## God Nodes (most connected - your core abstractions)
1. `e()` - 29 edges
2. `button()` - 21 edges
3. `icon()` - 19 edges
4. `schedule()` - 19 edges
5. `need()` - 19 edges
6. `render()` - 15 edges
7. `money()` - 15 edges
8. `overview()` - 14 edges
9. `billing()` - 14 edges
10. `client()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Completion ledger` --references--> `button()`  [INFERRED]
  docs/superpowers/plans/2026-11-01-ui-demo.md → src/app.js
- `HTTP contract` --references--> `client()`  [INFERRED]
  docs/LOCAL_DATABASE.md → src/app.js
- `HTTP contract` --references--> `restock()`  [INFERRED]
  docs/LOCAL_DATABASE.md → src/model.js
- `Model and migrations` --references--> `services()`  [INFERRED]
  docs/LOCAL_DATABASE.md → src/app.js
- `Model and migrations` --references--> `clients()`  [INFERRED]
  docs/LOCAL_DATABASE.md → src/app.js

## Import Cycles
- None detected.

## Communities (24 total, 4 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.13
Nodes (64): Model and migrations, analytics(), app, assessmentAccount(), badge(), billing(), button(), changeParam() (+56 more)

### Community 1 - "model.js"
Cohesion: 0.15
Nodes (44): collections, nested, operations, Connected workflow, Payment standing, createDemo(), DEMO_DATE, PESTS (+36 more)

### Community 2 - "server.mjs"
Cohesion: 0.07
Nodes (27): handleApi(), json(), readCommand(), exportBackup(), exportSql(), readImport(), openDatabase(), canonical() (+19 more)

### Community 3 - "Repository Guidelines"
Cohesion: 0.13
Nodes (13): Build, Test, and Development Commands, Coding Style & Naming Conventions, Commit & Pull Request Guidelines, Project Preferences, Project Structure & Module Organization, Repository Guidelines, Security & Configuration, Testing Guidelines (+5 more)

### Community 4 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, check, db:backup, db:export:sql, db:import, db:init, db:seed, db:status (+4 more)

### Community 5 - "Zealpro UI handoff"
Cohesion: 0.20
Nodes (9): Boundaries, Calendar scroll follow-up, Current state, Implemented behavior, Record preservation, Service payment follow-up, Skills and capabilities, Verification (+1 more)

### Community 6 - "Zealpro UI demonstration design"
Cohesion: 0.25
Nodes (7): Acceptance and limits, Architecture and constraints, Demonstration scope, Intent and authority, Product and visual decisions, Source inventory, Zealpro UI demonstration design

### Community 7 - "Zealpro operations workspace"
Cohesion: 0.25
Nodes (8): Checks, Demonstration boundary, Design and assets, Layout, Presentation walkthrough, Profit and saved records, Run, Zealpro operations workspace

### Community 9 - "Revision 2: service catalog, products and calendar profit"
Cohesion: 0.29
Nodes (7): Automated evidence, Browser evidence, Calendar scroll regression, Limits, Presentation screenshots, Review and repairs, Revision 2: service catalog, products and calendar profit

### Community 11 - "Local PostgreSQL foundation"
Cohesion: 0.33
Nodes (6): Backup, import and SQL export, Hosted path and recommendation, HTTP contract, Local PostgreSQL foundation, Lock recovery, Setup and run

### Community 12 - "Service payment standing QA"
Cohesion: 0.33
Nodes (5): Automated checks, Behavior, Browser verification, Limits, Service payment standing QA

### Community 13 - "Local database implementation plan"
Cohesion: 0.33
Nodes (5): Execution ledger, Global constraints, Local database implementation plan, Review focus, Tasks and verification

### Community 14 - "Zealpro UI Demonstration Implementation Plan"
Cohesion: 0.33
Nodes (5): Completion ledger, Global constraints, Review focus, Tasks, Zealpro UI Demonstration Implementation Plan

### Community 15 - "Local database and backend foundation"
Cohesion: 0.33
Nodes (5): Acceptance, Implementation decisions, Intent and scope, Local database and backend foundation, Provider direction

### Community 16 - "Zealpro UI verification"
Cohesion: 0.40
Nodes (5): Automated checks, Browser walkthrough, Independent review, Limits, Zealpro UI verification

### Community 17 - "SRS and paperwork traceability"
Cohesion: 0.40
Nodes (5): Assumptions needing client decisions, Owner payment-standing follow-up, Owner revision 2, Paperwork mapping, SRS and paperwork traceability

### Community 18 - "Zealpro architecture"
Cohesion: 0.40
Nodes (4): Graphify, Local backend foundation, Production seam, Zealpro architecture

### Community 19 - "Zealpro project"
Cohesion: 0.40
Nodes (5): Asset provenance, Decisions, Local database milestone, Navigation, Zealpro project

### Community 20 - "Local database QA"
Cohesion: 0.50
Nodes (4): Commands, Limits, Local database QA, Verified

### Community 21 - "Services, products and calendar profitability revision"
Cohesion: 0.50
Nodes (3): Decisions, Scope and checks, Services, products and calendar profitability revision

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Local PostgreSQL foundation` connect `Local PostgreSQL foundation` to `Project.md`, `app.js`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13387607417458164 - nodes in this community are weakly interconnected._
- **Why does `Zealpro architecture` connect `Zealpro architecture` to `model.js`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Should `server.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.07342995169082125 - nodes in this community are weakly interconnected._
- **Why does `Connected workflow` connect `model.js` to `Zealpro architecture`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Should `Repository Guidelines` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._