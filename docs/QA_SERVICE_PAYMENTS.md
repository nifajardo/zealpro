# Service payment standing QA

Date: November 1, 2026. Approved follow-up: retain Completed fulfillment and display separate payment standing, with payment due within 30 calendar days of delivery.

## Behavior

- New completion creates one linked local receivable using the confirmed actual charge. The delivery date is the service/report date, even if recorded later.
- Unpaid completed services display Completed and Awaiting payment. Partial payments show Partially paid; full payment shows Paid. Unsettled balances become Overdue after the due date, including partial balances.
- Payment details show the due date, outstanding balance and Due in N days, Due today, or Overdue by N days. Status calculations use the demonstration's fixed November 2, 2026 sample date.
- Calendar Month/Week details and Day agenda, overview rows, visit dialogs, report views, branch history and billing share the same linked invoice balance. Payment changes do not affect service fulfillment or recognized contribution.
- Report charge corrections update linked balances, preserve due dates/payments, and reject changes below amounts collected before changing stock or report records.
- Older invoices retain their dates, balances and payment history. No invoice is automatically associated by client name. Historical unlinked completed services display Payment not linked. Their confirmed reports can be explicitly linked to an unlinked same-client, same-charge service invoice or a new balance after the owner checks existing billing. Consolidated account invoices need separate reconciliation.

## Automated checks

`npm test`: 25 passed, zero failed. `npm run check`: passed.

Seven new tests in `tests/service-payment.test.js` cover calendar-month/year/leap-year due boundaries, invalid and overflowing dates, one-time receivable creation, due-day/partial/overdue/full settlement, atomic correction guards, unchanged legacy records, reviewed matching invoice links, invalid/duplicate links, unconfirmed historical charges and zero-charge fulfillment. Existing version-one migration fixtures omit the newly introduced linked-service seed records; preservation assertions remain in place.

## Browser verification

Connected Brave browser, isolated loopback origin `127.0.0.1:4175`. Existing owner records on port 4174 were not mutated or reset.

- Observed Completed with Awaiting payment, Partially paid and Paid in the Day agenda and right-hand details.
- Recorded PHP 1,000 against Abenson's PHP 4,500 service balance. Calendar changed to Partially paid / PHP 3,500 remaining; the state survived reload.
- Completed Eastbridge's scheduled service through the actual report form. It created a PHP 8,000 unpaid balance due December 2, 2026, visible in the report and visit dialog. Full settlement changed payment to Paid while service remained Completed and actual contribution remained PHP 7,750.
- Billing displayed linked completion, captured due dates, collected and remaining amounts. Partial filter included partially collected overdue balances. Overdue filter displayed the existing invoice overdue by three days.
- Inspected the service payment detail at a narrow browser viewport (requested 390 by 844; effective page width reported 312 CSS px in this browser). The dialog wrapped its payment details without horizontal overflow. The viewport override was reset afterward.
- Browser warning/error log was empty after interaction checks. Isolated seed records were restored through the app guide after mutation tests.
- Independent read-only review reported no Important findings.

Evidence: `screenshots/service-payments-desktop.png` and `screenshots/service-payments-phone.png`.

## Limits

This remains a local UI demonstration with a fixed sample status date, not live accounting or legal invoice issuance. Historical billing-link choices and date boundaries have automated coverage; the legacy review form was inspected in source but was not exercised against imported historical browser data. Physical phone hardware and screen-reader acceptance were not tested.
