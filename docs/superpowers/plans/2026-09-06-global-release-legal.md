# Global Release Legal and Store Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish truthful Turkish and English legal content and a Play Store listing packet that match SubMate's actual Firebase-backed data flows.

**Architecture:** `src/constants/legalPolicies.ts` remains the canonical in-app source for policy text. Release-facing copy is kept in a Markdown packet outside the app so it can be reviewed, submitted to Play Console, and published at a stable URL without duplicating runtime code.

**Tech Stack:** TypeScript, Expo Router, React Native, Markdown, Jest.

**Spec:** `docs/superpowers/specs/2026-09-06-global-release-readiness-design.md`

## Global Constraints

- Support Turkish and English only for new release-facing content.
- State that Firebase Authentication and Firestore process signed-in user data; never claim device-only storage.
- Do not claim legal compliance, PCI-DSS certification, financial-advice licensing, or a data-retention period that has not been verified.
- Support contact is `doganaslandevelopment@gmail.com`.
- Do not create a public website or submit an app in this plan.

---

### Task 1: Make in-app legal text truthful and versioned

**Files:**
- Modify: `src/constants/legalPolicies.ts`
- Modify: `src/app/(tabs)/settings/privacy.tsx`
- Modify: `src/app/(tabs)/settings/terms.tsx`
- Create: `tests/unit/legal/legalPolicies.test.ts`

**Interfaces:**
- Consumes: `privacyPolicies` and `termsPolicies` exported from `legalPolicies.ts`.
- Produces: Turkish and English policy documents with a shared visible `Last updated / Son güncelleme` date and a stable section order.

- [ ] **Step 1: Write failing legal-content tests**

```ts
import { privacyPolicies, termsPolicies } from '@/constants/legalPolicies';

describe('release legal policies', () => {
  it.each(['tr', 'en'])('discloses Firebase, local notifications, exports, and support in %s', language => {
    const text = privacyPolicies[language];
    expect(text).toMatch(/Firebase/i);
    expect(text).toMatch(/notification|bildirim/i);
    expect(text).toMatch(/export|dışa aktar/i);
    expect(text).toContain('doganaslandevelopment@gmail.com');
  });

  it.each(['tr', 'en'])('contains a non-empty terms document in %s', language => {
    expect(termsPolicies[language]).toMatch(/last updated|son güncelleme/i);
  });
});
```

- [ ] **Step 2: Run the test to prove the current policy contract is incomplete**

Run: `npx jest tests/unit/legal/legalPolicies.test.ts --runInBand`

Expected: FAIL because the legacy policy content does not consistently disclose the real cloud/storage model and version data.

- [ ] **Step 3: Replace only the Turkish and English policy bodies with reviewed disclosure content**

```ts
export const privacyPolicies: Record<'tr' | 'en', string> = {
  tr: `# Gizlilik Politikası\n\n**Son güncelleme:** 6 Eylül 2026\n...`,
  en: `# Privacy Policy\n\n**Last updated:** September 6, 2026\n...`,
};
```

Include the exact processing categories in the approved spec: Firebase Authentication, Firestore user content, local reminders, exports/backups, biometric OS result only, optional Sentry diagnostics, user-initiated AI requests, deletion/export rights, support contact, and no financial-advice guarantee. Remove claims that all data remains exclusively on the device.

- [ ] **Step 4: Limit legal screen language buttons to the canonical release languages**

```ts
const languages = ['tr', 'en'] as const;
const activeLang = languages.includes(currentLanguage as 'tr' | 'en')
  ? currentLanguage as 'tr' | 'en'
  : 'en';
```

Keep the current language switcher and `SafeMarkdownText`; do not make the policy route dependent on unfinished translations.

- [ ] **Step 5: Run focused tests and typecheck**

Run: `npx jest tests/unit/legal/legalPolicies.test.ts --runInBand && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit the legal-content task**

```bash
git add src/constants/legalPolicies.ts src/app/(tabs)/settings/privacy.tsx src/app/(tabs)/settings/terms.tsx tests/unit/legal/legalPolicies.test.ts
git commit -m "docs: align legal policies with data practices"
```

### Task 2: Create the bilingual store submission packet

**Files:**
- Create: `docs/release/google-play-listing-tr-en.md`
- Create: `docs/release/google-play-data-safety-checklist.md`
- Create: `tests/unit/legal/releasePacket.test.ts`

**Interfaces:**
- Consumes: data categories approved in Task 1 and `app.json` application identifiers.
- Produces: human-reviewed content ready to paste into Google Play Console, without pretending the checklist is a submitted declaration.

- [ ] **Step 1: Write a failing packet-content test**

```ts
import { readFileSync } from 'node:fs';

const listing = readFileSync('docs/release/google-play-listing-tr-en.md', 'utf8');
const checklist = readFileSync('docs/release/google-play-data-safety-checklist.md', 'utf8');

it('ships Turkish and English listing copy plus review prompts', () => {
  expect(listing).toMatch(/## Türkçe/);
  expect(listing).toMatch(/## English/);
  expect(checklist).toMatch(/Verify before submission/i);
});
```

- [ ] **Step 2: Run the packet test to verify files are absent**

Run: `npx jest tests/unit/legal/releasePacket.test.ts --runInBand`

Expected: FAIL with `ENOENT`.

- [ ] **Step 3: Write the release listing packet**

Include exact character-counted short descriptions, long descriptions, five screenshot captions per language, support email, feature graphic copy, and review notes. Use plain-language claims such as “Track recurring subscriptions” and “Get local payment reminders”; do not say “guaranteed savings,” “bank-level security,” or “AI financial advice.”

- [ ] **Step 4: Write the Data Safety review checklist**

Use a table containing: category, whether the app collects/processes it, purpose, sharing status, optionality, retention owner, source file, and a “Verify before submission” column. Include Firebase Auth, Firestore, Sentry only when DSN is enabled, AI provider only on user action, local notifications, exported files, and a distinct “not collected” row for card PAN/CVV and payment credentials.

- [ ] **Step 5: Run focused test and inspect app identity**

Run: `npx jest tests/unit/legal/releasePacket.test.ts --runInBand && npx expo config --type public`

Expected: PASS and configuration identifies `com.doganaslan.submate`.

- [ ] **Step 6: Commit the store packet task**

```bash
git add docs/release tests/unit/legal/releasePacket.test.ts
git commit -m "docs: add bilingual Play release packet"
```

### Task 3: Run legal and localization release checks

**Files:**
- Modify: `scripts/verify-all.js` only if no existing command can include the new legal tests.
- Modify: `docs/release/google-play-data-safety-checklist.md` if the check exposes a mismatch.

**Interfaces:**
- Consumes: Tasks 1–2 outputs.
- Produces: documented proof that visible policy and release packet agree.

- [ ] **Step 1: Add a failing invariant if release legal tests are not in the normal verification command**

```js
assertCommandIncludes('test:verify', 'legalPolicies.test.ts');
```

- [ ] **Step 2: Run the invariant**

Run: `node scripts/verify-all.js`

Expected: FAIL only if the legal test is omitted from the standard suite.

- [ ] **Step 3: Add the exact Jest file to the existing release-safe verification command**

```json
"test:verify": "node --test tests/i18n-integrity.test.cjs tests/widget-data.test.cjs && jest tests/unit/legal/legalPolicies.test.ts tests/unit/legal/releasePacket.test.ts --runInBand"
```

- [ ] **Step 4: Run validation**

Run: `npm run test:verify && npm run lint && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the release-gate task**

```bash
git add package.json scripts/verify-all.js docs/release tests/unit/legal
git commit -m "test: verify global release legal content"
```
