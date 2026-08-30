# iOS Foundation Verification Checklist

Use this checklist for each candidate build. Record the actual device or viewport,
the action performed, the observed result, and a pass/fail decision. A blank
observation is not a pass.

| # | Device / viewport | Action | Expected result | Observed result | Pass / fail |
|---|---|---|---|---|---|
| 1 | iPhone portrait (compact width) | Open Home, List, Analytics, Calendar, and Settings | Each tab renders full-width content with no horizontal clipping or phantom column | _Record observation_ | _Pending_ |
| 2 | iPhone portrait | Open Add Subscription, focus each field, scroll, and save a valid subscription | Keyboard does not hide the first action tap; final save action remains reachable above the keyboard | _Record observation_ | _Pending_ |
| 3 | iPhone portrait | Open an existing subscription, edit a field, update, then open delete confirmation | Update and delete actions remain visible/reachable and retain their existing behavior | _Record observation_ | _Pending_ |
| 4 | iPhone portrait | Open account email-change and password-change modals; focus fields and submit | Modal card stays within the visible area, buttons remain above the keyboard, and taps are not swallowed | _Record observation_ | _Pending_ |
| 5 | iPhone portrait | Open AI chat, focus the input, tap a quick suggestion, and send a message | Quick suggestion submits on the first tap; chat input and send control stay above the keyboard | _Record observation_ | _Pending_ |
| 6 | iPhone landscape | Rotate while Home, List, Analytics, Calendar, and Settings are open | Tab bar, close buttons, headers, and submit actions remain inside the viewport | _Record observation_ | _Pending_ |
| 7 | iPhone with notch / Dynamic Island | Open each primary tab and both account modals | Top headers and close controls remain below the top safe-area inset | _Record observation_ | _Pending_ |
| 8 | iPad portrait | Open Analytics and Home | Content is centered; analytics paired cards use two flexible columns; text does not stretch edge-to-edge | _Record observation_ | _Pending_ |
| 9 | iPad landscape | Rotate from portrait with Analytics open | Card columns and tab indicator update without restarting the app | _Record observation_ | _Pending_ |
| 10 | iPad split view, narrow width | Resize the app to a compact split-view width | Content switches to one column, gutters remain usable, and tab indicator tracks the new width | _Record observation_ | _Pending_ |
| 11 | iPad split view, wide width | Resize back to a regular width | Content returns to the regular centered/two-column layout without stale spacing | _Record observation_ | _Pending_ |
| 12 | Android phone | Render/update the home widget after adding or changing a subscription | Android widget keeps its existing data contract, right border, and refreshed totals | _Record observation_ | _Pending_ |
| 13 | Android phone | Add and edit a subscription with the keyboard open | Existing save/update behavior succeeds and the form remains usable | _Record observation_ | _Pending_ |

## Automated gate

Run from the repository root and attach the command output to the test record:

```powershell
npx jest --runInBand
npx tsc --noEmit
npx expo-doctor
npx expo export --platform ios --output-dir .expo-ios-foundation-check --clear
npx expo export --platform android --output-dir .expo-android-regression-check --clear
```

The automated gate does not replace the physical-device rows above. Signed iOS
credentials, Firebase iOS configuration, and App Check enforcement remain
follow-on delivery gates.
