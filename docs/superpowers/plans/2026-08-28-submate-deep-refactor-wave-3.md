# SubMate Deep Refactor Wave 3 Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the remaining route-sized screens into thin composition boundaries backed by typed, testable view-models and focused presentational components while preserving all user-visible behavior.

**Architecture:** Keep Expo Router route files as compatibility entry points that only re-export feature screens. Move derived data into pure builders or focused hooks, keep transient UI state in screens, and keep Firebase/storage/device side effects behind hooks or existing services. Extract one screen family at a time and keep the full release gate green between families.

**Tech stack:** Expo SDK 56, React Native 0.85, React 19, TypeScript, Expo Router, Zustand, TanStack Query, Jest, React Native Testing Library.

**Constraints:** Preserve navigation paths and visible behavior; introduce no new feature; do not build APK/IPA; do not deploy Firebase; do not touch `android/app/google-services.json`, local caches, or APK artifacts; use the canonical billing/recurrence domain from Wave 1; add no untyped `any` to the refactored path.

---

## Task 1: Extract and characterize the Dashboard view-model

**Files:**

- Create: `src/features/dashboard/types.ts`
- Create: `src/features/dashboard/utils/dashboardViewModel.ts`
- Create: `src/features/dashboard/hooks/useDashboardViewModel.ts`
- Test: `tests/unit/dashboard/dashboardViewModel.test.ts`
- Reference: `src/app/(tabs)/index.tsx`

### Step 1: Write the failing pure-model tests

Cover search normalization, active upcoming ordering, paused subscription exclusion, trial alert selection, category breakdown, and monthly total projection with injected rates/currency. Assert that an empty query returns the upcoming list and a non-empty query searches name, category, notes, amount, currency, and billing cycle.

### Step 2: Confirm RED

Run:

```text
npx jest tests/unit/dashboard/dashboardViewModel.test.ts --runInBand
```

Expected: FAIL because the dashboard view-model module does not exist.

### Step 3: Implement the minimal pure builder and hook

Create a typed `buildDashboardViewModel` that accepts subscriptions, query, base currency, rates, and current time. The hook only adapts stores/query data into that pure builder. Do not move modal state or navigation into the hook.

Remove the dashboard's unused `setLiveRates` state. Do not invent historical growth data; expose growth as unavailable unless a real source exists.

### Step 4: Confirm GREEN

Run:

```text
npx jest tests/unit/dashboard/dashboardViewModel.test.ts --runInBand
npm run typecheck
```

### Step 5: Commit

Commit message: `refactor: extract dashboard view model`

## Task 2: Split Dashboard presentation behind a feature screen

**Files:**

- Create: `src/features/dashboard/screens/DashboardScreen.tsx`
- Create: `src/features/dashboard/components/DashboardHeader.tsx`
- Create: `src/features/dashboard/components/SubscriptionSearch.tsx`
- Create: `src/features/dashboard/components/MonthlySpendHero.tsx`
- Create: `src/features/dashboard/components/DashboardQuickActions.tsx`
- Create: `src/features/dashboard/components/DashboardAlerts.tsx`
- Create: `src/features/dashboard/components/SpendingOverview.tsx`
- Create: `src/features/dashboard/components/HeroThemePickerModal.tsx`
- Create: `src/features/dashboard/components/DashboardOverlays.tsx`
- Modify: `src/app/(tabs)/index.tsx`
- Test: `tests/components/dashboard/DashboardScreen.test.tsx`

### Step 1: Write failing screen-boundary tests

Test the public screen through behavior: search input filters rendered subscriptions, notification action navigates to notifications, quick action routes remain unchanged, and empty/loading states remain reachable. Mock only external boundaries such as router and query hooks.

### Step 2: Confirm RED

Run:

```text
npx jest tests/components/dashboard/DashboardScreen.test.tsx --runInBand
```

Expected: FAIL because the feature screen/components do not exist.

### Step 3: Extract leaf components and feature screen

Move JSX without changing copy, routes, accessibility labels, or modal behavior. Make `src/app/(tabs)/index.tsx` a one-line re-export. Keep a single scroll owner and avoid nesting virtualized subscription lists inside a same-axis `ScrollView`.

### Step 4: Confirm GREEN

Run:

```text
npx jest tests/components/dashboard/DashboardScreen.test.tsx --runInBand
npm run typecheck
npm run lint
```

### Step 5: Commit

Commit message: `refactor: split dashboard screen`

## Task 3: Extract Calendar recurrence presentation

**Files:**

- Create: `src/features/calendar/utils/calendarViewModel.ts`
- Create: `src/features/calendar/hooks/useCalendarViewModel.ts`
- Create: `src/features/calendar/screens/CalendarScreen.tsx`
- Create: `src/features/calendar/components/CalendarHeader.tsx`
- Create: `src/features/calendar/components/MonthNavigator.tsx`
- Create: `src/features/calendar/components/CalendarGrid.tsx`
- Create: `src/features/calendar/components/PaymentDayList.tsx`
- Modify: `src/app/(tabs)/calendar/index.tsx`
- Test: `tests/unit/calendar/calendarViewModel.test.ts`
- Test: `tests/components/calendar/CalendarScreen.test.tsx`

### Step 1: Write failing calendar model tests

Cover weekly, monthly, quarterly, semiannual, annual, and biennial dates; 29/30/31 month ends; paused subscriptions; future first renewal; selected-day payments; and monthly total equality with the canonical billing projection.

### Step 2: Confirm RED

Run the two new calendar test files and confirm failures are caused by the missing modules.

### Step 3: Implement model, components, and route facade

Use the Wave 1 recurrence helpers rather than retaining local billing-cycle math. Keep selected month/day as screen UI state. Route becomes a feature-screen re-export.

### Step 4: Confirm GREEN

Run new calendar tests, typecheck, and lint.

### Step 5: Commit

Commit message: `refactor: split calendar screen`

## Task 4: Extract Analytics view-model and typed sections

**Files:**

- Create: `src/features/analytics/hooks/useFinancialAnalysisViewModel.ts`
- Create: `src/features/analytics/hooks/useUsageActions.ts`
- Create: `src/features/analytics/screens/AnalyticsScreen.tsx`
- Create: `src/features/analytics/components/AnalysisHeader.tsx`
- Create: `src/features/analytics/components/AnalysisHero.tsx`
- Create: `src/features/analytics/components/MetricGrid.tsx`
- Create: `src/features/analytics/components/CashFlowSection.tsx`
- Create: `src/features/analytics/components/SpendingBreakdownSection.tsx`
- Create: `src/features/analytics/components/UpcomingPaymentsSection.tsx`
- Create: `src/features/analytics/components/FinancialStructureSection.tsx`
- Create: `src/features/analytics/components/PriorityActionsSection.tsx`
- Create: `src/features/analytics/components/AnalysisSectionCard.tsx`
- Modify: `src/app/(tabs)/analytics/index.tsx`
- Test: `tests/unit/analytics/financialAnalysisViewModel.test.ts`
- Test: `tests/components/analytics/AnalyticsScreen.test.tsx`

### Step 1: Write failing model and interaction tests

Cover formatter locale/currency, insight priority, selected cash-flow month payments, live subscription updates, usage logging, and empty/loading states. Assert Turkish/English content parity for the model outputs.

### Step 2: Confirm RED

Run both new analytics test files and confirm missing-module/behavior failures.

### Step 3: Implement typed boundaries

Move rate refresh ownership into the view-model and remove the `ratesVersion` rerender workaround. Replace all local helper component `any` props with explicit interfaces. Keep cash-flow selection and AI modal visibility as screen UI state.

### Step 4: Confirm GREEN

Run analytics tests, typecheck, and lint.

### Step 5: Commit

Commit message: `refactor: split analytics screen`

## Task 5: Extract Wallet screen composition

**Files:**

- Create: `src/features/wallet/screens/WalletScreen.tsx`
- Create: `src/features/wallet/hooks/useWalletViewModel.ts`
- Create focused wallet components as identified by characterization tests
- Modify: `src/app/(tabs)/wallet/index.tsx`
- Test: `tests/unit/wallet/walletViewModel.test.ts`
- Test: `tests/components/wallet/WalletScreen.test.tsx`

### Step 1: Write failing wallet behavior tests

Protect card assignment, limit state, converted monthly commitment, active/paused filtering, and add/edit navigation.

### Step 2: Confirm RED

Run the new wallet tests and observe the expected missing boundary.

### Step 3: Implement the minimal split

Use the shared card-assignment and billing domain. Keep mutation ownership in existing hooks and make the route a feature-screen re-export.

### Step 4: Confirm GREEN

Run wallet tests, typecheck, and lint.

### Step 5: Commit

Commit message: `refactor: split wallet screen`

## Task 6: Split Settings and centralize profile preferences

**Files:**

- Create: `src/features/settings/screens/SettingsScreen.tsx`
- Create: `src/features/settings/hooks/useSettingsProfile.ts`
- Create: `src/features/settings/hooks/useSettingsActions.ts`
- Create: `src/features/settings/components/SettingsProfileCard.tsx`
- Create: `src/features/settings/components/SettingsSection.tsx`
- Create: `src/features/settings/components/SettingsRow.tsx`
- Create: `src/features/settings/components/DataVaultCard.tsx`
- Create: `src/features/settings/components/LanguagePickerModal.tsx`
- Create: `src/features/settings/components/CurrencyPickerModal.tsx`
- Create: `src/features/settings/components/ThemePickerModal.tsx`
- Create: `src/features/settings/styles/settingsStyles.ts`
- Modify: `src/app/(tabs)/settings/index.tsx`
- Modify as needed: `src/store/useProfileStore.ts`
- Test: `tests/components/settings/SettingsScreen.test.tsx`
- Test: `tests/unit/settings/settingsProfile.test.ts`

### Step 1: Write failing preference/profile tests

Protect profile-name/avatar persistence, locale/currency/theme selection, biometric capability behavior, vault actions, account/about navigation, and sign-out. Verify privacy/terms use their legal routes rather than unreachable duplicate modal state.

### Step 2: Confirm RED

Run the new settings tests and confirm the missing boundary/ownership failures.

### Step 3: Implement focused hooks and components

Make `useProfileStore` the single display-name/avatar owner. Remove direct profile AsyncStorage/Firebase reads from the screen. Keep picker modal state local to the screen and place side effects behind actions.

### Step 4: Confirm GREEN

Run settings tests, typecheck, and lint.

### Step 5: Commit

Commit message: `refactor: split settings screen`

## Task 7: Split Account Settings with provider-aware capabilities

**Files:**

- Create: `src/features/settings/account/types.ts`
- Create: `src/features/settings/account/hooks/useAccountCapabilities.ts`
- Create: `src/features/settings/account/hooks/useAccountSecurityActions.ts`
- Create: `src/features/settings/account/screens/AccountSettingsScreen.tsx`
- Create: `src/features/settings/account/components/AccountHero.tsx`
- Create: `src/features/settings/account/components/AccountSecuritySection.tsx`
- Create: `src/features/settings/account/components/ChangeEmailModal.tsx`
- Create: `src/features/settings/account/components/ChangePasswordModal.tsx`
- Create: `src/features/settings/account/components/DeleteAccountModal.tsx`
- Modify: `src/app/(tabs)/settings/account.tsx`
- Test: `tests/components/account-settings/AccountSettingsScreen.test.tsx`
- Test: `tests/unit/settings/accountCapabilities.test.ts`

### Step 1: Write failing provider-capability tests

Cover password-only, Google-only, and linked providers. Verify unsupported password fields are hidden, email/password changes require the correct reauthentication flow, reset mail remains available, account deletion chooses the correct provider path, and raw Firebase errors never reach UI copy.

### Step 2: Confirm RED

Run the new account settings tests and confirm expected failures.

### Step 3: Implement provider-aware actions and modal ownership

Each modal owns its form/loading state. Security actions return typed domain outcomes that the screen maps to localized messages. Route becomes a feature-screen re-export.

### Step 4: Confirm GREEN

Run account tests, typecheck, and lint.

### Step 5: Commit

Commit message: `refactor: split account settings screen`

## Task 8: Revalidate session lifecycle and cross-screen isolation

**Files:**

- Modify if required: `src/components/SessionLifecycleCoordinator.tsx`
- Modify if required: related auth/profile/query stores
- Test: `tests/components/auth/SessionLifecycleCoordinator.test.tsx`
- Test: `tests/components/auth/CrossAccountIsolation.test.tsx`

### Step 1: Write the failing cross-account regression test

Simulate user A data, logout, and user B login. Assert that A's subscriptions, profile, selected screen state, and widget projection do not appear for B.

### Step 2: Confirm RED

Run the two session tests and observe the exact leaked owner if one remains. If the new test already passes, keep it as characterization and do not change production code unnecessarily.

### Step 3: Apply only evidence-backed cleanup

Reset only user-owned caches/stores at the centralized session boundary. Do not scatter logout cleanup across screens.

### Step 4: Confirm GREEN

Run session, subscription-feed, and widget bridge tests plus typecheck.

### Step 5: Commit

Commit message: `test: protect cross-account screen isolation`

## Task 9: Wave 3 release verification and manual checklist

**Files:**

- Create: `docs/testing/screen-refactor-wave-3-checklist.md`

### Step 1: Run focused regression suites

Run all newly added dashboard, calendar, analytics, wallet, settings, account, session, subscription-feed, and widget tests.

### Step 2: Run the release gate

Run:

```text
npm run verify:release
```

Expected: typecheck, Functions build, lint, Jest, Node verification, Functions tests, security checks, Firestore rules, production audits, Expo Doctor, and Android production JS export all pass.

### Step 3: Add the physical-device checklist

Document Android/iOS checks for navigation, search, modal keyboard avoidance, safe areas, account provider variants, cross-account logout/login, live subscription refresh, and widget synchronization. Do not claim these physical checks were performed by Codex.

### Step 4: Inspect final diff and status

Confirm every route is a thin facade, no new `any` exists in the refactored paths, and unrelated user-owned files remain untouched.

### Step 5: Commit

Commit message: `docs: add Wave 3 screen beta checklist`
