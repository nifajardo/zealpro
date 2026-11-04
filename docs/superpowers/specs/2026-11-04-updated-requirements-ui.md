# Updated requirements presentation scope

## Authority and intent

The owner requested implementation of the 11-page local `ZEALPRO UPDATED REQUIREMENTS.pdf` as a UI-first client presentation, explicitly without backend work. Its SHA-256 is `a4f401589a7de1c6b7c9bb0d2ee76c37ade2c97dbc5e8e580b0d27b5ba8b8708`. This supersedes the earlier provisional three-role allocation. The original and updated PDFs remain private, unchanged and excluded from Git/static output.

Retain native browser modules, the current navy/lime brand and existing report templates. Build working browser-local demonstration flows. Do not provision Supabase, alter backend modules/migrations, migrate owner data, send messages, create real invitations or claim production authorization. The PDF's backend acceptance criteria remain deferred by the owner's explicit instruction.

## Presentation requirements

- **UI-01–03:** Separate Owner, Administrator, Supervisor and Technician dashboards, field visibility, service definitions and client agreements. Owner alone sees contribution after direct job costs. Administrator sees commercial values and catalog costs, not margins. Supervisors see assigned costs and expenses, never rates, revenue, receivables, payment status or contribution. Technicians see assigned work and their expense submissions, not material costs or commercial values. Commercial terms must be absent from field-role client profiles.
- **UI-04:** Ocular Draft, Submitted, Approved and Returned states, individual findings, reviewer/action history, editable drafts and returned records. Only approved findings inform enrollment/planning. Supervisor cannot approve an assessment they performed.
- **UI-05:** Multiple personnel, staff conflicts, reservations, scoped scheduling, rescheduling and cancellation with a reason. Field users never edit charges. Staff scope uses explicit sample teams and branch associations.
- **UI-06–07:** Save draft, Submit for review, Return for correction, Approve & finalize and authorized amendment. Submission posts actual use once and releases reservation; approval creates billing and locks the report. Return/correction changes only the net usage. Preserve previous report versions and review history. No self-approval for performing Supervisors. Final PDF includes approval reference, personnel, material quantities and previous/current findings; draft/submitted copies identify their state.
- **UI-08:** Owner/Admin company-wide, Supervisor assigned branches/jobs, no Technician analytics. Show previous/current branch/pest comparisons with explicit no-data states and source provenance; avoid causal effectiveness claims.
- **UI-09:** Owner/Admin product maintenance/restock. Supervisor read-only assigned unit costs and stock-adjustment requests. Technician job-relevant quantities only. Show stock reservations, consumed quantities and movement history; cancellation releases unconsumed reservations.
- **UI-10:** Owner/Admin billing from approved work only. Demonstrate pending payment with optional proof, verification, partial history, Owner-only reversal with reason, reminder schedule and simulated delivery/retry logs. Label delivery as simulation and do not contact anyone.
- **UI-11:** Owner manages roles, active status, team/branch mapping, collection delegation and global settings. Admin maintains non-sensitive profiles and prepares invitations but cannot elevate roles. Supervisor sees own team; Technician sees self. Include scoped activity history.

## Defaults for the presentation

The document explicitly leaves several business decisions pending. For this demonstration, use its defaults: assigned Supervisor ocular approval, assigned-team scheduling, Owner override, delegated Admin collections, reviewed technician expenses, and customer acknowledgment marked uncollected. Email reminder preview is the initial channel; SMS/real sending remain unconfigured. These are demo choices for review, not accepted production policy.

There are four roles and five public test accounts: Owner, Administrator, Supervisor 1, Supervisor 2 and Technician. Preserve existing public passwords; add separate Administrator and Supervisor 2 presets. Existing completed sample reports are labeled approved legacy samples. Do not invent past human approval signatures. Preserve legacy operational and payment records.

## Implementation boundaries

`src/access.js` owns capabilities and team/record scoping. `src/presentation.js` owns browser-only workflow metadata and demo transitions using existing shared domain operations. Metadata lives inside the full browser workspace under `presentation`; existing backend modules are untouched. The app persists full state, never a role-scoped projection. `src/app.js` integrates existing controls and new settings/review/history panels. New report exports use the existing native Print / Save as PDF workflow, not CSV. Backend API/RLS/private storage, real authentication, durable audit, mail/SMS, immutable server PDFs and production multi-user acceptance remain deferred.

## Review and acceptance

Verify all five public accounts, deep-link/dialog restrictions, role-specific PDF fields, two-team separation, draft/return/approval/amendment, stock posting once, deferred billing, payment verification/reversal, proof/reminder simulations and narrow technician flows. Run existing tests and new domain-policy tests, syntax/build/whitespace checks, and real-browser QA on a disposable static origin. Record separate UI-demo versus production acceptance in the handoff. Commit/push directly to main after verification, per standing instructions.
