# Wave 3 Screen Refactor Beta Checklist

This checklist covers the manual device validation that cannot be proven by the automated test suite. Keep every item unchecked until it has been exercised on a physical device.

## Shared test data

- [ ] Sign in with a password account containing subscriptions, cards, and a profile image.
- [ ] Sign in with a Google-only account containing different data.
- [ ] Include monthly, yearly, paused, trial, and foreign-currency subscriptions.
- [ ] Confirm both accounts have visibly different names, cards, totals, and upcoming payments.

## Android phone

- [ ] Dashboard totals, upcoming payment, quick actions, and AI card update immediately after adding, editing, pausing, or deleting a subscription.
- [ ] Calendar repeats recurring payments in following months and opens the correct payment details.
- [ ] Analysis month bars open the payments for the selected month; category and upcoming-payment cards do not leave broken gaps.
- [ ] Wallet shows the correct linked subscriptions, monthly equivalents, card limits, and paused-subscription behavior.
- [ ] Settings profile name and image remain scoped to the signed-in account.
- [ ] Password accounts can change email/password and request a reset; Google-only accounts see provider-appropriate guidance.
- [ ] Account form fields remain visible above the keyboard and all Firebase failures use localized, user-friendly messages.
- [ ] Sign out from account A, sign in as account B, and verify that no account-A profile, subscription, card, total, notification, or widget value flashes on screen.
- [ ] Background/resume, biometric unlock, notification history, and widget refresh behave correctly.

## iPhone

- [ ] Repeat the Android functional checks on an iPhone with a notch or Dynamic Island.
- [ ] Headers, close buttons, modals, and bottom navigation remain inside safe areas in portrait and landscape.
- [ ] Keyboard avoidance works for account, subscription, and authentication forms.
- [ ] Face ID/passcode fallback and app background locking behave correctly.

## iPad

- [ ] Repeat dashboard, calendar, analysis, wallet, settings, and account flows on iPad Air.
- [ ] Cards use the available width without oversized empty columns or clipped controls.
- [ ] Rotation preserves layout, scroll position where reasonable, and modal usability.

## Release gate

- [ ] No crash, raw translation key, raw Firebase error, stale cross-account data, or clipped primary action was observed.
- [ ] Automated `npm run verify:release` passes on the exact commit selected for beta.
- [ ] A fresh native release build is installed and tested only after the user explicitly requests an APK/IPA build.

Status at creation: automated checks are run separately; physical-device checks above have not yet been performed.
