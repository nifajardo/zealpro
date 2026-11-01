# Services, products and calendar profitability revision

The owner requested six connected changes: service definitions with descriptions and estimated products; actual product quantities during reporting; theoretical and actual calendar profits; calendar details on the right; product definitions; and a stronger visual identity. This revision extends the authorized local UI milestone and preserves source references and browser data.

## Decisions

- Services have a name, description, default charge, planned expenses and zero or more product quantity lines. Owners can create, edit, archive and restore definitions. Existing appointments retain their own estimate snapshots.
- Products have a name, description, base unit, unit cost, reorder threshold and opening stock. Owners can create/edit/archive/restore products and restock. Unit changes are blocked once stock or references exist. Products needed by active services or open allocations cannot be archived.
- Scheduling selects a service and copies its estimated products, charge and planned expenses into editable visit estimates. Product reservations account for all lines.
- Reporting captures actual products, quantities and unit costs, actual charge and expenses. Actual use may differ from estimates. Completing a visit validates all lines before deducting stock once. Existing reports can be revised with stock-delta validation; unchanged products retain recorded prices.
- Profit means service contribution before unrecorded overhead and taxes: charge minus product cost minus recorded expenses. Actual profit is recognized from completed, financially confirmed reports, independently of collection status. Theoretical profit includes every scheduled visit in the displayed range. A like-for-like variance compares actual against estimates for those same completed reports.
- Calendar offers month, week and day scopes. Range totals belong to the displayed scope; selected-day details and day totals sit on the right at desktop widths. On a narrow screen they stack. Empty actual periods show an unrecorded state, not fabricated zero profit.
- Existing version-one browser records migrate without discarding records. Legacy report financials remain unconfirmed until reviewed, because historical actual charges and costs were not captured. Preserve an origin-local backup before the first version-two save.
- Visually strengthen the workspace with navy framing, a high-contrast navigation shell, larger readable typography, lime/cyan data accents, denser calendar events and a purposeful right-hand dispatch panel. Keep original logo pixels and the native-module architecture.

## Scope and checks

Changes reach sample fixtures, model mutations/validation/migration, service/product views and forms, all scheduling/report callers, inventory, report display, calendar aggregation, styles, tests and handoff documentation. No hosted services, real financial integrations or authentication are introduced.

Verify service/product lifecycle, duplicate names, invalid lines, stock atomicity, report corrections, cost snapshots, calendar range boundaries, legacy migration and unchanged cancellation behavior. Inspect desktop and phone output and exercise the real browser workflows. Existing original references stay untouched.
