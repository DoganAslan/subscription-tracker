# Data and Account Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace unvalidated backup paths with a versioned user-data export/import contract and make account deletion truthful, retryable and safe.

**Architecture:** A new backup domain module owns JSON envelope creation and validation before mutation. `src/utils/vault.ts` becomes a UI-facing façade over that module instead of directly accepting arbitrary AsyncStorage entries. Auth deletion calls explicit cloud-data cleanup, then Firebase Auth deletion, then local cleanup; no success state is returned before Auth deletion succeeds.

**Tech Stack:** Expo DocumentPicker/FileSystem/Sharing, Firebase Auth/Firestore, AsyncStorage, Zod, Jest.

**Spec:** `docs/superpowers/specs/2026-09-06-global-release-readiness-design.md`

## Global Constraints

- Export no tokens, API keys, Sentry data, runtime cache, biometric secret or Firebase authentication state.
- Limit import size before parsing and validate all data before the first write.
- Replacement import requires explicit confirmation and must not partially overwrite on invalid input.
- Do not claim fully atomic cloud deletion; Cloud Functions/Blaze is out of scope.
- A user-exported backup file remains outside app-controlled deletion.

---

### Task 1: Define versioned backup envelope and pure validation

**Files:**
- Create: `src/services/backup/types.ts`
- Create: `src/services/backup/backupSchema.ts`
- Create: `src/services/backup/backupValidation.ts`
- Create: `tests/unit/backup/backupValidation.test.ts`

**Interfaces:**
- Produces: `BackupEnvelope`, `BACKUP_SCHEMA_VERSION`, `parseBackupEnvelope(json: string): BackupValidationResult`.
- Consumed by: export/import service and settings backup UI.

- [ ] **Step 1: Write failing validation tests**

```ts
import { parseBackupEnvelope } from '@/services/backup/backupValidation';

it('accepts a current, minimal backup envelope', () => {
  expect(parseBackupEnvelope(JSON.stringify({ schemaVersion: 1, createdAt: '2026-09-06T00:00:00.000Z', appVersion: '1.5.1', subscriptions: [], cards: [], settings: {} }))).toMatchObject({ ok: true });
});

it.each(['{', JSON.stringify({ schemaVersion: 99 }), JSON.stringify({ schemaVersion: 1, subscriptions: [{ amount: -1 }] })])('rejects malformed or incompatible backup %s', raw => {
  expect(parseBackupEnvelope(raw)).toMatchObject({ ok: false });
});
```

- [ ] **Step 2: Run test before implementation**

Run: `npx jest tests/unit/backup/backupValidation.test.ts --runInBand`

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement Zod schema with field allow-lists**

```ts
export const BackupEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  createdAt: z.string().datetime(),
  appVersion: z.string().min(1).max(32),
  subscriptions: z.array(SubscriptionBackupSchema).max(500),
  cards: z.array(CardBackupSchema).max(100),
  settings: BackupSettingsSchema,
}).strict();
```

`SubscriptionBackupSchema` and `CardBackupSchema` must enumerate only fields the current forms can restore. Validate amount as finite non-negative number, `billingCycle`/category/card type via existing enums, date strings as valid ISO dates, and text length limits. Return `{ ok: false, reason: 'invalid-json' | 'unsupported-version' | 'invalid-data' }`; do not throw parsed user content.

- [ ] **Step 4: Run focused tests**

Run: `npx jest tests/unit/backup/backupValidation.test.ts --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit schema domain**

```bash
git add src/services/backup tests/unit/backup/backupValidation.test.ts
git commit -m "feat: validate versioned backup envelopes"
```

### Task 2: Refactor export/import into an all-or-nothing user flow

**Files:**
- Modify: `src/services/backupService.ts`
- Modify: `src/utils/vault.ts`
- Modify: `src/features/settings/hooks/useSettingsActions.ts`
- Modify: `src/features/settings/components/DataVaultCard.tsx`
- Create: `tests/unit/backup/backupService.test.ts`

**Interfaces:**
- Consumes: Task 1 `BackupEnvelope` and validation result.
- Produces: `createUserBackup(userId)`, `importUserBackup(userId, raw, mode)`, where `mode` is `'replace' | 'merge'` and result is `{ ok, reason? }`.

- [ ] **Step 1: Write failing service tests**

```ts
it('exports only the defined envelope keys', async () => {
  const backup = await createUserBackup('user-1');
  expect(Object.keys(backup)).toEqual(['schemaVersion', 'createdAt', 'appVersion', 'subscriptions', 'cards', 'settings']);
  expect(JSON.stringify(backup)).not.toMatch(/token|apiKey|credential|widget_data/i);
});

it('does not delete existing cloud records for invalid imports', async () => {
  await importUserBackup('user-1', '{bad json', 'replace');
  expect(SubscriptionService.deleteAllSubscriptions).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test before implementation**

Run: `npx jest tests/unit/backup/backupService.test.ts --runInBand`

Expected: FAIL because current import deletes subscriptions after only a loose version check.

- [ ] **Step 3: Build the export from explicit repositories**

```ts
const envelope: BackupEnvelope = {
  schemaVersion: BACKUP_SCHEMA_VERSION,
  createdAt: new Date().toISOString(),
  appVersion: Constants.expoConfig?.version ?? 'unknown',
  subscriptions: toSubscriptionBackup(await SubscriptionService.getSubscriptions(userId)),
  cards: toCardBackup(await CardService.getCards(userId)),
  settings: await readBackupSettings(),
};
```

Use DocumentPicker with `copyToCacheDirectory: true` and accept `application/json` only. Reject files exceeding the defined byte limit before `JSON.parse`. The share sheet receives only serialised envelope content.

- [ ] **Step 4: Make replacement import staged**

```ts
const parsed = parseBackupEnvelope(raw);
if (!parsed.ok) return parsed;
const prepared = toFirestorePayloads(parsed.value);
await replaceUserData(userId, prepared); // called only after every record is prepared
await resyncAllReminders(prepared.subscriptions);
return { ok: true };
```

Keep the existing data if parse/preparation fails. If a cloud write fails after replacement begins, return a localized “restore did not complete” result and preserve the original backup file for retry; do not report success. Make `vault.ts` call this service rather than `AsyncStorage.multiSet` on arbitrary keys.

- [ ] **Step 5: Add deliberate UI copy**

`DataVaultCard` must state that JSON export can contain entered financial labels/amounts and that Restore replaces current compatible data after confirmation. Add Turkish and English success/error states; no raw parser or Firebase exception appears in Alert.

- [ ] **Step 6: Run focused tests**

Run: `npx jest tests/unit/backup --runInBand && npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit backup flow**

```bash
git add src/services/backupService.ts src/utils/vault.ts src/features/settings tests/unit/backup
git commit -m "feat: harden user backup and restore flow"
```

### Task 3: Make account deletion ordered, retriable and truthful

**Files:**
- Modify: `src/services/firebase/firestore.ts`
- Modify: `src/services/firebase/auth.ts`
- Modify: `src/features/settings/account/hooks/useAccountSecurityActions.ts`
- Modify: `src/features/settings/account/components/DeleteAccountModal.tsx`
- Create: `tests/unit/firebase/deleteAccount.test.ts`

**Interfaces:**
- Produces: `deleteUserCloudData(userId): Promise<void>` and `deleteAccount(): Promise<DeleteAccountResult>`.
- Consumes: current Firebase user after caller handles required re-authentication.

- [ ] **Step 1: Write failing sequencing tests**

```ts
it('does not delete Firebase Auth until subscriptions, cards, and profile deletion resolve', async () => {
  await AuthService.deleteAccount();
  expect(deleteUser).toHaveBeenCalledAfter(SubscriptionService.deleteAllSubscriptions);
  expect(deleteUser).toHaveBeenCalledAfter(CardService.deleteAllCards);
  expect(deleteUser).toHaveBeenCalledAfter(SubscriptionService.deleteUserDocument);
});

it('does not clear local state or report success when Firebase Auth deletion fails', async () => {
  deleteUser.mockRejectedValueOnce(new Error('requires-recent-login'));
  await expect(AuthService.deleteAccount()).resolves.toMatchObject({ ok: false, stage: 'auth' });
  expect(AsyncStorage.clear).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests before implementation**

Run: `npx jest tests/unit/firebase/deleteAccount.test.ts --runInBand`

Expected: FAIL because current API throws without a structured stage result and clears broad AsyncStorage after only success path.

- [ ] **Step 3: Add explicit cloud cleanup and result type**

```ts
export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; stage: 'reauth' | 'cloud' | 'auth' | 'local'; errorCode?: string };

export async function deleteUserCloudData(userId: string): Promise<void> {
  await SubscriptionService.deleteAllSubscriptions(userId);
  await CardService.deleteAllCards(userId);
  await SubscriptionService.deleteUserDocument(userId);
}
```

Call `deleteUserCloudData`, then `deleteUser(user)`, then cancel local reminders, clear monitoring context, and clear only known account-scoped storage keys. A local cleanup failure after Auth deletion returns `{ ok: true }` plus a non-blocking local-cleanup warning, because the account is already gone.

- [ ] **Step 4: Update modal/hook results without raw provider messages**

Map `reauth` to “Sign in again and retry / Yeniden giriş yapıp tekrar dene,” `cloud` to a retry message, and `auth` to an explanation that the account was not deleted. Tell the user separately that exported JSON backups are not deleted by account deletion.

- [ ] **Step 5: Run focused tests**

Run: `npx jest tests/unit/firebase/deleteAccount.test.ts tests/components/account-settings/AccountSettingsScreen.test.tsx --runInBand`

Expected: PASS.

- [ ] **Step 6: Commit account lifecycle**

```bash
git add src/services/firebase/firestore.ts src/services/firebase/auth.ts src/features/settings/account tests/unit/firebase/deleteAccount.test.ts
git commit -m "fix: make account deletion ordered and retryable"
```

### Task 4: Execute data-lifecycle release checks

**Files:**
- Create: `docs/release/data-lifecycle-manual-test.md`
- Modify: `package.json` only if focused backup/deletion tests must join the existing release command.

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: automated and manual evidence for export/import/deletion behavior.

- [ ] **Step 1: Write manual checklist**

Include export, inspect envelope does not include credentials, invalid import keeps existing data, valid import confirmation, interrupted import recovery, password-account deletion after re-authentication, Google-account deletion, and confirmation exported files remain outside app deletion.

- [ ] **Step 2: Add test command coverage**

```json
"test:verify": "node --test tests/i18n-integrity.test.cjs tests/widget-data.test.cjs && jest tests/unit/backup tests/unit/firebase/deleteAccount.test.ts --runInBand"
```

- [ ] **Step 3: Run the release-local suite**

Run: `npm run typecheck && npm run lint && npx jest tests/unit/backup tests/unit/firebase/deleteAccount.test.ts --runInBand`

Expected: PASS.

- [ ] **Step 4: Commit release evidence**

```bash
git add docs/release/data-lifecycle-manual-test.md package.json tests/unit/backup tests/unit/firebase/deleteAccount.test.ts
git commit -m "test: add data lifecycle release checks"
```
