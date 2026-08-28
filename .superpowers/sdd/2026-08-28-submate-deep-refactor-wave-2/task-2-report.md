# Wave 2 Task 2 — Receipt scanner boundary

## Scope

- Added `useReceiptScanner`, a dependency-injected receipt scanning hook.
- Added focused tests for permission denial, picker cancellation, missing base64, parsed success data, unreadable service response, analyzer errors, and stale-result suppression.
- Did not modify the legacy `SubscriptionForm` integration.

## TDD evidence

### RED

Command:

```powershell
npx jest tests/components/subscription-form/useReceiptScanner.test.tsx --runInBand
```

Observed result before production code: failed with Jest configuration error stating that `@/features/subscriptions/components/subscription-form/hooks/useReceiptScanner` could not be located. This was the expected missing-hook failure.

### GREEN

After implementing the hook and mocking only the Firebase-backed production analyzer module at the test boundary, the focused test command passed:

```text
Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

The focused test was rerun after the strict-type fixture fix and remained green. `npm run typecheck` then completed successfully with exit code 0.

## Design notes

- `ReceiptFormPatch` is based on the parsed `SubscriptionFormData` subset, so `amount` remains numeric despite Zod's raw `coerce.number()` input type.
- Scan requests use a monotonic token; a superseded request always resolves as `cancelled` and never exposes stale data.
- The production analyzer's `null` result is `unreadable`; injected analyzer throws become `error`.
- The hook imports neither React Hook Form nor UI feedback APIs and does not mutate form state.
