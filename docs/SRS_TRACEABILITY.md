# SRS and paperwork traceability

The unchanged `ZEALPRO - SRS.pdf` is the primary requirements source. This table describes a local UI demonstration, not production acceptance.

## Owner revision 2

The six follow-up comments extend the initial demonstration: services now include descriptions, charges, planned expenses and multiple estimated products; products include descriptions, units, costs and stock thresholds. Both catalogs support editing, archival and restoration. Reports accept multiple actual product quantities, costs and charges; corrections adjust stock by the difference. Visits and reports retain captured prices. Calendar Month, Week and Day views show scoped contribution, with selected-day details on the right at desktop widths. The workspace uses a stronger navy/lime brand system. See `QA_REVISION2.md`. The revision supersedes the initial table’s single-product and missing-snapshot limitations.

| Source | Requirement | Demonstrated behavior | Production work remaining |
| --- | --- | --- | --- |
| SRS p. 1, §1 | Management hierarchy and fulfillment visibility | General manager workspace; assigned technicians; completion summary | Authentication and General Manager, Administrator, Supervisor 1/2 and Technician authorization |
| SRS p. 1, §2 | Six treatment categories | Surface spraying, Misting, Gel bathing, Rodenticide, Termicide and Rodent traps in forms and records | Confirm service taxonomy and material suitability |
| SRS p. 1, §3 step 1 | Ocular visit, staff, timestamp, inspected area, standardized problem/solution/material | Assessment form supports a prospect before enrollment and existing branches | Multiple required materials, attachments, approval and durable storage |
| SRS p. 2, step 2 | Enrollment duration, service package, agreed rate | Branch enrollment and agreement profile, linked from prospect assessment | Signed agreements, versioning, renewals and rate governance |
| SRS p. 2, step 3 | Calendar, location, treatment, technician, allocation, expected income | Interactive calendar; validated service creation; branch location; day totals and per-visit projected income | Duration-aware dispatch, recurrence, travel and multi-person teams |
| SRS p. 2, step 4 | Execution time, location, materials used, deductions, expenses, billable treatment | Completion form; atomic local stock deduction; actual expenses and report contribution calculation | Multiple personnel/material lines, cost snapshots, actual billing and durable transaction safety |
| SRS p. 2, step 5 | Automatic service report and comparative observations | Formal report generated at completion; branch, technician, time, findings, recommendation and prior same-pest observation | Client-approved report format, signature workflow, durable PDF and corrections/audit trail |
| SRS pp. 2–3, step 6 | Billing breakdown, collection, payment proof and standing accounts | Sample invoices, balances, due status, payment reference, payment history and reminder preview | Invoice issuance, tax/discount rules, verified proof uploads, receipts and live delivery |
| SRS p. 3, checklist 1 | Real-time inventory deduction | Completion deducts once; available stock subtracts planned allocations; restock | Multi-user concurrency, movement ledger, batch/expiry tracking |
| SRS p. 3, checklist 2 | Automatic report compilation | Treatment data populate report without retyping | Approved templates, revision rules and immutable copies |
| SRS p. 3, checklist 3 | Qualitative analytics and trends | Dated pest counts by branch; findings, recurrence comparison and trend graph | Validated taxonomy, sampling protocol and defensible effectiveness analysis |
| SRS p. 3, checklist 4 | Business accounts and branch histories | Account/branch list, agreement profile and service history | Parent-account grouping, client access and historical migration |
| SRS p. 3, checklist 5 | Task fulfillment tracking | Queue status and computed completion ratio | Supervisor verification, exception reasons and notifications |
| SRS p. 3, checklist 6 | Interactive calendar | Month navigation, day selection and status filter | Rescheduling, cancellation, time zones and recurrence rules |
| SRS p. 3, checklist 7 | Receivables and automated reminders | Outstanding/overdue filters and actual reminder copy preview | Approved message templates, scheduler, delivery provider and audit logs |

## Owner payment-standing follow-up

The approved follow-up separates fulfillment from payment standing. Completed services retain their fulfillment status while payment is unpaid, partial, paid or overdue. New completion creates a linked local receivable due 30 calendar days after delivery, with due/countdown labels across the workflow. This extends SRS step 6 and checklist 7. Existing invoices retain captured dates and payments; unlinked historical services require explicit billing review rather than an assumed unpaid balance. See `QA_SERVICE_PAYMENTS.md`.

## Roles, cumulative reporting and multiple findings follow-up

The three rendered SRS pages were reviewed again for this change. Page 1's hierarchy maps provisionally to Owner (General Manager/Administrator), Supervisor (1/2) and Technician; the detailed feature allocation is implementation judgment because the SRS does not prescribe it. Public demo login checks cover routes, actions, record identity and protected finance inputs. Secure authentication and server authorization remain production work.

Ocular assessments now accept multiple findings and multiple recommended products per finding, with non-destructive legacy migration. Cumulative account/branch/date reports extend SRS page 3's account history and report compilation requirements. At the owner's direction they use the existing branded PDF preview/print format, without CSV. Account names are normalized for grouping; durable parent-account entities, signed copies and audited revisions remain future work. Pest analytics now identifies illustrative historical observations and saved service-report counts; qualitative inspections are excluded from numerical counts. See [role/report guide](ROLES_AND_REPORTS.md) and [QA](QA_ROLES_REPORTS_OCULAR.md).

## Paperwork mapping

The Zealpro service report photographs supply account name, address, report number, date, time-in/out, service category, treatment location/method/count, materials, findings, recommendation, remarks, and customer/representative acknowledgment. Their handwritten signatures and uncertain entries were not copied into the dataset. The demo reports explicitly say that signatures were not collected.

The Diversey report supplies a secondary example of inspected premises, sanitation concerns and treatment documentation. Its logo and commercial identifiers are not used in the Zealpro interface.

## Assumptions needing client decisions

Confirm the spelling and meaning of “Gel bathing,” whether materials and amounts require independent approvals, invoice/tax rules, account-to-branch structure, role permissions, pest severity/count conventions, multiple technicians per visit, and whether the client-facing report should include financial contribution data. The current report includes a demonstration financial section to make SRS profit-versus-expectation behavior reviewable; it needs approval before real client use.
