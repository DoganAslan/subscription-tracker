# Subscription form Wave 2 beta checklist

This checklist records the release evidence for the Wave 2 subscription-form
refactor. Automated checks and physical-device checks are kept separate so an
unrun device scenario cannot be mistaken for a passing result.

## Automated checkpoint

Verified on 2026-08-28 from branch `codex/deep-refactor`:

- [x] Subscription-form scope: 7 suites and 51 tests passed.
- [x] Full Jest suite: 18 suites and 151 tests passed.
- [x] Translation and widget verification: 5 tests passed.
- [x] Legacy behavior verification: 22 of 22 scenarios passed.
- [x] Firebase Functions AI tests: 3 tests passed.
- [x] Firestore rules: 8 tests passed.
- [x] TypeScript, Firebase Functions build, and lint passed.
- [x] Application and Functions production audits reported 0 vulnerabilities.
- [x] Expo Doctor passed 21 of 21 checks.
- [x] Android production JavaScript export completed successfully.

The checkpoint did not build an APK or IPA and did not deploy Firebase.

## Test record

Complete this once for each tested build.

| Field | Value |
| --- | --- |
| Tester | |
| App version/build | |
| Device and OS | |
| Language | Turkish / English |
| Theme | Light / Dark |
| Date and timezone | |
| Evidence location | |

Use a non-production test account. For every failed scenario, record the exact
input, a screenshot or screen recording, and whether the device was online.

## Core add and edit flow

- [ ] Add a monthly subscription using only name, category, amount, currency,
  and renewal date. Confirm it appears once in the list, calendar, analysis,
  and widget.
- [ ] Edit its name, amount, category, currency, billing cycle, and renewal
  date. Confirm every dependent screen updates without duplicate records.
- [ ] Tap Save repeatedly while the request is pending. Confirm only one write
  occurs and the screen closes once after success.
- [ ] Disconnect the device immediately before Save. Confirm the form remains
  open with all values intact, a user-safe error is shown, and no success
  navigation occurs.
- [ ] Reconnect and retry. Confirm the successful retry creates or updates only
  one record.
- [ ] Delete an existing subscription while online. Confirm the screen closes
  only after the deletion succeeds and the record disappears from dependent
  views.
- [ ] Attempt deletion while offline. Confirm the edit screen remains available,
  the record is not removed locally, and a user-safe retry message is shown.
- [ ] Cancel from both add and edit screens. Confirm no unsaved value is written.

## Optional subscription details

- [ ] Enable a free trial, choose a trial end date, save, reopen, and confirm the
  trial values are preserved.
- [ ] Enable a contract, choose a contract end date, save, reopen, and confirm
  the contract values are preserved.
- [ ] Enable split payment, add at least two members, remove one, save, and
  confirm the remaining member and share amount are correct.
- [ ] Assign a payment card, save, reopen, then change and remove the card.
  Confirm the displayed card association follows each change.
- [ ] Change reminder settings and confirm they survive an edit/reopen cycle.

## Receipt scan

- [ ] Deny photo permission. Confirm the current form values remain unchanged
  and a localized explanation is shown.
- [ ] Open the picker and cancel. Confirm no field is cleared or overwritten.
- [ ] Scan a readable receipt. Review the proposed name, amount, currency, and
  billing cycle before saving; confirm only recognized fields change.
- [ ] Try an unreadable or unsupported image and a temporary offline failure.
  Confirm entered values remain intact and raw service errors are not exposed.
- [ ] Start two scans in quick succession. Confirm an older late response cannot
  overwrite the newest result.

## Budget confirmation

- [ ] Save while below the monthly budget. Confirm no warning is shown and one
  mutation occurs.
- [ ] Save an item that exceeds the budget, then cancel the warning. Confirm no
  mutation or navigation occurs and the form remains populated.
- [ ] Repeat and confirm the warning. Confirm exactly one mutation occurs and the
  screen closes once after success.
- [ ] Edit an existing subscription above the limit. Confirm the old amount is
  replaced in the projection instead of being counted twice.

## Responsive layout and accessibility

- [ ] On a small Android phone, open the keyboard in every text field and modal.
  Confirm the active field, validation message, buttons, picker selections, and
  close controls remain reachable.
- [ ] On an iPhone with a notch or Dynamic Island, confirm the header, close/back
  controls, modals, and bottom actions stay inside the safe area in portrait and
  landscape.
- [ ] On iPad, confirm the form uses the available width without clipped controls,
  oversized gaps, or content under system areas.
- [ ] With large text/font scaling enabled, confirm labels wrap and controls do
  not overlap or move off screen.
- [ ] With a screen reader, confirm fields and selected picker options have clear
  labels and state announcements.

## Localization and themes

- [ ] Run the complete add/edit flow in Turkish light mode.
- [ ] Run the complete add/edit flow in Turkish dark mode.
- [ ] Run the complete add/edit flow in English light mode.
- [ ] Run the complete add/edit flow in English dark mode.
- [ ] Confirm no translation key, mixed-language fallback, raw Firebase/Expo
  message, or platform-only placeholder appears in any state.

## Residual risks before beta sign-off

- Physical Android, iPhone, and iPad interaction and visual checks above have not
  been run by automation.
- Native photo permission, camera-roll behavior, keyboard variants, screen-reader
  output, safe areas, and notification scheduling require device evidence.
- The JavaScript export proves bundling, not installability; an APK/IPA must be
  built and installed only when the release owner requests it.
- Firebase rules and Functions were tested locally, but this Wave did not deploy
  them or change production configuration.

## Sign-off

Physical-device status: **not run by automation**

Release owner: ____________________  Date: ____________________

Open defects / evidence: _________________________________________________
