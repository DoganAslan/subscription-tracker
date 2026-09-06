# Privacy-Preserving Error Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable production-only Sentry diagnostics with an explicit user preference and strict removal of financial, identity, credential and free-form user data.

**Architecture:** A small diagnostics preference store controls whether the root layout initializes monitoring. `src/services/monitoring/sentry.ts` owns initialization, sanitization, user/context clearing and capture. Screens never call Sentry directly.

**Tech Stack:** Expo SDK 57 project configuration, React Native, Zustand persistence, `@sentry/react-native`, Jest.

**Spec:** `docs/superpowers/specs/2026-09-06-global-release-readiness-design.md`

## Global Constraints

- `EXPO_PUBLIC_SENTRY_DSN` is the only configuration value; never commit a DSN to `.env.example`.
- Do not add Firebase Crashlytics, analytics SDKs or performance tracing.
- `sendDefaultPii` is always `false`; no Firebase UID, email, subscription, card, wallet, AI prompt, amount, token, backup content or request body may leave the device.
- Monitoring must be a no-op in development, test, web and missing-DSN cases.
- Turkish and English settings copy must be clear about optional diagnostics.

---

### Task 1: Add a persisted diagnostics preference

**Files:**
- Create: `src/store/useDiagnosticsStore.ts`
- Create: `tests/unit/monitoring/useDiagnosticsStore.test.ts`

**Interfaces:**
- Produces: `useDiagnosticsStore` with `{ isDiagnosticsEnabled, setDiagnosticsEnabled, hasHydrated }`.
- Consumed by: root layout and Settings screen.

- [ ] **Step 1: Write the failing store tests**

```ts
import { useDiagnosticsStore } from '@/store/useDiagnosticsStore';

describe('diagnostics preference', () => {
  it('defaults to disabled until the user explicitly opts in', () => {
    expect(useDiagnosticsStore.getState().isDiagnosticsEnabled).toBe(false);
  });

  it('updates the user preference without changing biometric settings', () => {
    useDiagnosticsStore.getState().setDiagnosticsEnabled(true);
    expect(useDiagnosticsStore.getState().isDiagnosticsEnabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test before implementation**

Run: `npx jest tests/unit/monitoring/useDiagnosticsStore.test.ts --runInBand`

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the focused store**

```ts
interface DiagnosticsState {
  isDiagnosticsEnabled: boolean;
  hasHydrated: boolean;
  setDiagnosticsEnabled(enabled: boolean): void;
  setHasHydrated(value: boolean): void;
}

export const useDiagnosticsStore = create<DiagnosticsState>()(
  persist(
    set => ({ isDiagnosticsEnabled: false, hasHydrated: false, setDiagnosticsEnabled: enabled => set({ isDiagnosticsEnabled: enabled }), setHasHydrated: value => set({ hasHydrated: value }) }),
    { name: 'diagnostics-storage', storage: createJSONStorage(() => secureStorageAdapter), onRehydrateStorage: () => () => useDiagnosticsStore.getState().setHasHydrated(true) },
  ),
);
```

Use a dedicated storage key; do not add diagnostics preference to `useSecurityStore`.

- [ ] **Step 4: Run the focused test**

Run: `npx jest tests/unit/monitoring/useDiagnosticsStore.test.ts --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit the preference store**

```bash
git add src/store/useDiagnosticsStore.ts tests/unit/monitoring/useDiagnosticsStore.test.ts
git commit -m "feat: add privacy diagnostics preference"
```

### Task 2: Make Sentry sanitised and opt-in

**Files:**
- Modify: `src/services/monitoring/sentry.ts`
- Modify: `src/providers/ErrorBoundary.tsx`
- Create: `tests/unit/monitoring/sentry.test.ts`

**Interfaces:**
- Produces: `initializeMonitoring(enabled: boolean): void`, `captureAppError(error: unknown, area: MonitoringArea): void`, `clearMonitoringContext(): void`.
- Consumes: `EXPO_PUBLIC_SENTRY_DSN`, `__DEV__`, build environment and the preference from Task 1.

- [ ] **Step 1: Write failing sanitizer tests with realistic sensitive data**

```ts
it('drops an event containing email, money, card-like values, AI text, and request body', () => {
  const event = sanitizeEvent({
    user: { id: 'firebase-user-id', email: 'user@example.com' },
    request: { data: { amount: 19.99, cardNumber: '4111111111111111' } },
    breadcrumbs: [{ message: 'Netflix renewal 19.99 TRY' }],
    extra: { prompt: 'Should I buy Prime Video?' },
  });
  expect(event.user).toBeUndefined();
  expect(event.request).toBeUndefined();
  expect(event.breadcrumbs).toEqual([]);
  expect(event.extra).toBeUndefined();
});
```

- [ ] **Step 2: Run the sanitizer test**

Run: `npx jest tests/unit/monitoring/sentry.test.ts --runInBand`

Expected: FAIL because `sanitizeEvent` does not yet exist and current implementation preserves a pseudonymous Sentry user/request URL.

- [ ] **Step 3: Implement a pure sanitizer and strict initialization gate**

```ts
export function shouldInitializeMonitoring({ enabled, dsn, isDev, platform }: MonitoringConfig): boolean {
  return enabled && Boolean(dsn) && !isDev && platform !== 'web';
}

export function sanitizeEvent(event: Event): Event | null {
  return { ...event, user: undefined, request: undefined, extra: undefined, contexts: safeDeviceContext(event.contexts), breadcrumbs: [] };
}
```

Configure Sentry with `sendDefaultPii: false`, `tracesSampleRate: 0`, `maxBreadcrumbs: 0`, `beforeBreadcrumb: () => null`, and `beforeSend: sanitizeEvent`. Capture only a fixed allow-list tag `{ area }`; validate `area` against a string union. `captureAppError` must return without calling Sentry unless monitoring was initialized.

- [ ] **Step 4: Clear context at account boundary**

```ts
export function clearMonitoringContext(): void {
  if (!monitoringInitialized) return;
  Sentry.setUser(null);
  Sentry.setContext('account', null);
  Sentry.setTag('account_state', undefined);
}
```

Update the error boundary so it sends no `ErrorInfo` component stack or error message as tags/extras. Keep user-facing debug detail only under `__DEV__`.

- [ ] **Step 5: Run focused tests**

Run: `npx jest tests/unit/monitoring/sentry.test.ts --runInBand && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit the monitoring service**

```bash
git add src/services/monitoring/sentry.ts src/providers/ErrorBoundary.tsx tests/unit/monitoring/sentry.test.ts
git commit -m "feat: sanitize optional Sentry monitoring"
```

### Task 3: Wire the preference into app startup, settings, sign-out and deletion

**Files:**
- Modify: `src/app/_layout.tsx`
- Modify: `src/features/settings/screens/SettingsScreen.tsx`
- Modify: `src/features/settings/hooks/useSettingsActions.ts`
- Modify: `src/services/firebase/auth.ts`
- Modify: `tests/components/settings/SettingsScreen.test.tsx`
- Modify: `tests/unit/settings/accountCapabilities.test.ts` only if account lifecycle needs a new mock.

**Interfaces:**
- Consumes: Task 1 store and Task 2 monitoring API.
- Produces: a single settings action that changes preference; initialization occurs after preference hydration; sign-out/delete clear monitoring context.

- [ ] **Step 1: Add failing settings and lifecycle tests**

```ts
it('shows optional diagnostics as disabled by default and toggles it on explicit press', async () => {
  const screen = render(<SettingsScreen />);
  expect(screen.getByText('Optional diagnostics')).toBeTruthy();
  fireEvent.press(screen.getByText('Optional diagnostics'));
  expect(mockSetDiagnosticsEnabled).toHaveBeenCalledWith(true);
});

it('clears monitoring context before Firebase sign-out', async () => {
  await AuthService.logOut();
  expect(clearMonitoringContext).toHaveBeenCalledBefore(signOut);
});
```

- [ ] **Step 2: Run the tests to prove the UI and lifecycle do not exist**

Run: `npx jest tests/components/settings/SettingsScreen.test.tsx tests/unit/monitoring/sentry.test.ts --runInBand`

Expected: FAIL because there is no diagnostics row and initialization happens at module evaluation.

- [ ] **Step 3: Delay initialization until the preference is hydrated**

```ts
const { isDiagnosticsEnabled, hasHydrated } = useDiagnosticsStore();
useEffect(() => {
  if (hasHydrated) initializeMonitoring(isDiagnosticsEnabled);
}, [hasHydrated, isDiagnosticsEnabled]);
```

Remove module-scope `initializeMonitoring()` call. Keep `Sentry.wrap(RootLayout)` only if the library does not emit anything before `Sentry.init`; otherwise export the plain root layout and wrap only after verified safe initialization.

- [ ] **Step 4: Add the settings row and localized text**

Use a `SettingsRow` in a “Privacy” or “Diagnostics” section. The subtitle/value must state that anonymous technical error reports are optional and do not include financial data. Pressing the row shows a confirmation dialog before enabling; disabling acts immediately and calls `clearMonitoringContext()`.

- [ ] **Step 5: Clear context before sign-out and during successful deletion**

Call `clearMonitoringContext()` before `signOut(auth)` and after `deleteUser(user)` succeeds. Do not attach a Firebase UID to Sentry at any point.

- [ ] **Step 6: Run focused tests**

Run: `npx jest tests/components/settings/SettingsScreen.test.tsx tests/unit/monitoring --runInBand && npm run lint && npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit the startup/UI wiring**

```bash
git add src/app/_layout.tsx src/features/settings src/services/firebase/auth.ts tests/components/settings tests/unit/monitoring
git commit -m "feat: make diagnostics explicit and optional"
```

### Task 4: Verify release configuration without collecting production data

**Files:**
- Modify: `.env.example`
- Create: `scripts/verify-monitoring-config.js`
- Create: `tests/unit/monitoring/monitoringConfig.test.ts`

**Interfaces:**
- Consumes: environment names and `shouldInitializeMonitoring`.
- Produces: a release check that rejects an in-repo DSN and permits a blank DSN.

- [ ] **Step 1: Write failing config tests**

```ts
it('does not initialize when the DSN is blank', () => {
  expect(shouldInitializeMonitoring({ enabled: true, dsn: '', isDev: false, platform: 'android' })).toBe(false);
});
```

- [ ] **Step 2: Run test**

Run: `npx jest tests/unit/monitoring/monitoringConfig.test.ts --runInBand`

Expected: PASS after Task 2; use this step to lock the contract before editing scripts.

- [ ] **Step 3: Add static release verification**

```js
assertNoValue('.env.example', /^EXPO_PUBLIC_SENTRY_DSN=.+/m, 'Do not commit Sentry DSN');
assertSourceContains('src/services/monitoring/sentry.ts', 'sendDefaultPii: false');
assertSourceContains('src/services/monitoring/sentry.ts', 'tracesSampleRate: 0');
```

- [ ] **Step 4: Run verification**

Run: `node scripts/verify-monitoring-config.js && npm run test:security`

Expected: PASS.

- [ ] **Step 5: Commit the release check**

```bash
git add .env.example scripts/verify-monitoring-config.js tests/unit/monitoring
git commit -m "test: verify privacy-safe monitoring configuration"
```
