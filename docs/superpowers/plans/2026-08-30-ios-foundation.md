# SubMate iOS Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current Expo application safe to load on iOS, responsive on iPhone and iPad, and reliable around safe areas, the software keyboard, and modal forms without regressing Android.

**Architecture:** Keep the shared application layer platform-neutral. Resolve the Android widget implementation through React Native platform-specific modules, provide explicit iOS/web no-op adapters with the same contract, and centralize responsive geometry in small pure helpers. Existing screens will consume a shared centered-content primitive instead of carrying unrelated device-width rules. Native credentials, App Check, and TestFlight remain later delivery gates because they require Apple/Firebase account material and physical-device evidence.

**Tech Stack:** Expo 57, React Native, Expo Router, TypeScript, Jest, React Native Testing Library, EAS.

**Spec:** `docs/superpowers/specs/2026-08-30-ios-readiness-design.md`

## Global Constraints

- [ ] Preserve all pre-existing dirty worktree changes; stage only files belonging to the active task.
- [ ] Do not build an APK unless the user explicitly asks for one.
- [ ] Keep Android widget behavior and its existing data contract unchanged.
- [ ] Do not add a native iOS widget in this plan; iOS receives a typed no-op adapter.
- [ ] Do not add secrets, Firebase plist contents, certificates, or Apple credentials to source control.
- [ ] Use test-first changes: demonstrate the targeted failure, implement the minimum fix, then run focused and broad verification.
- [ ] Commit each task separately so any regression can be isolated or reverted.

---

## Task 1: Isolate the Android Widget Behind Platform Modules

**Files:**

- Rename: `src/services/background/widgetSync.tsx` → `src/services/background/widgetSync.android.tsx`
- Create: `src/services/background/widgetSync.ios.ts`
- Create: `src/services/background/widgetSync.web.ts`
- Create: `src/services/background/widgetSync.ts`
- Create: `tests/unit/widget/widgetSyncPlatform.test.ts`
- Verify: `src/services/background/WidgetSyncBridge.tsx`

- [ ] **Step 1: Write the failing platform-contract test**

```ts
import * as iosWidgetSync from '@/services/background/widgetSync.ios';
import * as webWidgetSync from '@/services/background/widgetSync.web';

const adapters = [iosWidgetSync, webWidgetSync];

describe.each(adapters)('non-Android widget adapter', adapter => {
  it('keeps the shared contract without doing native work', async () => {
    expect(adapter.BACKGROUND_WIDGET_SYNC_TASK).toBe('BACKGROUND_WIDGET_SYNC_TASK');
    await expect(adapter.updateWidgetData([], 'TRY', 'tr')).resolves.toBeNull();
    await expect(adapter.clearWidgetData('TRY', 'tr')).resolves.toBeUndefined();
    await expect(adapter.triggerWidgetSync('user-1')).resolves.toBeUndefined();
    await expect(adapter.registerBackgroundSync()).resolves.toBeUndefined();
    expect(adapter.resetWidgetSync()).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test and confirm the expected missing-module failure**

Run:

```powershell
npx jest --runInBand tests/unit/widget/widgetSyncPlatform.test.ts
```

Expected: FAIL because the `.ios` and `.web` adapters do not exist.

- [ ] **Step 3: Move the current implementation to the Android-specific module**

Preserve the complete current implementation and its exports in
`widgetSync.android.tsx`. Do not alter subscription calculation, debounce,
background-task registration, or `react-native-android-widget` usage in this
step.

- [ ] **Step 4: Add typed no-op adapters for iOS and web**

Both files must export the same public contract:

```ts
import type { Subscription } from '@/services/firebase/types';

export const BACKGROUND_WIDGET_SYNC_TASK = 'BACKGROUND_WIDGET_SYNC_TASK';

export const updateWidgetData = async (
  _subscriptions: Subscription[],
  _baseCurrency = 'TRY',
  _language = 'tr',
) => null;

export const resetWidgetSync = () => undefined;
export const clearWidgetData = async (
  _targetBaseCurrency?: string,
  _targetLanguage?: string,
) => undefined;
export const triggerWidgetSync = async (_userId: string) => undefined;
export const registerBackgroundSync = async () => undefined;
```

Use this implementation in both `widgetSync.ios.ts` and `widgetSync.web.ts`.
The underscore-prefixed parameters deliberately preserve the shared signature
without unused-parameter lint noise.

- [ ] **Step 5: Add the neutral Jest/Node resolver entry point**

```ts
export * from './widgetSync.android';
```

Metro chooses `.android`, `.ios`, or `.web` before the neutral file. Jest uses
the neutral file, so the existing Android widget tests continue to exercise the
real implementation with their existing native-module mocks.

- [ ] **Step 6: Run focused widget verification**

Run:

```powershell
npx jest --runInBand tests/unit/widget/widgetSyncPlatform.test.ts tests/unit/widget/widgetSync.test.tsx tests/components/widget/WidgetSyncBridge.test.tsx tests/components/widget/SummaryWidget.test.tsx
npx tsc --noEmit
```

Expected: all tests PASS and TypeScript reports no errors.

- [ ] **Step 7: Verify the iOS bundle cannot reach the Android widget package**

Run:

```powershell
npx expo export --platform ios --output-dir .expo-ios-foundation-check --clear
```

Expected: export succeeds. Inspect the generated Metro module list/output and
confirm that the resolved application import is `widgetSync.ios.ts`, not
`widgetSync.android.tsx`.

- [ ] **Step 8: Commit only Task 1 files**

```powershell
git add src/services/background/widgetSync.android.tsx src/services/background/widgetSync.ios.ts src/services/background/widgetSync.web.ts src/services/background/widgetSync.ts tests/unit/widget/widgetSyncPlatform.test.ts
git commit -m "refactor: isolate Android widget from iOS"
```

---

## Task 2: Add a Tested Responsive Layout Model and Enable iPad

**Files:**

- Create: `src/components/layout/responsiveLayout.ts`
- Create: `src/components/layout/ResponsiveContent.tsx`
- Create: `tests/unit/layout/responsiveLayout.test.ts`
- Create: `tests/components/layout/ResponsiveContent.test.tsx`
- Modify: `app.json`

- [ ] **Step 1: Write failing tests for compact and regular geometry**

```ts
import { getResponsiveLayout } from '@/components/layout/responsiveLayout';

describe('getResponsiveLayout', () => {
  it('uses one column and compact gutters on a narrow iPhone', () => {
    expect(getResponsiveLayout(375)).toEqual({
      mode: 'compact',
      gutter: 16,
      columns: 1,
      contentMaxWidth: 1180,
    });
  });

  it('uses two columns and larger gutters on iPad width', () => {
    expect(getResponsiveLayout(820)).toEqual({
      mode: 'regular',
      gutter: 24,
      columns: 2,
      contentMaxWidth: 1180,
    });
  });

  it('keeps very narrow devices usable', () => {
    expect(getResponsiveLayout(320).gutter).toBe(12);
  });
});
```

- [ ] **Step 2: Run the pure test and confirm the missing-module failure**

```powershell
npx jest --runInBand tests/unit/layout/responsiveLayout.test.ts
```

Expected: FAIL because the responsive-layout module does not exist.

- [ ] **Step 3: Implement the pure responsive policy**

```ts
export type ResponsiveMode = 'compact' | 'regular';

export interface ResponsiveLayout {
  mode: ResponsiveMode;
  gutter: 12 | 16 | 24;
  columns: 1 | 2;
  contentMaxWidth: 1180;
}

export const getResponsiveLayout = (width: number): ResponsiveLayout => ({
  mode: width >= 768 ? 'regular' : 'compact',
  gutter: width < 360 ? 12 : width >= 768 ? 24 : 16,
  columns: width >= 768 ? 2 : 1,
  contentMaxWidth: 1180,
});
```

- [ ] **Step 4: Write the failing shared-container test**

Mock `useWindowDimensions()` at widths `375` and `820`. Assert that
`ResponsiveContent`:

- always uses `width: '100%'` and `alignSelf: 'center'`;
- applies the calculated horizontal gutter;
- caps wide content at `1180`;
- preserves caller-provided style and children.

- [ ] **Step 5: Implement `ResponsiveContent`**

```tsx
import type { PropsWithChildren } from 'react';
import { StyleProp, useWindowDimensions, View, ViewStyle } from 'react-native';
import { getResponsiveLayout } from './responsiveLayout';

interface Props extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const ResponsiveContent = ({ children, style, testID }: Props) => {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <View
      testID={testID}
      style={[
        {
          alignSelf: 'center',
          maxWidth: layout.contentMaxWidth,
          paddingHorizontal: layout.gutter,
          width: '100%',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
```

- [ ] **Step 6: Enable tablet support explicitly**

Add the following under `expo.ios` in `app.json`:

```json
"supportsTablet": true
```

Do not add orientation locking. SubMate must remain usable in iPad portrait,
iPad landscape, and split view.

- [ ] **Step 7: Run focused verification**

```powershell
npx jest --runInBand tests/unit/layout/responsiveLayout.test.ts tests/components/layout/ResponsiveContent.test.tsx
npx expo config --type public
npx tsc --noEmit
```

Expected: tests PASS, public Expo config contains `ios.supportsTablet: true`,
and TypeScript reports no errors.

- [ ] **Step 8: Commit Task 2**

```powershell
git add app.json src/components/layout/responsiveLayout.ts src/components/layout/ResponsiveContent.tsx tests/unit/layout/responsiveLayout.test.ts tests/components/layout/ResponsiveContent.test.tsx
git commit -m "feat: add responsive iPhone and iPad layout foundation"
```

---

## Task 3: Make the Custom Tab Bar Respond to Rotation and Safe Areas

**Files:**

- Modify: `src/components/layout/responsiveLayout.ts`
- Modify: `src/app/(tabs)/_layout.tsx`
- Modify: `tests/unit/layout/responsiveLayout.test.ts`

- [ ] **Step 1: Add failing tests for tab-bar geometry**

```ts
import { getTabBarGeometry } from '@/components/layout/responsiveLayout';

describe('getTabBarGeometry', () => {
  it('subtracts horizontal safe-area insets', () => {
    expect(getTabBarGeometry(390, 0, 0).availableWidth).toBe(366);
    expect(getTabBarGeometry(390, 8, 12).availableWidth).toBe(346);
  });

  it('caps the floating bar on iPad', () => {
    expect(getTabBarGeometry(1366, 0, 0).availableWidth).toBe(1180);
  });
});
```

- [ ] **Step 2: Run the test and confirm `getTabBarGeometry` is missing**

```powershell
npx jest --runInBand tests/unit/layout/responsiveLayout.test.ts
```

Expected: FAIL because the geometry helper is not exported.

- [ ] **Step 3: Implement deterministic tab-bar geometry**

```ts
export const getTabBarGeometry = (
  windowWidth: number,
  leftInset: number,
  rightInset: number,
) => {
  const outerMargin = 12;
  const availableWidth = Math.min(
    1180,
    Math.max(0, windowWidth - leftInset - rightInset - outerMargin * 2),
  );

  return { availableWidth, outerMargin };
};
```

- [ ] **Step 4: Replace the one-time `Dimensions.get('window')` calculation**

In `src/app/(tabs)/_layout.tsx`:

- import `useWindowDimensions` instead of `Dimensions`;
- calculate geometry from the current window width and safe-area insets;
- keep `onLayout` as the authoritative measured width after render;
- update the fallback width when rotation or split-view width changes;
- retain the existing pan responder and active-tab animation behavior.

The initial state must no longer capture stale launch dimensions.

- [ ] **Step 5: Run tab/navigation regressions**

```powershell
npx jest --runInBand tests/unit/layout/responsiveLayout.test.ts tests/components/dashboard/DashboardScreen.test.tsx tests/components/analytics/AnalyticsScreen.test.tsx tests/components/calendar/CalendarScreen.test.tsx tests/components/settings/SettingsScreen.test.tsx
npx tsc --noEmit
```

Expected: all tests PASS and no TypeScript errors.

- [ ] **Step 6: Commit Task 3**

```powershell
git add src/components/layout/responsiveLayout.ts "src/app/(tabs)/_layout.tsx" tests/unit/layout/responsiveLayout.test.ts
git commit -m "fix: adapt tab navigation to rotation and safe areas"
```

---

## Task 4: Apply the Shared Content Width to the Five Primary Tabs

**Files:**

- Modify: `src/features/dashboard/screens/DashboardScreen.tsx`
- Modify: `src/features/analytics/screens/AnalyticsScreen.tsx`
- Modify: `src/features/calendar/screens/CalendarScreen.tsx`
- Modify: `src/features/settings/screens/SettingsScreen.tsx`
- Modify: `src/app/(tabs)/subscriptions/index.tsx`
- Modify: `tests/components/dashboard/DashboardScreen.test.tsx`
- Modify: `tests/components/analytics/AnalyticsScreen.test.tsx`
- Modify: `tests/components/calendar/CalendarScreen.test.tsx`
- Modify: `tests/components/settings/SettingsScreen.test.tsx`
- Create: `tests/components/subscriptions/SubscriptionsResponsiveLayout.test.tsx`

- [ ] **Step 1: Add one failing responsive-shell assertion per primary tab**

Render each screen with its existing providers/mocks and assert that the main
content contains a `ResponsiveContent` boundary with a stable test ID:

```ts
expect(screen.getByTestId('dashboard-responsive-content')).toBeTruthy();
expect(screen.getByTestId('analytics-responsive-content')).toBeTruthy();
expect(screen.getByTestId('calendar-responsive-content')).toBeTruthy();
expect(screen.getByTestId('settings-responsive-content')).toBeTruthy();
expect(screen.getByTestId('subscriptions-responsive-content')).toBeTruthy();
```

- [ ] **Step 2: Run the five screen tests and confirm the new assertions fail**

```powershell
npx jest --runInBand tests/components/dashboard/DashboardScreen.test.tsx tests/components/analytics/AnalyticsScreen.test.tsx tests/components/calendar/CalendarScreen.test.tsx tests/components/settings/SettingsScreen.test.tsx tests/components/subscriptions/SubscriptionsResponsiveLayout.test.tsx
```

Expected: FAIL because the screens do not yet expose the shared content shell.

- [ ] **Step 3: Wrap only the scroll content, not the full safe-area root**

For each screen:

- preserve the existing `SafeAreaView`, refresh control, loading state, and
  bottom-tab spacing;
- put `ResponsiveContent` inside the existing `ScrollView` content;
- move screen-level horizontal padding to `ResponsiveContent` so it is not
  doubled;
- retain local vertical spacing on the screen's existing content style;
- use the stable test ID listed above.

Do not impose fixed card heights. Existing paired cards must use flexible
columns on regular width and a single full-width stack on compact width.

- [ ] **Step 4: Use the shared `columns` rule in analytics card groups**

The analytics screen already reads `useWindowDimensions`. Replace any separate
tablet breakpoint with `getResponsiveLayout(width)`. The spending-distribution
and upcoming-payments cards must be:

```ts
{
  flexDirection: layout.columns === 2 ? 'row' : 'column',
  alignItems: 'stretch',
}
```

Each child card must use `flex: layout.columns === 2 ? 1 : undefined` and
`width: layout.columns === 1 ? '100%' : undefined`. Do not use `space-between`
with percentage widths; use the existing `gap` so unequal card heights do not
leave a phantom column.

- [ ] **Step 5: Run primary-tab verification**

```powershell
npx jest --runInBand tests/components/dashboard/DashboardScreen.test.tsx tests/components/analytics/AnalyticsScreen.test.tsx tests/components/calendar/CalendarScreen.test.tsx tests/components/settings/SettingsScreen.test.tsx tests/components/subscriptions/SubscriptionsResponsiveLayout.test.tsx
npx tsc --noEmit
```

Expected: all tests PASS and TypeScript reports no errors.

- [ ] **Step 6: Commit Task 4**

```powershell
git add src/features/dashboard/screens/DashboardScreen.tsx src/features/analytics/screens/AnalyticsScreen.tsx src/features/calendar/screens/CalendarScreen.tsx src/features/settings/screens/SettingsScreen.tsx "src/app/(tabs)/subscriptions/index.tsx" tests/components/dashboard/DashboardScreen.test.tsx tests/components/analytics/AnalyticsScreen.test.tsx tests/components/calendar/CalendarScreen.test.tsx tests/components/settings/SettingsScreen.test.tsx tests/components/subscriptions/SubscriptionsResponsiveLayout.test.tsx
git commit -m "fix: make primary tabs responsive on iPhone and iPad"
```

---

## Task 5: Harden Keyboard and Modal Layout on iOS

**Files:**

- Create: `src/components/layout/keyboardLayout.ts`
- Create: `tests/unit/layout/keyboardLayout.test.ts`
- Modify: `src/features/settings/account/components/AccountFormModal.tsx`
- Modify: `src/features/ai/components/AiChatModal.tsx`
- Modify: `src/app/(tabs)/subscriptions/add.tsx`
- Modify: `src/app/(tabs)/subscriptions/[id].tsx`
- Modify: `tests/components/account-settings/AccountSettingsScreen.test.tsx`
- Modify: `tests/components/subscription-form/SubscriptionForm.test.tsx`

- [ ] **Step 1: Write a failing pure test for keyboard avoidance**

```ts
import { getKeyboardLayout } from '@/components/layout/keyboardLayout';

describe('getKeyboardLayout', () => {
  it('uses padding and the safe header offset on iOS', () => {
    expect(getKeyboardLayout('ios', 59, 52)).toEqual({
      behavior: 'padding',
      keyboardVerticalOffset: 111,
    });
  });

  it('uses height without a synthetic offset on Android', () => {
    expect(getKeyboardLayout('android', 24, 52)).toEqual({
      behavior: 'height',
      keyboardVerticalOffset: 0,
    });
  });
});
```

- [ ] **Step 2: Run the test and confirm the missing-module failure**

```powershell
npx jest --runInBand tests/unit/layout/keyboardLayout.test.ts
```

Expected: FAIL because the keyboard-layout helper does not exist.

- [ ] **Step 3: Implement the typed helper**

```ts
import type { KeyboardAvoidingViewProps } from 'react-native';

export const getKeyboardLayout = (
  platform: 'ios' | 'android' | 'web',
  topInset: number,
  headerHeight: number,
): Pick<KeyboardAvoidingViewProps, 'behavior' | 'keyboardVerticalOffset'> => ({
  behavior: platform === 'ios' ? 'padding' : 'height',
  keyboardVerticalOffset: platform === 'ios' ? topInset + headerHeight : 0,
});
```

- [ ] **Step 4: Apply safe offsets and bounded modal content**

For `AccountFormModal` and `AiChatModal`:

- read `top` and `bottom` from `useSafeAreaInsets()`;
- pass the shared keyboard behavior and offset to `KeyboardAvoidingView`;
- add bottom safe-area padding to the action/input region;
- keep modal content scrollable with `keyboardShouldPersistTaps="handled"`;
- cap card/chat content by available height, never a hard device pixel value;
- keep close and submit actions outside the keyboard-covered region.

For subscription add/edit routes:

- use the same keyboard helper;
- keep the header within the safe area;
- ensure the form's final action can scroll above the keyboard;
- preserve the recently repaired subscription-save behavior and its tests.

- [ ] **Step 5: Add regression assertions**

In the account and subscription form tests, mock iOS and safe-area insets and
assert:

- the keyboard view uses `padding`;
- the vertical offset equals top inset plus header height;
- the scroll container persists taps;
- account email/password submit buttons and subscription save remain rendered
  and enabled according to their existing validation state.

- [ ] **Step 6: Run focused keyboard/form verification**

```powershell
npx jest --runInBand tests/unit/layout/keyboardLayout.test.ts tests/components/account-settings/AccountSettingsScreen.test.tsx tests/components/subscription-form/SubscriptionForm.test.tsx tests/components/subscription-form/SubscriptionFormFields.test.tsx
npx tsc --noEmit
```

Expected: all tests PASS, including the existing subscription-save regression
suite.

- [ ] **Step 7: Commit Task 5**

```powershell
git add src/components/layout/keyboardLayout.ts src/features/settings/account/components/AccountFormModal.tsx src/features/ai/components/AiChatModal.tsx "src/app/(tabs)/subscriptions/add.tsx" "src/app/(tabs)/subscriptions/[id].tsx" tests/unit/layout/keyboardLayout.test.ts tests/components/account-settings/AccountSettingsScreen.test.tsx tests/components/subscription-form/SubscriptionForm.test.tsx
git commit -m "fix: keep iOS forms visible above the keyboard"
```

---

## Task 6: Complete the Foundation Verification Gate

**Files:**

- Create: `docs/testing/ios-foundation-checklist.md`
- Verify: all changed source and test files from Tasks 1–5

- [ ] **Step 1: Create a repeatable visual checklist**

The checklist must contain explicit pass/fail rows for:

1. iPhone portrait: all five tabs, add subscription, edit subscription,
   account email/password modal, AI chat input.
2. iPhone landscape: tab bar, close buttons, modal headers, submit actions.
3. iPhone with Dynamic Island/notch: top headers and close controls remain below
   the safe area.
4. iPad portrait and landscape: centered content, two-column analytics cards,
   no full-width text stretching.
5. iPad split view at narrow and wide widths: rotation/resize updates the tab
   indicator and card columns without restart.
6. Android regression: widget still renders and updates; subscription add/edit
   still saves.

Every row must include device/viewport, action, expected result, observed
result, and pass/fail. No generic “looks good” entries.

- [ ] **Step 2: Run the complete automated gate**

```powershell
npx jest --runInBand
npx tsc --noEmit
npx expo-doctor
npx expo export --platform ios --output-dir .expo-ios-foundation-check --clear
npx expo export --platform android --output-dir .expo-android-regression-check --clear
```

Expected:

- Jest exits 0 with no failing suites.
- TypeScript exits 0.
- Expo Doctor reports all checks passed.
- Both iOS and Android exports complete successfully.

- [ ] **Step 3: Inspect repository state before committing**

```powershell
git status --short
git diff --check
git diff --stat
```

Expected: no whitespace errors. Existing unrelated dirty files remain unstaged.
Temporary export folders remain ignored or are removed without touching user
data.

- [ ] **Step 4: Commit the checklist only**

```powershell
git add docs/testing/ios-foundation-checklist.md
git commit -m "docs: add iOS foundation verification checklist"
```

---

## Follow-on Delivery Plans

This plan intentionally stops at a platform-safe, responsive JavaScript/native
configuration foundation. The approved design continues in this fixed order:

1. **iOS Firebase and Google Sign-In configuration:** requires the real iOS
   Firebase app, `GoogleService-Info.plist`, iOS OAuth client ID, reversed client
   scheme, and an Apple bundle-ID audit. These values cannot be invented.
2. **Signed physical-device build:** requires an active Apple Developer account,
   registered iPad/iPhone devices, and EAS iOS credentials. Device tests cover
   Google Sign-In, password/email flows, biometrics, notifications, camera/file
   receipt import, calendar behavior, and background/foreground transitions.
3. **Apple App Check:** configure App Attest with DeviceCheck fallback, observe
   metrics before enforcement, and document the rollback path. It must not be
   enforced before real-device requests are proven valid.
4. **TestFlight/release gate:** production signing, privacy metadata, support and
   legal URLs, screenshots, crash monitoring, and beta exit criteria.

Each follow-on is a separate implementation plan because it has different
credentials, external-state changes, and rollback boundaries.

## Plan Self-Review

- [ ] Every executable code task starts with a failing test.
- [ ] Every file path is repository-relative and names an existing file or a
  file created by the plan.
- [ ] No unresolved marker, invented credential, sample client ID, or secret
  appears in implementation snippets.
- [ ] Android widget behavior is protected by existing and new regression tests.
- [ ] iPad, rotation, safe areas, keyboard avoidance, and primary-tab layouts are
  explicitly covered.
- [ ] The final automated gate includes tests, type checking, Expo Doctor, and
  both platform exports.
- [ ] Firebase, App Check, signing, and TestFlight are deferred only to named
  follow-on plans with explicit prerequisites, not silently omitted.
