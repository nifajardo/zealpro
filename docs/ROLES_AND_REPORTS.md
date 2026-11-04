# Demo roles and report workflows

## Current requirements

The owner's 4 November 2026 updated requirements replace the earlier provisional three-role allocation. This implementation presents UI-01 through UI-11 in the existing browser-local demonstration. Supabase, authentication, database authorization, private storage and real delivery remain deferred by the owner's explicit UI-first instruction. See [the implementation specification](superpowers/specs/2026-11-04-updated-requirements-ui.md).

## Public sample credentials

| Account | Email | Password |
| --- | --- | --- |
| Owner / General Manager | `owner@zealpro.demo` | `OwnerDemo!2026` |
| Administrator | `admin@zealpro.demo` | `AdminDemo!2026` |
| Supervisor 1 / North team | `supervisor@zealpro.demo` | `SupervisorDemo!2026` |
| Supervisor 2 / South team | `supervisor2@zealpro.demo` | `SupervisorDemo!2026` |
| Technician / Marco Reyes | `technician@zealpro.demo` | `TechnicianDemo!2026` |
| Technician / Paolo Santos | `paolo@zealpro.demo` | `TechnicianDemo!2026` |
| Technician / Luis Mendoza | `luis@zealpro.demo` | `TechnicianDemo!2026` |
| Technician / Carlo Garcia | `carlo@zealpro.demo` | `TechnicianDemo!2026` |
| Technician / Nina Cruz | `nina@zealpro.demo` | `TechnicianDemo!2026` |
| Technician / Adrian Ramos | `adrian@zealpro.demo` | `TechnicianDemo!2026` |
| Technician / Bea Torres | `bea@zealpro.demo` | `TechnicianDemo!2026` |
| Technician / Diego Santos | `diego@zealpro.demo` | `TechnicianDemo!2026` |

These presets are deliberately public and listed on the sign-in screen. They are not real accounts or secrets. No password/token is saved in browser storage. Reload ends the role session while preserving the workspace. Owner-disabled presets cannot sign in. Prepared invitations and password-reset previews send nothing and create no real credentials.

## Permissions and scope

| Feature | Owner | Administrator | Supervisor | Technician |
| --- | --- | --- | --- | --- |
| Operational records | All | All office records | Assigned team and branches | Co-assigned jobs and own inspections |
| Charges, revenue, receivables and payments | Yes | Yes | No | No |
| Contribution / margin | Yes | No | No | No |
| Material costs and field expenses | Yes | Yes | Assigned operations | No costs; own expense submissions only |
| Service definitions / pricing | Manage | View; request rate change | Operational view | Method/instructions |
| Client contacts and agreements | Manage | Manage approved terms | Assigned contacts/history, no terms | Assigned contacts/history, no terms |
| Schedule and multiple personnel | Yes | Yes | Own team and branches | View assigned |
| Report draft / submit | Yes | No | Review only | Assigned jobs |
| Approve / return fieldwork | Yes | No | Assigned operations, no self-review | No |
| Product catalog / restock | Manage | Manage | View costs; request adjustment | Job-relevant quantities |
| Analytics / cumulative PDFs | Company-wide management copy | Company-wide operational copy | Assigned operational copy | No analytics/cumulative |
| Staff / invitations | Manage access and profiles | Safe profiles; prepare Technician invite | Read own team | Read self |
| Roles, activation, team mapping, collection delegation | Yes | No | No | No |
| Activity | All | Office actions | Team operations | Own/assigned operations |

North team includes Marco Reyes, Paolo Santos, Nina Cruz and Adrian Ramos, with Abenson, Northpoint and The Green Table. South team includes Luis Mendoza, Carlo Garcia, Bea Torres and Diego Santos, with Northpoint, Eastbridge and Willow. Northpoint is deliberately shared: branch association alone does not reveal the other team's appointments/report-derived observations. Owner edits these demo mappings in **Staff & access**. Immutable assignment names preserve work when display names change.

Existing browser workspaces receive the additional sample profiles and new team members once, without resetting jobs, stock, custom branch mappings or existing profile overrides. Later Owner edits remain intact. The four new names have no fabricated job history; schedule work for them to populate their assigned views.

Administrator collection verification is delegated by default, following the proposal's presentation default; Owner can withdraw it. Administrator scheduling uses the branch's agreed rate. Agreement choices use existing or Owner-approved catalog rates. Other pricing changes use **Services → Suggest rate change**, then Owner **Staff & access → Pricing requests** review. A master rate change does not rewrite captured charges.

## Fieldwork and stock

1. Technician opens **Schedule → assigned visit → Record fieldwork** and enters time, area, activities, quantities, findings, pest count, recommendation and a personal expense claim. Charges and material unit costs are absent.
2. **Save draft** retains incomplete work without stock/billing effects. Draft authorship remains stable; other Technicians cannot take it over.
3. **Submit for review** posts actual stock once and releases planned reservations. Status becomes Submitted; no new receivable is created.
4. Assigned Supervisor opens **Service reports → Submitted → Review submission**. **Return for correction** requires a reason and retains posted consumption.
5. Technician correction/resubmission changes only the net usage. Another worker's expense stays preserved and hidden.
6. **Approve & finalize** locks the report, records a reference and creates billing once. Approval does not mark an invoice paid.
7. Authorized **Request amendment** preserves versions/approvals and requires resubmission. A staged charge change does not alter the approved invoice until approval.

Legacy records are labeled demonstrations without invented historical reviewers/signatures. Unconfirmed legacy amounts remain excluded from contribution. Owner can **Review historical financials** with explicit charge/unit costs, then separately **Review payment link** against existing billing.

Scheduling supports a lead and additional personnel. Everyone participates in the one-hour conflict check; Supervisor selection stays within the team. Rescheduling retains identity/captured estimates. Cancellation requires a reason, releases unconsumed reservations and preserves the old plan; it cannot erase posted consumption. **Products & stock** includes quantities, permitted costs, movements and adjustment requests. Supervisor requests do not change stock; Owner/Administrator restocks post a ledger entry.

## Inspections and client lifecycle

Inspections retain independent areas/problems/recommendations/products and general/per-finding notes. Draft, Submitted, Returned and Approved states and review history are available. Only approved findings inform enrollment/planning; a performing Supervisor cannot approve their own inspection. Client profiles support Draft, Active and Archived status without deleting history. Field roles see contacts/location/job history rather than commercial terms.

## Payments and reminder previews

Owner/delegated Administrator records a pending payment with optional local image/PDF proof up to 1 MB. Pending evidence does not reduce the balance. Verification credits once; partial history reconciles. Owner reversal requires a reason and retains the original entry. Payments awaiting amendment approval cannot be verified.

Outstanding invoices offer reminder scheduling, paused/enabled simulation, success/failure simulation and retry logs. No email/SMS is sent. Actual channels, consent, timing and costs remain business/backend decisions. Customer signatures remain uncollected.

## Reports and pest sources

Owner, Administrator and Supervisor open **Service reports → Cumulative client / branch report**, select an inclusive account/branch/date range, **Apply filters**, then **Generate PDF report → Print / save PDF**. The logo, account/period blocks and acknowledgment layout remain. Only approved reports/inspections feed finalized findings and actual product totals. Narratives include personnel, approval references and prior/current observations. Only Owner management copies include contribution. No CSV export exists.

Graphs combine 15 illustrative historical observations with approved service-report counts, including three initial samples. Sources and previous/current branch/pest comparisons are explicit. Missing records are not zero and sightings do not prove effectiveness. Qualitative ocular findings add no numerical counts; no external feed is connected.

## Persistence and acceptance limits

The UI saves the full origin-local workspace, with metadata under `presentation`; scoped screens never replace full state. Existing local database/API records are not merged or migrated. No backend business module or SQL migration changed. Browser role checks are not secure authentication or confidentiality against developer tools; do not enter real confidential data. The separate unauthenticated local API remains loopback-only.

Source-level templates/controllers and domain checks pass. Computer Use stopped browser QA because it could not safely identify the Windows browser URL. Current visual/mobile acceptance, saved-PDF pagination and physical printing remain unverified. See [current QA](QA_UPDATED_REQUIREMENTS_UI.md).
