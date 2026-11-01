# Client and branch editing QA

Date: November 1, 2026. Owner follow-up: allow editing client/branch details, contact information and the contact person from Clients & branches.

## Implemented behavior

- Edit details is available in each client row and the client profile. Enrollment and editing share a prefilled form for account, branch, address, agreement duration/package/start/rate and separate contact person, role, phone and email fields.
- Contact fields are optional. Existing `contact` values remain contact roles rather than being guessed into person names. Legacy records without the new fields remain valid. Existing custom agreement durations/packages remain selectable when editing.
- Updates retain the client ID, related visits/reports, invoices, payment entries and captured historical charges. Duplicate account/branch pairs, invalid phone/email inputs and assessment relinking during edits are rejected before mutation.
- Contacts appear in client rows and profiles; search includes contact names, roles, phones and emails. Reminder previews use the named contact when available and include the email; they still send nothing.
- The backend `client` command accepts the existing client ID for updates. JSONB client payloads preserve the new fields without changing the applied SQL migration. UI persistence remains browser-local.

## Verification

- Full `npm test`: 36 passed, zero failed. Syntax checks and `git diff --check`: passed.
- Three tests in `tests/client-edit.test.js` cover stable IDs/history, trimming, duplicate/invalid inputs, missing IDs, assessment guards, optional contacts and legacy validation. A database test verifies command update/round-trip and exact retry without a second branch or changed invoices.
- Independent source review found no Important issues.
- Browser QA used isolated origin `127.0.0.1:4177`; existing owner origins and the persistent server workspace were not mutated.
- Edited Abenson's demo branch/address, contact person, phone, email and agreed rate. Invalid phone input showed the form error and prevented save. Corrected input saved, displayed the updated profile and retained the two service-history entries.
- Cancel discarded an unsaved contact-person change. Email search matched the edited record, and contact details survived reload.
- New enrollment succeeded with all optional contact fields blank. Only the isolated browser samples were restored afterward.
- Inspected desktop edit layout and narrow viewport. Contact fields stack at narrow widths, fit inside the dialog and use 16 px input text. Browser console warning/error log was empty. Temporary viewport overrides were reset.
- Restarted the persistent API owner gracefully on port 4176 to load the updated client command. No schema migration or record import was performed.

Evidence: `screenshots/client-editor-desktop.png` and `screenshots/client-editor-phone.png`. All entered contact details in those captures are synthetic.

## Limits

Physical phone hardware and screen-reader acceptance were not tested. The UI still saves in its browser origin; database UI cutover remains a separate milestone. The API is local development only, without production authentication or role enforcement. Contact validation checks basic format, not phone ownership or email delivery.
