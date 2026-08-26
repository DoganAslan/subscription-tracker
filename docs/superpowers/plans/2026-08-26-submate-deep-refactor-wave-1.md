# SubMate Deep Refactor Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a trustworthy test gate, one canonical subscription cost/renewal engine, one user-scoped live subscription feed, and one deduplicated widget synchronization path without changing the visible product flow.

**Architecture:** Pure modules under `src/domain/subscriptions` own billing, recurrence, normalization, and legacy card assignment. A provider owns the single Firestore subscription listener and writes snapshots into the UID-scoped React Query cache. A bridge observes that cache and routes widget updates through a latest-wins, content-deduplicating coordinator.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript 6, React Query 5, Firebase 12, Zustand 5, Jest through `jest-expo`, React Native Testing Library, Node test runner for Firestore/widget legacy tests.

**Spec:** `docs/superpowers/specs/2026-08-26-submate-deep-refactor-design.md`

## Global Constraints

- Preserve existing Expo Router route names and visible user flows.
- Preserve existing Firestore collection names and stored document compatibility.
- Read legacy `isPaused`, `isFreeTrial`, and `assignedCardId`; new writes remain canonical.
- Do not add `any` in refactored files.
- Do not expose Firebase, Google, Expo, or native error codes to users.
- Do not modify or remove unrelated dirty-worktree changes.
- Do not upgrade Expo/React Native major versions.
- Do not deploy Firebase resources.
- Do not create APK or IPA artifacts.
- Run tests test-first: every production behavior added or corrected must first have a failing test whose failure reason is recorded in the task report.

---

### Task 1: Install a Real Expo Test Harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.json`
- Create: `jest.config.cjs`
- Create: `tests/setup/jest.setup.ts`
- Create: `tests/unit/testHarness.test.ts`

**Interfaces:**
- Consumes: Expo SDK 57 package alignment from `package.json`.
- Produces: `npm run test:unit`, a Jest environment capable of importing TypeScript production modules through the `@/` alias, and React Native component-test support for later tasks.

- [ ] **Step 1: Install Expo-compatible test dependencies**

Run on Windows from the repo root:

```powershell
npx expo install jest-expo jest @types/jest @testing-library/react-native react-test-renderer -- --save-dev
```

Expected: dependencies resolve against the installed React/Expo versions and `package-lock.json` changes without changing the Expo major.

- [ ] **Step 2: Add a failing production-import test**

Create `tests/unit/testHarness.test.ts`:

```ts
import { describe, expect, it } from '@jest/globals';
import { getMonthlyCost } from '@/features/dashboard/utils/calculations';

describe('Expo Jest test harness', () => {
  it('imports TypeScript production code through the application alias', () => {
    expect(getMonthlyCost(1200, 'yearly')).toBe(100);
  });
});
```

- [ ] **Step 3: Run the test before Jest configuration and record the expected failure**

Run:

```powershell
npx jest tests/unit/testHarness.test.ts --runInBand
```

Expected: FAIL because the repository has no Jest preset/configuration or alias mapping yet. A syntax error in the test is not an acceptable RED result.

- [ ] **Step 4: Configure Jest and TypeScript**

Create `jest.config.cjs`:

```js
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/firestore\\.rules\\.test\\.mjs$'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  clearMocks: true,
};
```

Create `tests/setup/jest.setup.ts`:

```ts
export {};
```

Add `jest` to `compilerOptions.types` while retaining `nativewind/types`:

```json
"types": ["nativewind/types", "jest"]
```

Add these scripts without replacing the existing release scripts yet:

```json
"test:unit": "jest --runInBand",
"test:components": "jest tests/components --runInBand --passWithNoTests",
"test:functions": "npm --prefix functions test"
```

- [ ] **Step 5: Verify GREEN and baseline compatibility**

Run:

```powershell
npm run test:unit -- tests/unit/testHarness.test.ts
npm run typecheck
npm run lint
```

Expected: the new test passes; typecheck and lint exit 0.

- [ ] **Step 6: Commit only the test-harness files**

```powershell
git add package.json package-lock.json tsconfig.json jest.config.cjs tests/setup/jest.setup.ts tests/unit/testHarness.test.ts
git commit -m "test: add Expo Jest harness"
```

### Task 2: Create Canonical Billing, Normalization, and Card Assignment

**Files:**
- Create: `src/domain/subscriptions/billing.ts`
- Create: `src/domain/subscriptions/normalization.ts`
- Create: `src/domain/subscriptions/cardAssignment.ts`
- Create: `tests/unit/domain/subscriptionBilling.test.ts`
- Create: `tests/unit/domain/subscriptionNormalization.test.ts`

**Interfaces:**
- Consumes: `BillingCycle`, `Subscription`, `ExchangeRates`, and legacy stored field shapes.
- Produces:
  - `MONTHLY_FACTOR_BY_CYCLE: Readonly<Record<BillingCycle, number>>`
  - `calculateSubscriptionCost(subscription, context): SubscriptionCostBreakdown`
  - `normalizeSubscriptionState(subscription): { isPaused: boolean; isTrial: boolean }`
  - `getAssignedCardId(subscription): string | null`

- [ ] **Step 1: Write failing billing tests with hand-derived literals**

Create table-driven tests for all six cycles using `amount: 1200`, TRY-to-TRY rates, and these monthly results:

```ts
const expectedMonthly = {
  weekly: 5200,
  monthly: 1200,
  quarterly: 400,
  biannually: 200,
  yearly: 100,
  biennially: 50,
} as const;
```

Also assert:

```ts
expect(calculateSubscriptionCost(paused, context)).toEqual({
  billingGross: 0,
  monthlyGross: 0,
  monthlyRecovered: 0,
  monthlyNet: 0,
});

expect(calculateSubscriptionCost(splitYearly, context).monthlyNet).toBe(75);
expect(calculateSubscriptionCost(usdMonthly, tryContext).monthlyGross).toBe(1000);
```

Use explicit fixture rates `{ TRY: 1, USD: 0.03, EUR: 0.027 }`; `usdMonthly.amount` is `30`, and the recovered yearly fixture has amount `1200` and one `shareAmount: 300`.

- [ ] **Step 2: Write failing normalization and card tests**

Assert these exact cases:

```ts
expect(normalizeSubscriptionState({ status: 'paused', isPaused: false })).toEqual({
  isPaused: true,
  isTrial: false,
});
expect(normalizeSubscriptionState({ isPaused: true, isFreeTrial: true })).toEqual({
  isPaused: true,
  isTrial: true,
});
expect(getAssignedCardId({ cardId: 'canonical', assignedCardId: 'legacy' })).toBe('canonical');
expect(getAssignedCardId({ assignedCardId: 'legacy' })).toBe('legacy');
expect(getAssignedCardId({})).toBeNull();
```

- [ ] **Step 3: Run both files and verify RED**

Run:

```powershell
npm run test:unit -- tests/unit/domain/subscriptionBilling.test.ts tests/unit/domain/subscriptionNormalization.test.ts
```

Expected: FAIL because the domain modules do not exist.

- [ ] **Step 4: Implement the minimal pure billing API**

Use these public types and factors in `billing.ts`:

```ts
import type { BillingCycle, Subscription } from '@/services/firebase/types';
import type { ExchangeRates } from '@/utils/currency';

export const MONTHLY_FACTOR_BY_CYCLE: Readonly<Record<BillingCycle, number>> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  biannually: 1 / 6,
  yearly: 1 / 12,
  biennially: 1 / 24,
};

export interface SubscriptionCostContext {
  baseCurrency: string;
  rates: Readonly<ExchangeRates>;
}

export interface SubscriptionCostBreakdown {
  billingGross: number;
  monthlyGross: number;
  monthlyRecovered: number;
  monthlyNet: number;
}

export type CostedSubscription = Pick<
  Subscription,
  'amount' | 'currency' | 'billingCycle' | 'status' | 'isPaused' | 'isSplit' | 'splitMembers'
> & { price?: number | string | null };
```

Implement conversion as `(amount / fromRate) * toRate`, return the original finite amount when either rate is missing/zero/non-finite, round public monetary fields to two decimals, use the typed factor record, cap recovered cost at gross cost, and return zeroes for canonical or legacy paused records.

- [ ] **Step 5: Implement legacy normalization and card assignment**

Use structural inputs rather than `any`:

```ts
export interface SubscriptionStateInput {
  status?: 'active' | 'paused' | null;
  isPaused?: boolean | null;
  isTrial?: boolean | null;
  isFreeTrial?: boolean | null;
}

export function normalizeSubscriptionState(input: SubscriptionStateInput) {
  return {
    isPaused: input.status === 'paused' || input.isPaused === true,
    isTrial: input.isTrial === true || input.isFreeTrial === true,
  };
}

export function getAssignedCardId(input: {
  cardId?: string | null;
  assignedCardId?: string | null;
}): string | null {
  return input.cardId || input.assignedCardId || null;
}
```

- [ ] **Step 6: Verify GREEN, typecheck, and lint**

Run:

```powershell
npm run test:unit -- tests/unit/domain/subscriptionBilling.test.ts tests/unit/domain/subscriptionNormalization.test.ts
npm run typecheck
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit the canonical cost slice**

```powershell
git add src/domain/subscriptions/billing.ts src/domain/subscriptions/normalization.ts src/domain/subscriptions/cardAssignment.ts tests/unit/domain/subscriptionBilling.test.ts tests/unit/domain/subscriptionNormalization.test.ts
git commit -m "refactor: add canonical subscription cost domain"
```

### Task 3: Create the Canonical Renewal Engine

**Files:**
- Create: `src/domain/subscriptions/recurrence.ts`
- Create: `tests/unit/domain/subscriptionRecurrence.test.ts`

**Interfaces:**
- Consumes: a structural subscription containing billing cycle, renewal/trial dates, and pause/trial legacy fields.
- Produces:
  - `parseSubscriptionDate(value): Date | null`
  - `getNextRenewal(subscription, from): Date | null`
  - `getRenewalsInRange(subscription, range): Date[]`

- [ ] **Step 1: Write failing recurrence tests**

Use local-noon dates to avoid test-environment timezone ambiguity and assert exact local date parts for:

```ts
31 Jan 2027 monthly -> 28 Feb 2027
31 Jan 2028 monthly -> 29 Feb 2028
30 Nov 2026 quarterly -> 28 Feb 2027
1 Jan 2020 weekly, from 26 Aug 2026 -> first date on or after 26 Aug 2026
1 Jan 2000 biennially, from 26 Aug 2026 -> 1 Jan 2028
future active trialEndDate -> trial end is the first renewal
paused legacy isPaused -> null and []
invalid renewal string -> null and []
```

For `getRenewalsInRange`, assert a monthly subscription anchored on 31 January returns the literal day sequence `[31 Jan, 28 Feb, 31 Mar]` for the inclusive January-March range.

- [ ] **Step 2: Run the recurrence test and verify RED**

Run:

```powershell
npm run test:unit -- tests/unit/domain/subscriptionRecurrence.test.ts
```

Expected: FAIL because `recurrence.ts` does not exist.

- [ ] **Step 3: Implement date parsing and arithmetic jumping**

Expose this structural input:

```ts
export interface RecurringSubscription {
  billingCycle: BillingCycle;
  renewalDate: unknown;
  status?: 'active' | 'paused';
  isPaused?: boolean | null;
  isTrial?: boolean | null;
  isFreeTrial?: boolean | null;
  trialEndDate?: unknown;
}
```

Rules:

- Clone valid `Date` values and support objects with a callable `toDate`.
- Return `null` for missing/invalid values; never replace an invalid date with `new Date()`.
- Normalize comparisons to local midnight.
- Weekly recurrence uses arithmetic week jumps.
- Month-based recurrence computes the month delta, divides by the cycle month span, builds one clamped candidate, and increments at most once; it must not use an unbounded loop.
- An active future trial date replaces the renewal anchor for the first occurrence.
- Range bounds are inclusive and range iteration is bounded from the known cycle/range length.

- [ ] **Step 4: Verify GREEN, typecheck, and lint**

Run:

```powershell
npm run test:unit -- tests/unit/domain/subscriptionRecurrence.test.ts
npm run typecheck
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit the recurrence slice**

```powershell
git add src/domain/subscriptions/recurrence.ts tests/unit/domain/subscriptionRecurrence.test.ts
git commit -m "refactor: add canonical renewal recurrence"
```

### Task 4: Route Existing Financial Consumers Through the Domain

**Files:**
- Modify: `src/utils/calculations.ts`
- Modify: `src/features/dashboard/utils/calculations.ts`
- Modify: `src/features/analytics/utils/financialAnalytics.ts`
- Modify: `src/services/background/widgetData.ts`
- Modify: `tests/widget-data.test.cjs`
- Create: `tests/unit/domain/crossConsumerProjection.test.ts`

**Interfaces:**
- Consumes: Task 2 billing API and Task 3 recurrence API.
- Produces: compatibility exports with existing names while removing duplicated factor and recurrence implementations.

- [ ] **Step 1: Add failing regression tests for the confirmed billing bug**

In `crossConsumerProjection.test.ts`, call the real `calculateMonthlyCosts` compatibility helper and assert:

```ts
expect(calculateMonthlyCosts({ amount: 1200, currency: 'TRY', billingCycle: 'biannually' }, 'TRY').gross).toBe(200);
expect(calculateMonthlyCosts({ amount: 1200, currency: 'TRY', billingCycle: 'biennially' }, 'TRY').gross).toBe(50);
```

Add a widget fixture with a future trial end earlier than renewal and assert that the widget chooses the trial date. Add an analytics/widget shared fixture and assert both monthly totals equal the same hand-derived literal.

- [ ] **Step 2: Run targeted tests and verify RED**

Run:

```powershell
npm run test:unit -- tests/unit/domain/crossConsumerProjection.test.ts
node --test tests/widget-data.test.cjs
```

Expected: the biannual/biennial compatibility assertions and trial-date widget assertion fail against current production behavior.

- [ ] **Step 3: Convert compatibility helpers into thin domain adapters**

In `src/utils/calculations.ts`, replace substring cycle checks with `calculateSubscriptionCost`. Obtain the current rate snapshot from the existing currency utility and preserve the returned `{ gross, net }` shape.

In dashboard calculations:

- Keep `getMonthlyCost` and `getYearlyCost` public, but implement them from `MONTHLY_FACTOR_BY_CYCLE`.
- Keep `getNextRenewalDate(currentRenewal, cycle)` public, but delegate to `getNextRenewal` with a structural active subscription and an optional `from = new Date()` parameter added at the end for deterministic tests.
- Use `calculateSubscriptionCost` inside `calculateMetrics` and replace legacy pause/trial/card checks with domain selectors.

- [ ] **Step 4: Remove analytics and widget recurrence/factor copies**

In `financialAnalytics.ts`, use `calculateSubscriptionCost`, `getNextRenewal`, and `getRenewalsInRange`. The six-month cash-flow loop must consume returned occurrences instead of calling local `addBillingCycle` loops.

In `widgetData.ts`:

- Extend `WidgetSubscription` with `isPaused`, `isTrial`, `isFreeTrial`, `trialEndDate`, `isSplit`, and typed split members.
- Replace `MONTHLY_FACTORS`, `toDate`, `addMonthsClamped`, and `getNextOccurrence` with the canonical APIs.
- Replace `BuildWidgetDataOptions.convertAmount` with `rates: Readonly<ExchangeRates>` and pass the rate snapshot returned by `getMarketRatesWithDynamicCache` from `widgetSync.tsx`; tests pass literal rates. This removes the widget projection's hidden global rate dependency.
- Preserve the `WidgetData` output shape and localized labels exactly.

- [ ] **Step 5: Verify projections across all migrated consumers**

Run:

```powershell
npm run test:unit -- tests/unit/domain/crossConsumerProjection.test.ts tests/unit/domain/subscriptionBilling.test.ts tests/unit/domain/subscriptionRecurrence.test.ts
node --test tests/widget-data.test.cjs
npm run typecheck
npm run lint
```

Expected: all commands exit 0 and the widget legacy tests remain green.

- [ ] **Step 6: Commit the consumer migration**

```powershell
git add src/utils/calculations.ts src/features/dashboard/utils/calculations.ts src/features/analytics/utils/financialAnalytics.ts src/services/background/widgetData.ts tests/widget-data.test.cjs tests/unit/domain/crossConsumerProjection.test.ts
git commit -m "refactor: unify subscription projections"
```

### Task 5: Introduce One User-Scoped Subscription Feed

**Files:**
- Create: `src/features/subscriptions/data/subscriptionRepository.ts`
- Create: `src/features/subscriptions/application/subscriptionKeys.ts`
- Create: `src/features/subscriptions/application/SubscriptionFeedProvider.tsx`
- Modify: `src/features/subscriptions/hooks/useSubscriptions.ts`
- Create: `tests/components/subscriptions/SubscriptionFeedProvider.test.tsx`

**Interfaces:**
- Consumes: `SubscriptionService.subscribeToSubscriptions`, `SubscriptionService.getSubscriptions`, auth UID, and React Query.
- Produces:
  - `SubscriptionRepository.subscribe(userId, onData, onError): () => void`
  - `SubscriptionRepository.fetch(userId): Promise<Subscription[]>`
  - UID-scoped `subscriptionKeys.list(userId)`
  - `SubscriptionFeedProvider`
  - `useSubscriptionFeedStatus(): { status; error; refresh }`

- [ ] **Step 1: Write failing provider behavior tests**

Render the real provider inside a real `QueryClientProvider` with an injected fake repository and explicit `userId` prop. Assert:

- one subscription call for `user-a` across child rerenders;
- cache key `subscriptionKeys.list('user-a')` receives the emitted list;
- changing the prop to `user-b` calls A's unsubscribe exactly once and opens exactly one B listener;
- unmount calls B's unsubscribe exactly once;
- `refresh()` calls `fetch('user-b')` once and writes that result without opening another listener;
- listener error sets status `error` while retaining the last cache snapshot.

- [ ] **Step 2: Run the provider test and verify RED**

Run:

```powershell
npm run test:unit -- tests/components/subscriptions/SubscriptionFeedProvider.test.tsx
```

Expected: FAIL because the provider, repository interface, and key module do not exist.

- [ ] **Step 3: Implement the repository adapter and shared keys**

Use this exact interface:

```ts
export interface SubscriptionRepository {
  subscribe(
    userId: string,
    onData: (subscriptions: Subscription[]) => void,
    onError: (error: Error) => void,
  ): () => void;
  fetch(userId: string): Promise<Subscription[]>;
}
```

The production adapter delegates to `SubscriptionService`. Move `subscriptionKeys` out of the hook file so provider and hooks cannot form a circular import.

- [ ] **Step 4: Implement the provider with explicit ownership**

Provider props:

```ts
interface SubscriptionFeedProviderProps {
  children: React.ReactNode;
  repository?: SubscriptionRepository;
  userId?: string | null;
}
```

When `userId` is `undefined`, read the UID from `useAuthStore`; explicit `null` means signed out. On UID change, remove only the previous UID's subscription query, close the previous listener, and then open the next listener. `refresh` is the only path that calls `fetch`; mounting must not call both `fetch` and `subscribe`.

- [ ] **Step 5: Make hooks cache observers rather than listener owners**

`useSubscriptions` keeps its public React Query result but uses a disabled query whose `queryFn` delegates to repository fetch only when an explicit `refetch()` is requested. `useLiveSubscriptions` becomes a deprecated compatibility alias that returns `useSubscriptions()` and opens no effect/listener.

- [ ] **Step 6: Verify single-listener behavior**

Run:

```powershell
npm run test:unit -- tests/components/subscriptions/SubscriptionFeedProvider.test.tsx
npm run typecheck
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit the feed slice**

```powershell
git add src/features/subscriptions/data/subscriptionRepository.ts src/features/subscriptions/application/subscriptionKeys.ts src/features/subscriptions/application/SubscriptionFeedProvider.tsx src/features/subscriptions/hooks/useSubscriptions.ts tests/components/subscriptions/SubscriptionFeedProvider.test.tsx
git commit -m "refactor: centralize subscription feed"
```

### Task 6: Remove Duplicate Mutation Fetch and Widget Side Effects

**Files:**
- Modify: `src/features/subscriptions/hooks/useSubscriptions.ts`
- Create: `tests/unit/subscriptions/subscriptionCacheUpdates.test.ts`
- Create: `src/features/subscriptions/application/subscriptionCacheUpdates.ts`

**Interfaces:**
- Consumes: Task 5 UID-scoped query cache and existing Firestore mutations.
- Produces: pure add/update/remove/pause cache reducers used by mutation callbacks; mutations no longer call widget sync or automatic invalidation.

- [ ] **Step 1: Write failing pure cache reducer tests**

Assert exact add, update, delete, and pause results from frozen input arrays. Include a server snapshot arriving after an optimistic update to show that `setQueryData` accepts the server list as final authority. The production change caught by each test is a mutation accidentally dropping or duplicating another subscription.

- [ ] **Step 2: Run and verify RED**

Run:

```powershell
npm run test:unit -- tests/unit/subscriptions/subscriptionCacheUpdates.test.ts
```

Expected: FAIL because the reducer module does not exist.

- [ ] **Step 3: Implement typed immutable reducers**

Export:

```ts
export function addCachedSubscription(current: Subscription[] | undefined, item: Subscription): Subscription[];
export function updateCachedSubscription(current: Subscription[] | undefined, id: string, patch: Partial<Subscription>): Subscription[];
export function removeCachedSubscription(current: Subscription[] | undefined, id: string): Subscription[];
```

Return new arrays, preserve unrelated object identities, and never mutate input.

- [ ] **Step 4: Use reducers and delete duplicate side effects**

In add/update/delete/pause mutation callbacks:

- retain haptics, localized toast, and notification scheduling/cancellation;
- update the UID-scoped cache through the pure reducers where immediate UI feedback is needed;
- remove imports/calls for `triggerWidgetSync` and `updateWidgetData`;
- remove automatic `invalidateQueries` calls because the single Firestore stream reconciles server state;
- leave explicit user refresh to `useSubscriptionFeedStatus().refresh`.

- [ ] **Step 5: Verify cache and hook compilation**

Run:

```powershell
npm run test:unit -- tests/unit/subscriptions/subscriptionCacheUpdates.test.ts
npm run typecheck
npm run lint
```

Expected: all commands exit 0 and `rg -n "triggerWidgetSync|updateWidgetData|invalidateQueries" src/features/subscriptions/hooks/useSubscriptions.ts` returns no matches.

- [ ] **Step 6: Commit the mutation cleanup**

```powershell
git add src/features/subscriptions/application/subscriptionCacheUpdates.ts src/features/subscriptions/hooks/useSubscriptions.ts tests/unit/subscriptions/subscriptionCacheUpdates.test.ts
git commit -m "refactor: isolate subscription cache updates"
```

### Task 7: Add a Latest-Wins Widget Coordinator and Bridge

**Files:**
- Create: `src/services/background/latestWinsCoordinator.ts`
- Create: `src/services/background/WidgetSyncBridge.tsx`
- Modify: `src/services/background/widgetSync.tsx`
- Modify: `src/app/(tabs)/_layout.tsx`
- Modify: `src/app/(tabs)/index.tsx`
- Create: `tests/unit/widget/latestWinsCoordinator.test.ts`
- Create: `tests/components/widget/WidgetSyncBridge.test.tsx`

**Interfaces:**
- Consumes: subscription cache snapshots, base currency, language, and `performWidgetDataUpdate`.
- Produces:
  - `createLatestWinsCoordinator<T, R>({ keyOf, run })`
  - one mounted `WidgetSyncBridge`
  - no dashboard or mutation-owned widget effect.

- [ ] **Step 1: Write failing coordinator tests**

With a manually controlled async `run`, assert:

- requests A, B, C submitted while A runs execute only A then C;
- two sequential requests with the same `keyOf` value execute once;
- a rejected run does not poison a later request;
- every caller promise settles with the final executed result or rejection defined by its submitted batch.

- [ ] **Step 2: Write a failing bridge ownership test**

Render the bridge with injected snapshot values and an injected `scheduleUpdate` spy. Assert initial schedule once, identical rerender zero additional calls, changed amount one additional call, base currency change one additional call, language change one additional call, and unmount no call.

- [ ] **Step 3: Run and verify RED**

Run:

```powershell
npm run test:unit -- tests/unit/widget/latestWinsCoordinator.test.ts tests/components/widget/WidgetSyncBridge.test.tsx
```

Expected: FAIL because the coordinator and bridge do not exist.

- [ ] **Step 4: Implement the pure coordinator**

The coordinator must keep `pending`, `running`, `lastCompletedKey`, and one drain promise. It must replace pending input with the newest input, skip a key equal to `lastCompletedKey`, recover after rejection, and expose `submit(input): Promise<R | null>` plus `reset(): void`.

- [ ] **Step 5: Route widget sync through the coordinator**

Keep background fetch and native rendering in `widgetSync.tsx`. Export `performWidgetDataUpdate` only for the coordinator adapter test if required, not as general UI API. Construct the content key from stable sorted subscription fields plus base currency and language; do not use object identity. `updateWidgetData` submits to the coordinator.

- [ ] **Step 6: Mount the single owner and remove old owners**

`WidgetSyncBridge` reads `useSubscriptions().data`, `useCurrencyStore(state => state.baseCurrency)`, and `currentLanguage`. Mount exactly one bridge under `SubscriptionFeedProvider` in the tabs layout. Remove:

- `useLiveSubscriptions()` as a listener bootstrap from `TabsLayout`;
- dashboard's `updateWidgetData` import/effect;
- any remaining mutation-owned widget calls from Task 6.

The tabs layout shape becomes:

```tsx
return (
  <SubscriptionFeedProvider>
    <WidgetSyncBridge />
    <Tabs>{/* existing screens unchanged */}</Tabs>
  </SubscriptionFeedProvider>
);
```

- [ ] **Step 7: Verify one widget path**

Run:

```powershell
npm run test:unit -- tests/unit/widget/latestWinsCoordinator.test.ts tests/components/widget/WidgetSyncBridge.test.tsx
node --test tests/widget-data.test.cjs
npm run typecheck
npm run lint
rg -n "updateWidgetData" src/app src/features/subscriptions
```

Expected: tests/typecheck/lint exit 0; the search finds only `WidgetSyncBridge` (and no dashboard/mutation call site).

- [ ] **Step 8: Commit the widget ownership slice**

```powershell
git add src/services/background/latestWinsCoordinator.ts src/services/background/WidgetSyncBridge.tsx src/services/background/widgetSync.tsx src/app/'(tabs)'/_layout.tsx src/app/'(tabs)'/index.tsx tests/unit/widget/latestWinsCoordinator.test.ts tests/components/widget/WidgetSyncBridge.test.tsx
git commit -m "refactor: centralize widget synchronization"
```

### Task 8: Make Wave 1 a Trustworthy Release Checkpoint

**Files:**
- Modify: `package.json`
- Modify: `scripts/verify-all.js`
- Create: `docs/testing/BETA_CHECKLIST.md`

**Interfaces:**
- Consumes: all Wave 1 tests and existing Functions/rules/security commands.
- Produces: `test:legacy`, `test:all`, and `verify:release` commands that fail on real assertion failures and include Functions tests. The copied legacy cases remain quarantined until their production modules are extracted in later waves.

- [ ] **Step 1: Demonstrate the legacy runner failure-mode before retiring it**

Temporarily change one assertion in a disposable working copy of `scripts/verify-all.js`, run it, and record that the old implementation exits 0 despite logging FAIL. Restore the file immediately; do not commit the mutation. This establishes the defect without preserving a failing test.

- [ ] **Step 2: Make the quarantined legacy runner fail correctly**

Add `failedTests`, increment it in `runTest`'s catch branch, and set `process.exitCode = 1` after the summary when `failedTests > 0`. Do not rewrite or expand the copied cases in this task; later waves retire them as their production modules become directly testable.

- [ ] **Step 3: Wire real and quarantined tests into explicit commands**

Set scripts to:

```json
"test:legacy": "node scripts/verify-all.js",
"test:verify": "node --test tests/i18n-integrity.test.cjs tests/widget-data.test.cjs",
"test:all": "npm run test:unit && npm run test:verify && npm run test:legacy && npm run test:functions && npm run test:security",
"test": "npm run test:all && npm run test:rules",
"verify:release": "npm run typecheck && npm --prefix functions run build && npm run lint && npm run test:all && npm run test:rules && npm run audit:production && npm run audit:functions && npx expo-doctor && npx expo export --platform android --output-dir .expo-export-check --clear"
```

Do not add APK/IPA commands. Do not deploy Firebase.

- [ ] **Step 4: Verify the corrected runner catches a deliberate failure**

Repeat the disposable assertion mutation, run `npm run test:legacy`, and verify a non-zero exit. Restore the assertion, rerun, and verify exit 0. Neither deliberate mutation is committed.

- [ ] **Step 5: Add the physical-device beta checklist**

Document deterministic checks for Android add/update/delete/pause widget refresh, account switch data isolation, Turkish/English widget labels, calendar renewal equivalence, and offline/reconnect feed behavior. Mark physical-device results as user-owned release evidence rather than automatic test evidence.

- [ ] **Step 6: Run the complete Wave 1 verification gate**

Run:

```powershell
npm run typecheck
npm --prefix functions run build
npm run lint
npm run test:all
npm run test:rules
npm run audit:production
npm run audit:functions
npx expo-doctor
npx expo export --platform android --output-dir .expo-export-check --clear
```

Expected: every required command exits 0. If Firestore emulator prerequisites are unavailable, record that exact environmental blocker; do not claim the full gate is green.

- [ ] **Step 7: Confirm architectural ownership and file sizes**

Run:

```powershell
rg -n "subscribeToSubscriptions" src
rg -n "updateWidgetData" src/app src/features
rg -n "MONTHLY_FACTORS|cycle.includes\('year'\)|while \(.*renew" src/domain src/features src/services src/utils
git diff --check
```

Expected:

- one production subscription listener owner;
- one foreground widget bridge caller;
- no duplicated billing substring checks in migrated paths;
- no whitespace errors.

- [ ] **Step 8: Commit the Wave 1 checkpoint**

```powershell
git add package.json package-lock.json scripts/verify-all.js docs/testing/BETA_CHECKLIST.md
git commit -m "test: establish Wave 1 release gate"
```

Do not stage `.expo-export-check`, `.eas-session`, `.npm-cache`, or APK artifacts.
