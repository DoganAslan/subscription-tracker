# Local Notification Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make payment reminders a single, local-device-only system that requests permission intentionally and reschedules correctly across subscription changes.

**Architecture:** `src/services/notificationService.ts` is the only public API for channel setup, permission checks, deterministic IDs, scheduling, cancellation and history. Subscription mutations call it after Firestore succeeds; the root layout only registers history listeners and never requests a push token at startup.

**Tech Stack:** Expo Notifications, React Native, Firebase types, i18next, Jest.

**Spec:** `docs/superpowers/specs/2026-09-06-global-release-readiness-design.md`

## Global Constraints

- Local scheduled reminders only; no Expo push token, remote notification or server function.
- Request permission only after a user action that enables a reminder.
- Create Android channel before requesting permission; treat iOS provisional permission as usable.
- Scheduler must no-op on web and never throw into a subscription mutation UI.
- Never globally cancel all scheduled notifications due to one subscription changing.

---

### Task 1: Define deterministic reminder IDs and permission contract

**Files:**
- Modify: `src/services/notificationService.ts`
- Create: `tests/unit/notifications/notificationService.test.ts`

**Interfaces:**
- Produces: `getSubscriptionReminderIds(subscriptionId)`, `isNotificationPermissionGranted(status)`, `getNotificationPermissionState()`, `requestReminderPermission()`.
- Consumed by: subscription hooks, notifications screen and root layout.

- [ ] **Step 1: Write failing pure-function tests**

```ts
import { getSubscriptionReminderIds, isNotificationPermissionGranted } from '@/services/notificationService';

it('uses stable unique IDs per subscription', () => {
  expect(getSubscriptionReminderIds('sub-1')).toEqual({ payment: 'submate:payment:sub-1', contract: 'submate:contract:sub-1' });
});

it('accepts iOS provisional local-notification authorization', () => {
  expect(isNotificationPermissionGranted({ granted: false, ios: { status: 3 } } as never)).toBe(true);
});
```

- [ ] **Step 2: Run test before implementation**

Run: `npx jest tests/unit/notifications/notificationService.test.ts --runInBand`

Expected: FAIL because current scheduler hides IDs and only uses root permission status.

- [ ] **Step 3: Implement the public contract**

```ts
export const getSubscriptionReminderIds = (subscriptionId: string) => ({
  payment: `submate:payment:${subscriptionId}`,
  contract: `submate:contract:${subscriptionId}`,
});

export const isNotificationPermissionGranted = (status: Notifications.NotificationPermissionsStatus) =>
  status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
```

Use a single Android channel named `submate-reminders`; `getNotificationPermissionState` must only inspect and `requestReminderPermission` may prompt.

- [ ] **Step 4: Run focused test**

Run: `npx jest tests/unit/notifications/notificationService.test.ts --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/notificationService.ts tests/unit/notifications/notificationService.test.ts
git commit -m "refactor: define stable local reminder identifiers"
```

### Task 2: Remove startup push registration and duplicate scheduler ownership

**Files:**
- Modify: `src/app/_layout.tsx`
- Delete: `src/utils/notifications.ts`
- Delete: `src/utils/NotificationService.ts`
- Delete: `src/features/notifications/services/notificationService.ts`
- Create: `tests/unit/notifications/notificationImports.test.ts`

**Interfaces:**
- Consumes: Task 1 service API.
- Produces: one scheduling source and a root layout with history listeners only.

- [ ] **Step 1: Write failing root ownership test**

```ts
import { readFileSync } from 'node:fs';

it('does not request notification permission during root startup', () => {
  const root = readFileSync('src/app/_layout.tsx', 'utf8');
  expect(root).not.toContain('registerForPushNotificationsAsync');
  expect(root).not.toContain('requestNotificationPermissions()');
});
```

- [ ] **Step 2: Run the ownership test**

Run: `npx jest tests/unit/notifications/notificationImports.test.ts --runInBand`

Expected: FAIL because the root currently calls `registerForPushNotificationsAsync()`.

- [ ] **Step 3: Remove unsolicited startup work and duplicate sources**

```ts
useEffect(() => {
  if (Platform.OS === 'web') return;
  return registerNotificationHistoryListeners();
}, []);
```

Use `rg` to migrate every production import to `@/services/notificationService` before deleting duplicate wrappers. Delete only after `rg -n 'utils/NotificationService|utils/notifications|features/notifications/services/notificationService' src` has no production import.

- [ ] **Step 4: Run checks**

Run: `npx jest tests/unit/notifications/notificationImports.test.ts --runInBand && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/_layout.tsx src/services/notificationService.ts tests/unit/notifications
git rm src/utils/notifications.ts src/utils/NotificationService.ts src/features/notifications/services/notificationService.ts
git commit -m "refactor: consolidate local notification scheduling"
```

### Task 3: Reschedule precisely on the subscription lifecycle

**Files:**
- Modify: `src/features/subscriptions/hooks/useSubscriptions.ts`
- Modify: `src/services/notificationService.ts`
- Create: `tests/unit/notifications/subscriptionReminderLifecycle.test.ts`

**Interfaces:**
- Produces: `syncSubscriptionReminders(subscription): Promise<ReminderSyncResult>` and `cancelSubscriptionReminders(subscriptionId): Promise<void>`.

- [ ] **Step 1: Write failing lifecycle tests**

```ts
it('cancels payment and contract reminders on delete or pause', async () => {
  await cancelSubscriptionReminders('sub-1');
  expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith('submate:payment:sub-1');
  expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith('submate:contract:sub-1');
});

it('schedules after resume without prompting again', async () => {
  await syncSubscriptionReminders(activeSubscription);
  expect(scheduleNotificationAsync).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run lifecycle test before implementation**

Run: `npx jest tests/unit/notifications/subscriptionReminderLifecycle.test.ts --runInBand`

Expected: FAIL because resume currently only shows a toast.

- [ ] **Step 3: Implement isolated resync/cancel operations**

```ts
export async function syncSubscriptionReminders(subscription: Subscription): Promise<ReminderSyncResult> {
  await cancelSubscriptionReminders(subscription.id!);
  if (subscription.status === 'paused' || subscription.reminderOffset === 'none') return { scheduled: 0, permission: 'not-requested' };
  const permission = await getNotificationPermissionState();
  if (!permission.granted) return { scheduled: 0, permission: 'denied' };
  // Schedule payment and optional contract IDs only.
}
```

On add with reminder enabled, first call `requestReminderPermission`; on update/resume, inspect existing permission without a prompt. On pause/delete cancel both deterministic IDs. Replace `cancelAllScheduledNotificationsAsync()` in `resyncAllReminders` with cancellation of SubMate-owned IDs only.

- [ ] **Step 4: Run focused tests**

Run: `npx jest tests/unit/notifications/notificationService.test.ts tests/unit/notifications/subscriptionReminderLifecycle.test.ts --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/subscriptions/hooks/useSubscriptions.ts src/services/notificationService.ts tests/unit/notifications
git commit -m "fix: reschedule local reminders across subscription changes"
```

### Task 4: Harden notification history and document Android proof

**Files:**
- Modify: `src/services/notificationService.ts`
- Modify: `src/app/notifications.tsx` only if new service state needs visual copy.
- Modify: `tests/unit/notifications/notificationService.test.ts`
- Create: `docs/release/android-local-notification-test.md`

**Interfaces:**
- Consumes: Tasks 1–3 service API.
- Produces: bounded on-device history and a physical Android release checklist.

- [ ] **Step 1: Add malformed-history and denied-permission tests**

```ts
it('returns empty history when persisted JSON is invalid', async () => {
  AsyncStorage.getItem.mockResolvedValue('{bad json');
  await expect(getNotificationHistory()).resolves.toEqual([]);
});

it('does not schedule if permission is denied', async () => {
  mockPermission({ granted: false });
  await expect(syncSubscriptionReminders(activeSubscription)).resolves.toMatchObject({ scheduled: 0, permission: 'denied' });
});
```

- [ ] **Step 2: Run tests**

Run: `npx jest tests/unit/notifications/notificationService.test.ts --runInBand`

Expected: PASS after defensive persistence parsing is added.

- [ ] **Step 3: Write the manual Android checklist**

Document exact expected results for permission grant/deny, add/update/delete/pause/resume, language switch, restart, history clear and optionally `adb shell dumpsys alarm` as diagnostics only.

- [ ] **Step 4: Run release-local checks**

Run: `npm run typecheck && npm run lint && npx jest tests/unit/notifications --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/notificationService.ts src/app/notifications.tsx tests/unit/notifications docs/release/android-local-notification-test.md
git commit -m "test: document local notification release checks"
```
