# Roles, cumulative reporting and ocular findings

## Requirements and rulings

The owner requested Technician, Supervisor and Owner roles with sample logins; cumulative client/branch reports; pest-graph provenance; and multiple ocular findings. The unchanged private SRS was read through its three local rendered pages. Page 1 names General Manager, Administrator, Supervisor 1/2 and Technicians but does not prescribe a permission matrix. Pages 2–3 describe operational reporting, account/branch histories, management oversight and financial workflows.

- **Ruling:** Owner combines General Manager/Administrator; Supervisor combines Supervisor 1/2. The permission allocation below is an implementation proposal, not a verbatim SRS rule.
- **Ruling:** Retain the current static, browser-local demonstration. Public sample logins preview roles; they are not secure hosted authentication. No session token is persisted and no local API is exposed on Vercel. Production access control requires authenticated server-side authorization and a reviewed persistence cutover.
- **Ruling:** Preserve the owner's navy/lime screenshot system. Use existing tables, native dialogs, form patterns and nine destinations. Cumulative reporting is a tab within Service reports.
- **Ruling:** Existing assessments remain readable. Add structured findings without deleting legacy problem/solution/material fields. Historical record migration must be non-destructive and unsupported findings must fail atomically.
- **Ruling:** Pest graphs count observations and service-report counts, not qualitative ocular findings. Sources must be visible; historical sample counts must not be represented as live measurements.

## Role allocation

| Capability | Technician | Supervisor | Owner |
| --- | --- | --- | --- |
| Schedule/report visibility | Own assigned work | All operational work | All work |
| Complete service and enter actual quantities/expenses | Own assigned service | All services | All services |
| Correct existing reports | No | Operational values | Full values |
| Ocular assessments | Own assessor identity | All assessments | All assessments |
| Client details | Assigned branch contacts/history | Read contacts/history | Manage agreements and contacts |
| Scheduling/assignment | No | Yes, captured/default pricing | Yes |
| Catalog/stock | Read quantity availability | Read quantity availability; restock | Define/edit/archive and restock |
| Profit, product costs, billing and payments | No | No | Yes |
| Analytics/cumulative reports | No | Operational reports | Operational and financial reports |
| Reset browser demo data | No | No | Yes |

Role checks apply to routes, dialog actions and submit handlers, including record IDs. View scoping must never replace the full persisted workspace. Hidden finance fields must not be editable through forged form values. These are demo-behaviour checks, not a confidentiality boundary against browser developer tools.

## Implementation slices

- [x] Add tested structured ocular findings, preserving old records and backend JSONB round-trips.
- [x] Add tested cumulative report generation, source-aware observations and PDF report data.
- [x] Add tested demo role policy/scoping and login/logout without stored auth tokens.
- [x] Integrate role-aware views, forms, cumulative PDF preview/printing and multi-finding ocular entry.
- [x] Update static build/local asset allowlists, tests and public documentation.
- [x] Run full tests, build, syntax/whitespace checks, independent review and browser role/record/report checks.
- [ ] Commit/push main; verify the existing Vercel deployment and provide sample credentials.

## Task ownership

The subagent implementation workflow assigns independent domain slices to isolated owners: ocular domain changes in `src/model.js` and related tests; reporting/provenance in a new `src/reporting.js` and tests. The primary agent owns role policy, UI integration, hosting allowlists and final verification. Shared integration follows the agreed interfaces; agents do not commit or push independently.

## Owner format clarification

The owner explicitly requested PDF, matching the existing branded service reports, rather than CSV. The unused CSV generator/action and its format-specific tests were removed. Cumulative preview uses the same logo masthead, account/period blocks and native Print / Save as PDF flow as individual reports; account/branch/date, notes and quantity tests remain.
