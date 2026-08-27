# Physical-device beta checklist

This checklist supplies deterministic, user-owned release evidence. It is not an
automated test record and must be completed on a physical Android device before
release.

## Evidence convention

For each check, record the tester, device model, Android version, app build,
date/time, subscription names and values used, observed result, and a screenshot
or screen recording. Record a defect link if the observed result differs from
the expected result.

## Widget lifecycle refresh

1. Add a subscription with a distinct name, amount, currency, billing cycle, and
   renewal date. Expected: the home-screen widget refreshes with the revised
   monthly total and next payment without requiring a widget re-add.
2. Edit that subscription's amount and renewal date. Expected: the widget shows
   the updated monthly total and next payment.
3. Delete the subscription. Expected: it no longer appears in widget totals or
   next-payment information.
4. Pause and resume an active subscription. Expected: pausing removes its active
   cost from the widget total and resuming restores it; the widget refreshes after
   each action.

## Account isolation

1. Sign in as Account A and create a uniquely named subscription. Capture the
   feed and widget values.
2. Sign out, then sign in as Account B with a different uniquely named
   subscription. Expected: Account A's subscription, amounts, and next payment
   do not appear in Account B's feed or widget.
3. Switch back to Account A. Expected: Account A's own data returns and Account
   B's data remains absent.

## Localized widget labels

1. Set the device/app language to Turkish and refresh the widget through an
   add or edit. Expected: all widget labels use Turkish translations.
2. Set the device/app language to English and refresh the widget through an add
   or edit. Expected: all widget labels use English translations.
3. Capture both widget states, including labels and values, as release evidence.

## Calendar renewal equivalence

1. Create or edit a subscription with a known renewal date and a recurring
   billing cycle.
2. Compare the feed's next renewal date with the calendar entry for that
   subscription. Expected: the same subscription name and date are shown in both
   places.
3. Change the renewal date, refresh the calendar/feed, and repeat the comparison.
   Expected: both surfaces show the same revised date.

## Offline and reconnect behavior

1. With a populated feed, disable network connectivity. Open the feed and make
   a safe observation of the displayed cached content. Expected: no raw Firebase,
   Google, Expo, or native error codes are shown to the user.
2. Restore connectivity and wait for the feed refresh indicator or perform the
   normal safe refresh action. Expected: the feed reconnects and shows current
   account data without duplication or cross-account leakage.
3. Capture before-offline, offline, and post-reconnect evidence plus the network
   transition method used.

## Beta sign-off

Physical-device testing status: **user-owned release evidence; not run by
automation**.

Release owner: ____________________  Date: ____________________

Device/build evidence location: ____________________________________________
