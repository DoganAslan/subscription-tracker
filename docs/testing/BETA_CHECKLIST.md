# Physical-device beta checklist

This checklist supplies reproducible, user-owned release evidence. It is not an
automated test record and must be completed on a physical Android device before
release. Do not record this checklist as passed unless its named evidence exists.

## Preconditions and evidence

- Use a physical Android device with the current release candidate installed and
  the `SummaryWidget` already placed on the home screen.
- Set device timezone to **Europe/Istanbul**, base currency to **TRY**, and app
  language to the language named in each scenario. Record device model, Android
  version, app build, tester, timestamp (including `+03:00`), and a screenshot
  or screen recording for every result.
- Start from clean test data: delete the fixture names below from both user-owned
  test accounts, force-close/reopen the app once, sign in as Account A, and wait
  until the feed and widget show the empty or baseline state. Do not use a
  production account.
- After every add, edit, delete, pause, resume, language change, or account
  switch, wait at most **15 seconds** for the feed and widget to converge. After
  reconnecting, allow at most **30 seconds**. If the bound is missed, capture the
  state and record a defect rather than extending the wait.

## Fixed fixtures

Create these active, non-trial, non-split subscriptions with no card assignment:

| Account | Name | Amount/currency | Billing cycle | Renewal date | Expected monthly contribution |
| --- | --- | --- | --- | --- | --- |
| A | `W1-A-Monthly` | 120.00 TRY | monthly | 2030-06-20 | 120.00 TRY |
| A | `W1-A-Yearly` | 1200.00 TRY | yearly | 2030-06-25 | 100.00 TRY |
| B | `W1-B-Monthly` | 70.00 TRY | monthly | 2030-06-13 | 70.00 TRY |

Account A's baseline widget is **₺220.00**, with `W1-A-Monthly` as next
payment. Account B's widget is **₺70.00**, with `W1-B-Monthly` as next payment.

## Widget lifecycle refresh

1. In Account A, create the two Account A fixtures. Within 15 seconds, expect
   **₺220.00**, two active subscriptions, and `W1-A-Monthly` as next payment.
2. Add `W1-A-Added`: 30.00 TRY, monthly, 2030-06-15. Within 15 seconds, expect
   **₺250.00** and `W1-A-Added` as next payment.
3. Edit `W1-A-Added` to 50.00 TRY and 2030-06-10. Within 15 seconds, expect
   **₺270.00** and the same edited subscription as next payment.
4. Delete `W1-A-Added`. Within 15 seconds, expect the original **₺220.00** and
   `W1-A-Monthly` as next payment.
5. Pause `W1-A-Monthly`. Within 15 seconds, expect **₺100.00**, one active
   subscription, and `W1-A-Yearly` as next payment. Resume it and expect the
   **₺220.00** Account A baseline again within 15 seconds.

## Account isolation

1. Capture Account A's **₺220.00** widget and both `W1-A-*` records, then sign
   out. Within 15 seconds, expect no Account A data in the signed-out widget or
   feed state.
2. Sign in as Account B and create `W1-B-Monthly` if it is absent. Within 15
   seconds, expect only `W1-B-Monthly`, **₺70.00**, and that name as next payment;
   `W1-A-Monthly` and `W1-A-Yearly` must be absent from feed and widget.
3. Sign back into Account A. Within 15 seconds, expect its **₺220.00** baseline
   and no `W1-B-Monthly` data.

## Localized widget labels

1. With Account A's baseline present, set the app/device language to Turkish,
   refresh by editing `W1-A-Monthly` from 120.00 to 121.00 TRY and back to 120.00
   TRY. Within 15 seconds after each edit, expect `AYLIK TOPLAM`, `SIRADAKİ
   ÖDEME`, and `aktif abonelik` on the widget; total must return to **₺220.00**.
2. Set the language to English and repeat the same two edits. Within 15 seconds,
   expect `MONTHLY TOTAL`, `NEXT PAYMENT`, and `active subscriptions`; total must
   return to **₺220.00**.
3. Capture each language state. Any untranslated label or cross-language mixture
   is a defect.

## Calendar renewal equivalence

1. In Account A, verify `W1-A-Monthly` shows 2030-06-20 in the feed and calendar;
   the widget must name it as the next payment. Capture all three views.
2. Edit its renewal date to 2030-06-18. Within 15 seconds, feed and calendar must
   both show 2030-06-18 and the widget must still name `W1-A-Monthly` as next.
3. Restore 2030-06-20 and confirm the same three surfaces converge within 15
   seconds.

## Offline and reconnect behavior

1. With Account A's **₺220.00** baseline visible, open Android **Settings >
   Network & internet**, enable **Airplane mode**, return to the feed, and wait no
   more than 15 seconds. Capture the cached state or user-safe offline state; no
   raw Firebase, Google, Expo, or native error code may be shown.
2. In the same Settings path, disable Airplane mode. Return to the app and perform
   exactly one normal pull-to-refresh on the feed. Within 30 seconds, expect the
   Account A baseline (**₺220.00**, two records, no duplicates) and matching widget
   data, with no Account B data.
3. Capture pre-offline, offline, and post-refresh evidence, including the system
   clock and the Airplane mode transition.

## Beta sign-off

Physical-device testing status: **user-owned release evidence; not run by
automation**.

Release owner: ____________________  Date: ____________________

Device/build evidence location: ____________________________________________
