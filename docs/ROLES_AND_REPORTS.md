# Demo roles and cumulative reports

## Role allocation

The private SRS page 1 names General Manager, Administrator, Supervisor 1/2 and Technicians. It does not define a detailed permission matrix. This demonstration combines General Manager/Administrator as **Owner**, combines Supervisor 1/2 as **Supervisor**, and applies the following proposed allocation for client review.

| Feature | Technician | Supervisor | Owner |
| --- | --- | --- | --- |
| Work and service reports | Own assigned services | All operational services | All services |
| Complete services, actual quantities and expenses | Own services | All services | All services |
| Correct existing reports | No | Operational values | Full values |
| Ocular inspections | Own assessor identity | All inspections | All inspections |
| Client contacts/history | Assigned branches | Read all | Manage contacts and agreements |
| Schedule/assign services | No | Yes; default/captured pricing | Yes |
| Product/service definitions | Read availability | Read availability | Create, edit and archive |
| Restock | No | Yes | Yes |
| Financials, prices, costs, billing/payments | No | No | Yes |
| Pest analytics and cumulative reports | No | Operational copy | Operational and financial copy |
| Reset sample workspace | No | No | Yes |

Technician visibility also includes branches linked to their own assessments. New inspections can describe an unenrolled prospect. A Technician cannot select another assessor or complete another technician's service. Supervisor forms cannot change service charges or captured unit costs. Reloading signs out; existing workspace records remain. Sign out clears the open dialog as well as the in-memory profile.

## Public sample credentials

These presets are deliberately public and are also listed on the sign-in screen. They are not real accounts or secrets. Do not reuse these passwords elsewhere.

| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@zealpro.demo` | `OwnerDemo!2026` |
| Supervisor | `supervisor@zealpro.demo` | `SupervisorDemo!2026` |
| Technician | `technician@zealpro.demo` | `TechnicianDemo!2026` |

The Technician represents the illustrative Marco Reyes. No authentication token or password is saved in browser storage. Role checks cover navigation, actions, record IDs and form submissions, but all demo data and code remain accessible to the browser. This is not a confidentiality boundary or secure hosted authentication. The local API has no authenticated role policy and must remain loopback-only. A production cutover requires authenticated server authorization on every command and query, consistent with [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

## Cumulative PDF workflow

1. Sign in as Owner or Supervisor.
2. Open **Service reports → Cumulative client / branch report**.
3. Choose an account, all its branches or one branch, and an inclusive date range. Select **Apply filters**.
4. Select **Generate PDF report** to review the branded document.
5. Select **Print / save PDF**, choose **Save as PDF** in the browser print destination, and save.

This reuses the existing service-report masthead, original logo, account/period blocks and acknowledgment area. It includes branch summaries, services, actual product quantities, service findings/recommendations and all linked ocular findings. General assessment notes remain separate from each finding's notes. Owner copies include contribution figures; Supervisor copies omit pricing, costs, billing and profit. Signatures remain explicitly uncollected. There is no CSV export.

Dates filter each record's service/inspection date, not payment dates. Account grouping normalizes case and whitespace in existing client names; it does not create a new parent-account database entity. Product totals retain their captured units. Unconfirmed legacy financial records do not become confirmed merely by generating a report. Unenrolled prospect inspections are excluded until linked to a branch.

## Multiple ocular findings

An inspection supports 1–20 findings. Each finding records its inspected area, problem, recommended service, 1–20 selected products and optional notes. General inspection notes remain available separately. **Add finding** and **Remove finding** manage rows. Invalid rows reject the whole assessment before any write, retaining the entered form for correction. Selecting **Plan this treatment** on a finding uses that finding's recommended service.

Existing single-finding assessments migrate in memory without discarding their original fields or general notes. Stable service/product IDs preserve archived references. The local backend stores findings in its existing JSONB assessment record; no applied SQL migration was changed.

## Pest graph data

The original dataset contains **15 illustrative historical observations** for June–October 2026 and **3 illustrative completed service reports** for November 2, 2026. The graphs now combine those historical observations with the pest counts from saved service reports. New reports contribute their recorded counts; correcting a report changes its contribution. The source table identifies each source and links contributing service reports.

Monthly graphs show up to 12 calendar months ending at the latest observation. Missing records remain gaps rather than zero. Counts are sightings, not unique pests, and incomplete periods or synthetic starting data do not prove treatment effectiveness. Qualitative ocular findings do not add numeric pest counts. No external or live pest feed is connected.

## Persistence and verification limits

The UI remains browser-local on each origin. Demo role scoping never replaces the full workspace during saves. The separate local PostgreSQL/API workspace is not uploaded or implicitly merged. Existing owner data and private paperwork were not reset.

Desktop and narrow browser previews were checked. The print button invoked the browser print flow, but a PDF was not saved and its pagination was not visually accepted: the native browser window was minimized and inaccessible to the available native controls. The document preview is verified; exported pages, physical printing, physical phones and screen readers remain unverified. See [QA evidence](QA_ROLES_REPORTS_OCULAR.md).
