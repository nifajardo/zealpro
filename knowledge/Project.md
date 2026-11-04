---
title: Zealpro project
date: 2026-11-01
tags:
  - zealpro
  - project
  - ui-demo
---

# Zealpro project

The first milestone is a local UI presentation for Zealpro Solutions Incorporated, grounded in the supplied SRS, service paperwork and logo.

> [!info] Demonstration boundary
> Records are illustrative. Browser-local persistence is not a production database. No real messages, payments or signatures are connected.

## Decisions

- Use native browser modules and a Node loopback server. The local backend now uses pinned PGlite and pg_dump tooling; install with `npm ci`.
- Use the supplied logo and latest owner screenshot as brand authority: navy navigation, lime selection, navy actions and white working panels. The explicit reference supersedes exploratory hue changes.
- Keep the initial ocular assessment possible before formal enrollment.
- Complete treatment, deduct stock and compile its report in one validated local action.
- Record pest type explicitly; never infer it from the treatment method.
- Keep missing observations distinct from observed zero counts and label November as partial.
- Services and products now have editable definitions with reversible archival. Visits capture estimates; reports capture actual product quantities and prices.
- Calendar Year, Month, Week and Day totals use the displayed range. Desktop day details sit to the right. Profit is charge less product costs and entered expenses, before unrecorded overhead and tax.
- Version-one records are preserved through migration and an origin-local backup before the first upgraded save. Old reports need financial confirmation; imported fractional piece quantities remain flagged rather than silently rounded.

## Local database milestone

A filesystem-backed PostgreSQL/API foundation now exists under `backend/` and `.local/db`. Migrations, relational references, transactional domain commands, revision conflicts, idempotency receipts and JSON/SQL exports are implemented. The presentation UI remains browser-local pending a deliberate import/persistence cutover. No hosted provider is provisioned. See [database contract](../docs/LOCAL_DATABASE.md) and [database QA](../docs/QA_LOCAL_DATABASE.md).

## Client contacts

Clients & branches now supports Edit details for identity/address, agreement fields, contact person, role, phone and email. New contact fields are optional and do not reinterpret legacy roles as names. Stable branch IDs retain service/payment history; captured historical charges are unchanged. Search and reminder previews use the new contact fields. See [client editing QA](../docs/QA_CLIENT_EDIT.md).

## Navigation

- [[Architecture]] describes code ownership and the source map.
- [Launch and walkthrough](../README.md).
- [SRS mapping](../docs/SRS_TRACEABILITY.md).
- [Verification evidence](../docs/QA.md).
- [Resume authority](../HANDOFF.md).

## Asset provenance

The original SRS, three paperwork photographs and logo are preserved. The public logo is an unmodified copy. No handwritten signature was reproduced. The locally served General Sans fonts have their original Fontshare license bundled.

## Calendar refinement

Year provides twelve equal month cards with monthly contribution and drill-down. Shared period navigation clamps invalid leap-day/month-end selections. Desktop calendar/detail panels align at 720 pixels; narrow panels stack, and long values wrap without changing month-card heights. Blank outside-month cells have a distinct fill. See [calendar QA](../docs/QA_CALENDAR_REFINEMENT.md). Drafting changes stay directly on main, followed by verification and commit/push.

## Shared visual system

`design.md` records the restored navy/lime system. Mobile table actions and focus containment were improved while retaining all business workflows. See [brand restoration QA](../docs/QA_BRAND_RESTORATION.md) and the final screenshots.

## Roles, reporting and inspection findings

Owner, Supervisor and Technician sample logins preview the proposed SRS hierarchy allocation. `access.js` controls screen scope and actions; full workspace persistence remains separate. These public credentials are not secure authentication. Cumulative account/branch/date reports use the existing branded PDF preview and Print / Save as PDF flow, without CSV. Multiple ocular findings preserve individual products/notes and general inspection instructions. Pest graphs combine labeled historical sample observations and saved service-report counts. See [credentials and report guide](../docs/ROLES_AND_REPORTS.md), [QA evidence](../docs/QA_ROLES_REPORTS_OCULAR.md) and [[Architecture]].

## Updated requirements presentation

The 4 November update separates Administrator from Owner and scopes two Supervisor accounts. Approval-led browser workflows, stock/payment/reminder previews and staff/access/activity screens are implemented without backend integration. Read [current role/workflow guide](../docs/ROLES_AND_REPORTS.md), [updated QA](../docs/QA_UPDATED_REQUIREMENTS_UI.md) and [[Architecture]]. Browser visual acceptance is blocked by Computer Use URL verification; source/controller checks are separate evidence.

## Login presentation

Three unaltered company-reference photos now form the login collage. Taste's editorial-greeting direction keeps the form clear, with public demo-role selection and a finite reduced-motion-aware entrance. Navy/lime branding and all role behavior remain. [Login source/QA](../docs/QA_LOGIN_REFRESH.md) records asset provenance and the unresolved browser visual acceptance limitation.
