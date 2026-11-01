# Zealpro UI demonstration design

## Intent and authority

Build a local, presentation-ready browser demonstration of the Zealpro management system. The owner requested autonomous UI-first development using the supplied SRS, paperwork, and logo. This document records implementation decisions, not client-approved business rules.

## Source inventory

- `ZEALPRO - SRS.pdf`, pages 1–3: six business stages, staff hierarchy, six treatment types, inventory deductions, generated service reports, branch histories, fulfillment, calendar, receivables and reminders.
- `375958077_122113076180026477_5273206052510758923_n.png`: supplied Zealpro logo; navy, lime and cyan form the interface palette.
- `aeb8d181-7279-45f2-9947-8fd31b2648af.jfif` and `b44b72fd-ce2d-4bfb-930d-f3337ef9edf8.jfif`: Zealpro report 13365. Use printed field structure only; do not copy signatures or uncertain handwriting into demo records.
- `a14ba4fb-89db-47c3-aa8a-19723c748653.jfif`: Diversey sanitation report. Secondary workflow reference only; its branding does not belong in the Zealpro product.

## Product and visual decisions

The manager's first question is: which scheduled services still need attention? A service queue and fulfillment summary answer it. The distinctive element is a connected assessment-to-collection workflow using Zealpro's own report terminology.

Use the Taste accent-ladder app direction: restrained brand marks, pale selected navigation, flat white surfaces and strong table alignment. Hallmark's Coral app direction contributes the readable General Sans typography and paperwork emphasis. The supplied brand overrides its coral hue and warm paper. Navy is the information color; lime indicates fulfillment; cyan supports monitoring. Eight destinations justify a persistent desktop sidebar, collapsing to a labeled mobile menu.

The sample dataset has a fixed demonstration date of 2 November 2026. All clients, rates, stock, staff and pest counts in the interface are illustrative. Counts, balances, fulfillment and charts derive from the same data. The supplied SRS mentions Abenson as an account example; it is not a claim of an actual customer relationship.

## Demonstration scope

1. Overview: service queue, fulfillment, projected service value, receivables and attention list.
2. Schedule: real month navigation, day selection, service filter and validated visit creation.
3. Ocular visits: standardized problems, recommended treatments and materials with local saving.
4. Clients: branch history, enrollment details and local client creation.
5. Treatments and reports: view a visit, record time and actual material usage, deduct stock once, create a report, compare pest counts and print the report.
6. Inventory: stock levels, allocations, low-stock warnings and validated restocking.
7. Billing: invoice balances, payment recording and reminder preview. No messages are sent.
8. Analytics: branch filtering and pest recurrence trends from sample observations.

## Architecture and constraints

Use HTML, CSS and native JavaScript modules with a Node.js loopback static server. No runtime dependencies, hosted services, authentication, provider calls or database are needed for this milestone. Browser localStorage preserves sample changes; recover gracefully from invalid or unavailable storage. Never serve repository files or original paperwork through the static server. Escape user text before rendering HTML. Native dialogs provide focus containment and Escape behavior.

## Acceptance and limits

Core actions must work with a keyboard and at phone, tablet and desktop widths. Verify meaningful state logic with Node's test runner and inspect actual browser output. Preserve every supplied original. Record exact launch/test commands, a client walkthrough, source traceability and unfinished production gates. Authentication, authorization, multi-user storage, automatic reminders, real file uploads and legally final reports remain future work.
