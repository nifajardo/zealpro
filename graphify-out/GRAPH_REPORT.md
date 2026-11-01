# Graph Report - zealpro  (2026-11-01)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 105 nodes · 448 edges · 9 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Catalog fixtures and navigation
- Forms and product editors
- Calendar and service presentation
- Workspace rendering
- Stock, reports and service receivables
- Catalog validation and payment states
- Migration and profit ranges
- Pest analytics and dates
- Billing and overview summaries

## God Nodes (most connected - your core abstractions)
1. `e()` - 29 edges
2. `button()` - 20 edges
3. `schedule()` - 19 edges
4. `icon()` - 19 edges
5. `need()` - 19 edges
6. `money()` - 15 edges
7. `render()` - 15 edges
8. `billing()` - 14 edges
9. `overview()` - 14 edges
10. `visitForm()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `migrateState()` --calls--> `seedServices()`  [EXTRACTED]
  model.js → data.js
- `productLine()` --calls--> `money()`  [EXTRACTED]
  app.js → model.js
- `updateEstimate()` --calls--> `money()`  [EXTRACTED]
  app.js → model.js
- `schedule()` --calls--> `calendarProfit()`  [EXTRACTED]
  app.js → model.js
- `schedule()` --calls--> `calendarRange()`  [EXTRACTED]
  app.js → model.js

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "Catalog fixtures and navigation"
Cohesion: 0.12
Nodes (19): app, assessmentAccount(), changeParam(), dialog, go(), navigation, notify(), paths (+11 more)

### Community 1 - "Forms and product editors"
Cohesion: 0.31
Nodes (16): clientOptions(), completeForm(), field(), form(), input(), material(), materialOptions(), options() (+8 more)

### Community 2 - "Calendar and service presentation"
Cohesion: 0.41
Nodes (14): badge(), client(), clientDetail(), initials(), profitBand(), reportDetail(), schedule(), servicePayment() (+6 more)

### Community 3 - "Workspace rendering"
Cohesion: 0.62
Nodes (12): button(), clients(), e(), empty(), heading(), icon(), inventory(), ocular() (+4 more)

### Community 4 - "Stock, reports and service receivables"
Cohesion: 0.39
Nodes (11): applyUsage(), availableStock(), completeVisit(), linkServicePayment(), need(), reportValues(), restock(), reviseReport() (+3 more)

### Community 5 - "Catalog validation and payment states"
Cohesion: 0.42
Nodes (11): enrollClient(), paymentSummary(), recordPayment(), roundMoney(), saveProduct(), saveService(), scheduleVisit(), snapshotProducts() (+3 more)

### Community 6 - "Migration and profit ranges"
Cohesion: 0.33
Nodes (7): addAssessment(), calendarProfit(), calendarRange(), migrateState(), validateState(), validDate(), validTime()

### Community 7 - "Pest analytics and dates"
Cohesion: 0.60
Nodes (5): analytics(), dateLabel(), observations(), panelHead(), trendChart()

### Community 8 - "Billing and overview summaries"
Cohesion: 0.50
Nodes (5): billing(), metric(), overview(), visitsTable(), summary()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `e()` connect `Workspace rendering` to `Catalog fixtures and navigation`, `Forms and product editors`, `Calendar and service presentation`, `Pest analytics and dates`, `Billing and overview summaries`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `Catalog fixtures and navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.1225296442687747 - nodes in this community are weakly interconnected._
- **Why does `scheduleVisit()` connect `Catalog validation and payment states` to `Catalog fixtures and navigation`, `Stock, reports and service receivables`, `Migration and profit ranges`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `completeVisit()` connect `Stock, reports and service receivables` to `Catalog fixtures and navigation`, `Catalog validation and payment states`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._