# SubMate Deep Refactor Wave 2 Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the 1,496-line subscription form behind its existing public import, remove unsafe form access and duplicated rules, and navigate from add/edit routes only after a successful mutation.

**Architecture:** Keep `src/features/subscriptions/components/SubscriptionForm.tsx` as a compatibility facade. A new `subscription-form/` module owns one typed React Hook Form context, leaf fields/sections, a receipt-scanning adapter, and a canonical budget guard. Routes await existing mutation hooks; mutation hooks remain the sole owner of success/error feedback.

**Tech stack:** Expo SDK 57, React Native 0.86, TypeScript 6, React Hook Form 7, Zod 4, TanStack Query 5, Jest 29, React Native Testing Library 14.

**Constraints:** Preserve visible behavior and public imports; add no `any` in the refactored path; use the Wave 1 billing domain; do not build APK/IPA; do not deploy Firebase; do not touch unrelated working-tree changes.

---

## Task 1: Establish the typed form contract, catalog, and defaults

**Files:**

- Modify: `src/features/subscriptions/schemas/subscription.schema.ts`
- Create: `src/features/subscriptions/components/subscription-form/SubscriptionForm.types.ts`
- Create: `src/features/subscriptions/components/subscription-form/constants.ts`
- Create: `src/features/subscriptions/components/subscription-form/formDefaults.ts`
- Test: `tests/unit/subscriptions/subscriptionFormModel.test.ts`

### Step 1: Write the failing tests

Cover complete new-form defaults, isolated mutable arrays for edit defaults, UI categories derived from `SUBSCRIPTION_CATEGORIES`, a shared 100-character name boundary, and Zod input string amount to output number coercion.

Representative assertions:

```ts
expect(subscriptionSchema.parse({ ...validInput, amount: '19.99' }).amount).toBe(19.99);
expect(createSubscriptionFormDefaults({ name: 'Netflix' }).name).toBe('Netflix');
expect(SUBSCRIPTION_CATEGORY_OPTIONS.map(option => option.value)).toEqual([...SUBSCRIPTION_CATEGORIES]);
```

### Step 2: Confirm RED

Run: `npx jest tests/unit/subscriptions/subscriptionFormModel.test.ts --runInBand`

Expected: FAIL because the typed modules do not exist and the schema does not expose distinct input/output types.

### Step 3: Implement the minimal model

Export:

```ts
export type SubscriptionFormInput = z.input<typeof subscriptionSchema>;
export type SubscriptionFormData = z.output<typeof subscriptionSchema>;
```

Align manual/schema/receipt name limits at 100, matching the existing receipt API and Firestore rule. Define `SubscriptionFormSubmit` as `(data: SubscriptionFormData) => void | Promise<void>` and preserve all current props, including `externalAmount`. Build immutable defaults with `createSubscriptionFormDefaults(initialData?)`. Derive category options from the schema tuple; do not duplicate category values.

### Step 4: Confirm GREEN

Run:

- `npx jest tests/unit/subscriptions/subscriptionFormModel.test.ts --runInBand`
- `npm run typecheck`

Expected: PASS.

### Step 5: Commit

Commit message: `refactor: define typed subscription form model`

## Task 2: Extract receipt scanning behind a typed adapter

**Files:**

- Create: `src/features/subscriptions/components/subscription-form/hooks/useReceiptScanner.ts`
- Test: `tests/components/subscription-form/useReceiptScanner.test.tsx`
- Reference only: `src/services/ai/gemini.ts`

### Step 1: Write failing hook tests

Inject picker, permission, image manipulation, and analyzer dependencies. Test permission denial, picker cancellation, missing base64, successful typed patch, service failure, and stale result suppression when a newer scan starts.

### Step 2: Confirm RED

Run: `npx jest tests/components/subscription-form/useReceiptScanner.test.tsx --runInBand`

Expected: FAIL because the hook does not exist.

### Step 3: Implement the receipt boundary

Use a discriminated result:

```ts
export type ReceiptFormPatch = Partial<
  Pick<SubscriptionFormInput, 'name' | 'amount' | 'currency' | 'billingCycle'>
>;

export type ReceiptScanResult =
  | { status: 'success'; patch: ReceiptFormPatch }
  | { status: 'permission-denied' | 'cancelled' | 'unreadable' | 'error' };
```

The hook owns permission, selection, compression, base64 validation, AI request lifecycle, loading, and stale-result protection. It never imports React Hook Form and never clears existing values on failure.

### Step 4: Confirm GREEN

Run:

- `npx jest tests/components/subscription-form/useReceiptScanner.test.tsx --runInBand`
- `npm run typecheck`

Expected: PASS.

### Step 5: Commit

Commit message: `refactor: isolate subscription receipt scanning`

## Task 3: Extract canonical budget projection and exactly-once guard

**Files:**

- Create: `src/features/subscriptions/components/subscription-form/hooks/useBudgetGuard.ts`
- Create: `src/features/subscriptions/components/subscription-form/hooks/useSubscriptionFormDependencies.ts`
- Test: `tests/unit/subscriptions/subscriptionBudgetGuard.test.ts`
- Test: `tests/components/subscription-form/useBudgetGuard.test.tsx`

### Step 1: Write failing pure and hook tests

Test canonical paused/split behavior, edit replacement rather than double counting, immediate submit when no budget applies, below-budget submit once, over-budget cancel zero times, over-budget confirm once, and protection against duplicate concurrent submit.

### Step 2: Confirm RED

Run: `npx jest tests/unit/subscriptions/subscriptionBudgetGuard.test.ts tests/components/subscription-form/useBudgetGuard.test.tsx --runInBand`

Expected: FAIL because the projection and guard do not exist.

### Step 3: Implement pure projection plus confirmation adapter

`useBudgetGuard` receives `project`, async `confirm`, and `submit` dependencies. It reads no store and calls neither `window.confirm` nor `Alert.alert`. `useSubscriptionFormDependencies` composes subscriptions, base currency, rates, budget, canonical Wave 1 billing, and localized platform confirmation. Do not use `calculateMonthlyCosts` or data casts.

### Step 4: Confirm GREEN

Run:

- `npx jest tests/unit/subscriptions/subscriptionBudgetGuard.test.ts tests/components/subscription-form/useBudgetGuard.test.tsx --runInBand`
- `npm run typecheck`

Expected: PASS.

### Step 5: Commit

Commit message: `refactor: add canonical subscription budget guard`

## Task 4: Extract reusable typed fields and picker modal

**Files:**

- Create: `src/features/subscriptions/components/subscription-form/fields/OptionPickerModal.tsx`
- Create: `src/features/subscriptions/components/subscription-form/fields/OptionPickerField.tsx`
- Create: `src/features/subscriptions/components/subscription-form/fields/AmountCurrencyField.tsx`
- Create: `src/features/subscriptions/components/subscription-form/fields/SubscriptionDateField.tsx`
- Test: `tests/components/subscription-form/SubscriptionFormFields.test.tsx`

### Step 1: Write failing interaction tests

Render fields inside a typed `FormProvider`. Verify picker open/select/close, independent amount and currency updates, field-specific errors, equal web/native date normalization, accessible selected states, and layouts that do not require fixed horizontal widths.

### Step 2: Confirm RED

Run: `npx jest tests/components/subscription-form/SubscriptionFormFields.test.tsx --runInBand`

Expected: FAIL because the extracted fields do not exist.

### Step 3: Implement leaf fields

Use typed `Controller`/`useController`, never a field-name cast. Picker components own visibility. `SubscriptionDateField` owns its web input ref and native picker visibility. Preserve translation keys and accessible labels.

### Step 4: Confirm GREEN

Run:

- `npx jest tests/components/subscription-form/SubscriptionFormFields.test.tsx --runInBand`
- `npm run typecheck`
- `npm run lint`

Expected: PASS.

### Step 5: Commit

Commit message: `refactor: extract typed subscription form fields`

## Task 5: Assemble sections and replace the monolith with a facade

**Files:**

- Create: `src/features/subscriptions/components/subscription-form/sections/BasicSubscriptionSection.tsx`
- Create: `src/features/subscriptions/components/subscription-form/sections/AdvancedSubscriptionSection.tsx`
- Create: `src/features/subscriptions/components/subscription-form/sections/SplitMembersSection.tsx`
- Create: `src/features/subscriptions/components/subscription-form/sections/SubscriptionFormActions.tsx`
- Create: `src/features/subscriptions/components/subscription-form/subscriptionForm.styles.ts`
- Create: `src/features/subscriptions/components/subscription-form/SubscriptionForm.tsx`
- Replace: `src/features/subscriptions/components/SubscriptionForm.tsx`
- Test: `tests/components/subscription-form/SubscriptionForm.test.tsx`

### Step 1: Write facade-level characterization tests

Import only through the existing public path. Verify new/edit values, selectors, split append/remove, receipt patch application, typed `externalAmount`, exact parsed submit payload, budget cancel/confirm, rejected async submit preserving values/mount, and duplicate-submit prevention while loading.

### Step 2: Confirm the required failures

Run: `npx jest tests/components/subscription-form/SubscriptionForm.test.tsx --runInBand`

Expected: existing visual behavior assertions may pass, while new typed async/error ownership assertions fail before extraction.

### Step 3: Move cohesive UI into sections

- `BasicSubscriptionSection`: primary fields and receipt trigger UI.
- `AdvancedSubscriptionSection`: trial, contract, reminder, card/payment, and advanced options.
- `SplitMembersSection`: sole owner of `useFieldArray({ name: 'splitMembers' })`.
- `SubscriptionFormActions`: submit/delete UI only, with no mutation/navigation.
- `subscriptionForm.styles.ts`: styles moved without a visual redesign.

### Step 4: Implement the root coordinator

Use one form instance and provider:

```ts
useForm<SubscriptionFormInput, undefined, SubscriptionFormData>({
  resolver: zodResolver(subscriptionSchema),
  defaultValues: createSubscriptionFormDefaults(initialData),
});
```

The root owns `FormProvider`, typed `setValue` for `externalAmount`, typed receipt-patch application, the budget guard, and async submit-error containment. Native picker state and field arrays stay in their leaf owners.

Replace the old public file with a compatibility export:

```ts
export { SubscriptionForm } from './subscription-form/SubscriptionForm';
export type { SubscriptionFormProps } from './subscription-form/SubscriptionForm.types';
```

### Step 5: Verify behavior and ownership

Run:

- `npx jest tests/components/subscription-form/SubscriptionForm.test.tsx tests/components/subscription-form/SubscriptionFormFields.test.tsx tests/components/subscription-form/useReceiptScanner.test.tsx --runInBand`
- `npm run typecheck`
- `npm run lint`
- `rg -n "control\._formValues|zodResolver\([^\n]*as any|data as any" src/features/subscriptions/components`

Expected: test/typecheck/lint PASS; ownership search returns no refactored-path matches.

### Step 6: Check size boundaries

Run:

```powershell
Get-ChildItem src/features/subscriptions/components/subscription-form -Recurse -File |
  ForEach-Object { "{0}`t{1}" -f (Get-Content $_.FullName).Count, $_.FullName }
```

Expected: coordinator near 200 lines; no new controller/section above 500; leaf components normally below 250. Split further only when a file still has multiple responsibilities.

### Step 7: Commit

Commit message: `refactor: split subscription form facade`

## Task 6: Make add/edit navigation mutation-safe

**Files:**

- Modify: `src/app/(tabs)/subscriptions/add.tsx`
- Modify: `src/app/(tabs)/subscriptions/[id].tsx`
- Test: `tests/components/subscription-form/SubscriptionRoutes.test.tsx`

### Step 1: Write failing route tests

For both routes, verify the exact `mutateAsync` payload, no navigation while pending, no navigation after rejection, form remains rendered after rejection, exactly one navigation after resolution, and no route-level duplicate toast/haptic already owned by mutation hooks.

### Step 2: Confirm RED

Run: `npx jest tests/components/subscription-form/SubscriptionRoutes.test.tsx --runInBand`

Expected: FAIL because routes currently call `mutate` and navigate immediately.

### Step 3: Await mutation success

Destructure `mutateAsync`; make submit handlers async; await mutation and only then navigate. Catch rejection only to keep the form open. Do not add duplicate feedback because the mutation hook owns localized success/error handling.

### Step 4: Confirm GREEN

Run:

- `npx jest tests/components/subscription-form/SubscriptionRoutes.test.tsx tests/components/subscription-form/SubscriptionForm.test.tsx --runInBand`
- `npm run typecheck`
- `npm run lint`

Expected: PASS.

### Step 5: Commit

Commit message: `fix: navigate after subscription mutation succeeds`

## Task 7: Run the Wave 2 checkpoint and record residual risks

**Files:**

- Create: `docs/testing/subscription-form-wave-2-checklist.md`
- Modify only if implementation facts require it: `docs/superpowers/plans/2026-08-28-submate-deep-refactor-wave-2.md`

### Step 1: Run scoped suites

Run: `npx jest tests/unit/subscriptions/subscriptionFormModel.test.ts tests/unit/subscriptions/subscriptionBudgetGuard.test.ts tests/components/subscription-form --runInBand`

Expected: PASS.

### Step 2: Run ownership searches

Run:

```powershell
rg -n "control\._formValues|zodResolver\([^\n]*as any|data as any" src/features/subscriptions/components/subscription-form src/features/subscriptions/components/SubscriptionForm.tsx
rg -n "ImagePicker|ImageManipulator|analyzeReceiptImage" src/features/subscriptions/components/subscription-form
rg -n "calculateMonthlyCosts|window\.confirm|Alert\.alert" src/features/subscriptions/components/subscription-form
rg -n "mutate: (addSubscription|updateSubscription)|router\.(back|replace|push)" 'src/app/(tabs)/subscriptions/add.tsx' 'src/app/(tabs)/subscriptions/[id].tsx'
```

Expected: no private RHF/casts; receipt native APIs only in the receipt hook; confirmation only in the dependency adapter; no legacy calculation helper; navigation follows awaited `mutateAsync`.

### Step 3: Run the full release gate

Run: `npm run verify:release`

Expected: exit 0 for typecheck, Functions build, lint, Jest, Node verification, Functions/security/rules tests, production audits, Expo Doctor, and Android production JavaScript export. This does not build an APK.

### Step 4: Inspect the Wave 2 diff

Run:

- `git diff --check f8d1189..HEAD`
- `git diff --stat f8d1189..HEAD`
- `git status --short`

Expected: clean diff check; only known user-owned files remain outside Wave 2.

### Step 5: Record later physical-device checks

Checklist: add/edit, trial, contract, split, receipt scan, keyboard-open small Android modals, iPhone notch/Dynamic Island, iPad safe area, Turkish/English, light/dark, failed mutation preserving values, and successful mutation closing once. Do not claim physical-device verification before the user runs it.

### Step 6: Request independent review

Review `f8d1189..HEAD` against this plan. Classify Critical/Important/Minor, reproduce material findings, make one bounded correction pass, and rerun affected tests plus `verify:release`.

### Step 7: Commit

Commit message: `docs: add SubscriptionForm beta checklist`

## Wave 2 completion criteria

- Existing `SubscriptionForm` imports remain valid.
- The old 1,496-line module is a facade and responsibilities are typed.
- Zod input/output types are distinct and correct.
- No private React Hook Form state or `any` remains in the refactored path.
- Receipt failure never erases fields.
- Budget confirmation submits zero or one time, never twice.
- Add/edit rejection preserves the form and does not navigate.
- Add/edit success navigates once after mutation resolution.
- Category and name constraints have one canonical contract.
- Full release verification passes without APK/IPA creation or Firebase deployment.
