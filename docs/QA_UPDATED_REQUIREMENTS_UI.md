# Updated requirements UI QA

Date: 2026-11-04. Source: unchanged 11-page updated PDF, SHA-256 `a4f401589a7de1c6b7c9bb0d2ee76c37ade2c97dbc5e8e580b0d27b5ba8b8708`. Original SRS preserved. Owner explicitly requested UI-first implementation without backend integration.

## Screen mapping

| Requirement | Presentation behavior | Deferred production work |
| --- | --- | --- |
| UI-01 | Four roles/five logins, scoped dashboards and fields | Authentication and safe server payloads |
| UI-02 | Owner definitions, Admin rate requests, operational instructions/costs | Server pricing and contract authority |
| UI-03 | Restricted agreements, contacts/history and lifecycle labels | Shared storage and signed agreements |
| UI-04 | Ocular draft/submit/return/approve, findings/history | Durable approvals and attachments |
| UI-05 | Multiple personnel, conflicts, reschedule/cancel and reservations | Real dispatch, durations and concurrency |
| UI-06 | Technician drafts, protected costs/charges, expense ownership and reviews | Authenticated transactions |
| UI-07 | Locked approvals, versions, approval references and branded PDF preview | Immutable PDF storage, signatures and pagination acceptance |
| UI-08 | Scoped sources and previous/current branch/pest records | Validated sampling and imported evidence |
| UI-09 | Stock quantities/costs, movements, net corrections and adjustment requests | Stock locations, durable ledger and concurrent updates |
| UI-10 | Pending/proof/verify/partial/reversal; reminder schedule and simulation/retry | Payments, private files, actual messaging/consent/scheduler |
| UI-11 | Staff profiles, access/team/delegation, prepared invitations and scoped activity | Supabase Auth/RLS, invitations/reset and append-only audit |

## Automated evidence

- Full suite: **90 passed**, no failures/skips/cancellations.
- Syntax checks passed; static build contains **14 browser files**.
- Dependency audit: zero vulnerabilities. Whitespace checks passed.
- No changes to `backend/`, applied migrations, `src/model.js` or `src/data.js`. DB tests use isolated memory/temporary workspaces.
- Policy tests cover five credentials, inactive users, stable identities, team/co-personnel scope, Admin commercial versus Owner margin access, delegation and actions.
- Domain tests cover draft/submit/return/approve/amend, stock once/net corrections, cancellation/conflicts, payment verification/reversal, proof validation, reminder simulations, rate requests, team/client lifecycle and explicit legacy confirmation.
- A Node VM test loads actual modules and renders all five profiles over eleven route templates. It checks links, field/PDF boundaries, locks, unapproved cumulative exclusion, legacy confirmation and colleague expenses. It invokes the actual submit event handler to prove staged revenue survives correction. Small DOM stubs make this a template/controller check, not a browser/visual test.

## Independent review

A fresh builder checked the browser-only seam. Independent final UI/domain reviews found expense ownership, early amendment billing, all-personnel team checks, unconfirmed legacy contribution and unreachable legacy payment reconciliation. Fixes include meaningful regressions. A further submit-handler regression reproduced staged revenue changing from 7500 to 6500 before the fix and passed afterward. Scoped re-review confirmed all prior findings resolved.

Final Hallmark app static scan: zero failures/reflexes/warnings, 214 existing spacing waivers and three answered Finish findings. Taste: zero failures and five intentional warnings for overlay shadows/ISO-date padding. All six source-asset hashes matched, including the updated PDF; the logo copy is byte-identical. Graphify refreshed to 593 nodes with no dangling endpoints or private/generated workspace nodes. Optional SQL AST extraction remains unavailable. Static scans do not establish visual acceptance.

## Browser limitation

Fresh static origin `http://127.0.0.1:4494/` did not open the owner's database. The browser bridge could create blank tabs but navigation failed. Computer Use then stopped native controls because it could not identify the Windows browser URL confidently enough to enforce policy. No further Computer Use, raw CDP, external Playwright/Puppeteer or alternative browser automation was attempted.

No current visual/mobile screenshot, browser interaction pass, saved-PDF pagination or physical-device acceptance is claimed. Earlier branding screenshots cover the previous milestone only. Client visual review remains necessary. No owner operational records were reset/imported; no real reminder, invitation, credential, payment or cloud resource was created.

## Hosting verification

The existing Git-connected Vercel deployment is checked after pushing verified source to main. HTTP/artifact results are appended below; browser limitations remain separate.
