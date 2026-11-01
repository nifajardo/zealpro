# Graph Report - zealpro  (2026-11-02)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 323 nodes · 832 edges · 25 communities (21 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4d014041`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.js
- model.js
- server.mjs
- Repository Guidelines
- Project.md
- Zealpro handoff
- Zealpro UI demonstration design
- Zealpro operations workspace
- Local PostgreSQL foundation
- Revision 2: service catalog, products and calendar profit
- api.test.js
- Zealpro UI verification
- Service payment standing QA
- SRS and paperwork traceability
- Local database implementation plan
- Zealpro UI Demonstration Implementation Plan
- Local database and backend foundation
- Zealpro project
- Local database QA
- Calendar year view and visual refinement
- Zealpro architecture
- Services, products and calendar profitability revision
- Services and calendar profitability implementation plan
- Calendar refinement implementation plan
- CONTINUE.md

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
- `HTTP contract` --references--> `client()`  [INFERRED]
  docs/LOCAL_DATABASE.md → src/app.js
- `HTTP contract` --references--> `restock()`  [INFERRED]
  docs/LOCAL_DATABASE.md → src/model.js
- `Model and migrations` --references--> `services()`  [INFERRED]
  docs/LOCAL_DATABASE.md → src/app.js

## Import Cycles
- None detected.

## Communities (25 total, 4 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.13
Nodes (66): Model and migrations, analytics(), app, assessmentAccount(), badge(), billing(), button(), changeParam() (+58 more)

### Community 1 - "model.js"
Cohesion: 0.14
Nodes (47): collections, nested, operations, Connected workflow, Payment standing, CALENDAR_VIEWS, createDemo(), DEMO_DATE (+39 more)

### Community 2 - "server.mjs"
Cohesion: 0.05
Nodes (39): handleApi(), json(), readCommand(), exportBackup(), exportSql(), readImport(), openDatabase(), canonical() (+31 more)

### Community 3 - "Repository Guidelines"
Cohesion: 0.13
Nodes (13): Build, Test, and Development Commands, Coding Style & Naming Conventions, Commit & Pull Request Guidelines, Project Preferences, Project Structure & Module Organization, Repository Guidelines, Security & Configuration, Testing Guidelines (+5 more)

### Community 4 - "Project.md"
Cohesion: 0.25
Nodes (4): Client and branch editing QA, Implemented behavior, Limits, Verification

### Community 5 - "Zealpro handoff"
Cohesion: 0.22
Nodes (9): Backend implementation, Boundaries and next step, Client editing follow-up, Current milestones, Run and live state, Skills and source navigation, UI and record preservation, Verification (+1 more)

### Community 6 - "Zealpro UI demonstration design"
Cohesion: 0.25
Nodes (7): Acceptance and limits, Architecture and constraints, Demonstration scope, Intent and authority, Product and visual decisions, Source inventory, Zealpro UI demonstration design

### Community 7 - "Zealpro operations workspace"
Cohesion: 0.25
Nodes (8): Checks, Demonstration boundary, Design and assets, Layout, Presentation walkthrough, Profit and saved records, Run, Zealpro operations workspace

### Community 8 - "Local PostgreSQL foundation"
Cohesion: 0.29
Nodes (6): Backup, import and SQL export, Hosted path and recommendation, HTTP contract, Local PostgreSQL foundation, Lock recovery, Setup and run

### Community 9 - "Revision 2: service catalog, products and calendar profit"
Cohesion: 0.29
Nodes (7): Automated evidence, Browser evidence, Calendar scroll regression, Limits, Presentation screenshots, Review and repairs, Revision 2: service catalog, products and calendar profit

### Community 11 - "Zealpro UI verification"
Cohesion: 0.33
Nodes (5): Automated checks, Browser walkthrough, Independent review, Limits, Zealpro UI verification

### Community 12 - "Service payment standing QA"
Cohesion: 0.33
Nodes (5): Automated checks, Behavior, Browser verification, Limits, Service payment standing QA

### Community 13 - "SRS and paperwork traceability"
Cohesion: 0.33
Nodes (5): Assumptions needing client decisions, Owner payment-standing follow-up, Owner revision 2, Paperwork mapping, SRS and paperwork traceability

### Community 14 - "Local database implementation plan"
Cohesion: 0.33
Nodes (5): Execution ledger, Global constraints, Local database implementation plan, Review focus, Tasks and verification

### Community 15 - "Zealpro UI Demonstration Implementation Plan"
Cohesion: 0.33
Nodes (5): Completion ledger, Global constraints, Review focus, Tasks, Zealpro UI Demonstration Implementation Plan

### Community 16 - "Local database and backend foundation"
Cohesion: 0.33
Nodes (5): Acceptance, Implementation decisions, Intent and scope, Local database and backend foundation, Provider direction

### Community 17 - "Zealpro project"
Cohesion: 0.33
Nodes (6): Asset provenance, Client contacts, Decisions, Local database milestone, Navigation, Zealpro project

### Community 18 - "Local database QA"
Cohesion: 0.40
Nodes (4): Commands, Limits, Local database QA, Verified

### Community 19 - "Calendar year view and visual refinement"
Cohesion: 0.40
Nodes (4): Behavior, Calendar year view and visual refinement, Direction, Verification and completion

### Community 20 - "Zealpro architecture"
Cohesion: 0.40
Nodes (4): Graphify, Local backend foundation, Production seam, Zealpro architecture

### Community 21 - "Services, products and calendar profitability revision"
Cohesion: 0.50
Nodes (3): Decisions, Scope and checks, Services, products and calendar profitability revision

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Zealpro architecture` connect `Zealpro architecture` to `model.js`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13128729752770674 - nodes in this community are weakly interconnected._
- **Why does `Local PostgreSQL foundation` connect `Local PostgreSQL foundation` to `app.js`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Should `model.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14160401002506265 - nodes in this community are weakly interconnected._
- **Why does `Connected workflow` connect `model.js` to `Zealpro architecture`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Should `server.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.05323653962492438 - nodes in this community are weakly interconnected._
- **Should `Repository Guidelines` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._