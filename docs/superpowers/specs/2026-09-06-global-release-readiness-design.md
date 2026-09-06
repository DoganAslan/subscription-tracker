# Global Release Readiness Design

**Status:** Approved design pending implementation-plan review  
**Date:** 2026-09-06  
**Platforms:** Android now; iOS implementation compatibility retained for the later Apple Developer phase  
**Primary release languages:** Turkish and English

## Goal

Make SubMate ready for a global closed beta and Play Store submission by aligning public disclosure with actual data flows, enabling privacy-preserving error monitoring, making local payment reminders dependable, and making data export/import and account deletion predictable and verifiable.

## Decisions

- Use the existing `@sentry/react-native` integration as the only crash/error-monitoring product. Do not add Firebase Crashlytics or a second analytics SDK.
- Keep reminders local to the device. The scope does not introduce server-originated push notifications, Expo push-token storage, or Firebase Cloud Functions.
- Support Turkish and English in all new release-facing and user-facing copy. Other existing app locales are not expanded or rewritten in this scope.
- Treat Firebase Authentication and Firestore as cloud processing. Do not describe SubMate as a device-only or no-data-collection product.
- Make no legal guarantee beyond documenting actual product behaviour. Final store declarations remain the publisher's responsibility.

## Current-State Findings

- The project already uses Firebase Authentication and Firestore, therefore account identifiers and the user-managed subscription/card/wallet data are processed and stored in Firebase for signed-in users.
- `src/services/monitoring/sentry.ts` and the root layout already contain a Sentry integration, while the release configuration and user privacy controls need a single, explicit contract.
- More than one notification service exists. Scheduling and permission behaviour must have exactly one public owner to prevent duplicate notification IDs, contradictory permission prompts, and inconsistent history.
- JSON backup/export, import, account deletion and re-authentication flows already exist but need common validation, failure semantics, and tests before public release.
- Legacy policy JSON files contain claims that conflict with the Firebase-backed architecture. The active legal policy source and all surfaces linking to it must be reconciled.

## 1. Store Package and Legal Disclosure

### Deliverables

- A versioned Markdown release packet containing Turkish and English:
  - Play Store short description and long description;
  - feature bullets and screenshot captions;
  - support contact (`doganaslandevelopment@gmail.com`);
  - privacy-policy and terms URLs/placeholders with publication instructions;
  - Play Data Safety worksheet based on observed code and configured third parties.
- Revised in-app Privacy Policy and Terms of Use in Turkish and English.
- An explicit `last updated` date and policy version in the app content.

### Required disclosure scope

The policy must accurately cover:

| Area | Disclosure requirement |
| --- | --- |
| Firebase Authentication | Account email, authentication identifier, provider metadata and security logs required for sign-in/account operation. |
| Cloud data | Subscription, wallet/card label, budget and preference information that the signed-in user saves to Firestore. The policy must not imply that a real card PAN, CVV, bank credential or payment transaction is collected. |
| Notifications | Local notification permission and locally scheduled reminder content; no remote marketing push in this release. |
| Backup/export | User-initiated JSON files are created or selected on the user device and can include financial labels/amounts. The user controls where the file is shared or stored. |
| Biometric lock | Authentication is performed by the operating system; SubMate receives only success/failure and never receives biometric templates. |
| Sentry | Pseudonymous technical crash data and limited device/app diagnostics only after production monitoring is configured; no message body, financial value, card label, email or backup content. |
| AI | The actual configured AI provider, prompts/data sent when the user actively asks an AI question, retention/processing uncertainty, and financial-advice limitation. |
| Rights/contact | Access, correction, deletion, export, account deletion limitations and support contact. |

### Non-goals

- This scope does not publish a public privacy-policy website. It produces reviewed content and a deployment checklist; a stable public URL is required before store submission.
- It does not add advertising, behavioural analytics, payment processing, or marketing consent flows.

## 2. Privacy-Preserving Error Monitoring

### Configuration contract

- Sentry initializes only when `EXPO_PUBLIC_SENTRY_DSN` is non-empty and the build is not a development/test environment.
- `sendDefaultPii` remains `false`.
- Production error sampling is conservative; performance tracing is disabled unless separately approved.
- A `beforeSend` scrubber removes exception extras, request bodies, breadcrumbs with arbitrary message text, route parameters containing user values, and values matching email, card-like, token, API-key or currency-amount patterns.
- Monitoring tags may contain app version, release channel, OS family and an opaque installation/session identifier. They may not contain Firebase UID, email, subscription name, price, category, wallet/card label, AI text or JSON data.

### User control and lifecycle

- Settings exposes a single diagnostics switch, defaulted off where required by the user’s chosen release/privacy posture. If enabled, the preference is stored locally and takes effect on next app initialization.
- Sign-out and account deletion clear Sentry user/context state before local data is cleared.
- The error boundary captures only sanitised error metadata. User-visible error messages stay localized and never reveal raw provider errors.

### Failure behaviour

- Missing DSN, unavailable network, rejected events or Sentry initialization failure must never block sign-in, subscription saving or the UI.
- Monitoring failures are logged only in development and are not recursively reported.

## 3. Local Notification Reliability

### Single service boundary

- `src/services/notificationService.ts` becomes the single public scheduler/history API.
- Legacy duplicate notification wrappers are either removed or reduced to private compatibility adapters during the migration; no screen may independently schedule a reminder.
- Every reminder has a deterministic identifier derived from subscription ID and reminder type.

### Permission and scheduling rules

- Request permission only after the user turns on reminders, presses an explicit test/reminder action, or saves an item with reminders enabled.
- Create/configure the Android notification channel before scheduling any notification.
- On Android and iOS, use date-based reminders where supported. If the OS rejects the date trigger, use a clearly logged time-interval fallback without duplicating an existing reminder.
- Reschedule after create, update, pause, resume, delete, import, language change and app-start reconciliation.
- Cancel only that subscription’s deterministic notification IDs on delete; never globally cancel unrelated reminders as a side effect of one subscription change.
- Local notification history remains on-device, has a bounded length, supports read/clear, and ignores malformed persisted entries.

### User-facing states

- Provide localized status copy for granted, denied, unavailable and scheduler-failed states.
- Do not promise a delivery time that iOS/Android battery optimisation cannot guarantee.

## 4. Data, Backup and Account Lifecycle

### Backup/export

- Define a single versioned JSON envelope: `schemaVersion`, `createdAt`, `appVersion`, `subscriptions`, `wallets`, `settings`.
- Export only fields required to reconstruct supported app state; never export authentication tokens, Sentry identifiers, API keys or runtime caches.
- Validate imports before writing any data: maximum file size, JSON parse, schema version, record types, strings, dates, amounts, allowed category/card enums and duplicate IDs.
- Reject invalid or future-incompatible files with localized recovery instructions and without partially overwriting existing data.
- Make import replacement/merge behaviour explicit in the UI and require confirmation for destructive replacement.

### Account deletion

- Require re-authentication when the provider supports it; show a provider-appropriate recovery path when recent login is required.
- Delete user-owned Firestore collections/documents first, then delete the Authentication user, then clear secure/local app state and monitoring context, then navigate to signed-out state.
- Stop at the failed step and show a localized, actionable result. Never show a success message unless Auth deletion succeeded.
- Account deletion must not silently delete an offline backup file that the user exported themselves; the UI explains this.

### Data consistency limit

Client-only deletion cannot be fully atomic across Firestore and Firebase Authentication. The flow therefore records no false success and is designed to be safely retried after re-authentication. A server-side privileged deletion function is out of scope because the current Firebase plan intentionally avoids Cloud Functions/Blaze.

## 5. Validation and Release Gate

### Automated checks

- Unit tests for Sentry initialization/scrubbing and disabled-operation paths.
- Unit tests for notification permission gating, deterministic rescheduling and cancellation.
- Unit tests for export envelope creation and import validation/rejection before mutation.
- Unit tests for account deletion ordering and all failure branches.
- Turkish/English i18n integrity checks for new strings.
- Existing typecheck, lint, unit/component/security/rules suites and Android Expo export check.

### Manual release checks

- Android physical-device checklist: first-run notification permission, reminder create/update/delete/pause/resume, language change, backup export/import, sign-out, delete account and re-login prevention.
- Verify an induced non-sensitive test exception is captured only in a configured non-production Sentry project before enabling production DSN.
- Review the final Play Data Safety form against the final production configuration, not against development configuration.
- Build an Android App Bundle (`.aab`) only after the release gate passes and the Play Console listing/privacy URL are ready.

## Acceptance Criteria

- Store copy, Privacy Policy and Terms are available in Turkish and English and do not claim that Firebase-backed data is device-only.
- Monitoring is disabled safely without DSN, defaults to privacy-minimising settings, and demonstrably scrubs prohibited values.
- No duplicate notification services schedule the same reminder; subscription lifecycle changes leave correct scheduled reminders.
- Import rejects malformed/incompatible data without mutating user state; export contains a versioned, documented envelope.
- Deletion requires recent authentication where applicable, does not report success early, and leaves the app signed out only after Authentication deletion succeeds.
- All defined automated checks pass and manual Android release checks have documented evidence.

## Out of Scope / Later Work

- Public website hosting for legal documents.
- Remote push campaign infrastructure, Cloud Functions, user-engagement analytics or ads.
- iOS signing, APNs credentials, App Attest/App Check iOS enforcement and TestFlight distribution; these await an Apple Developer account.
- Store submission, review response and paid Play Console/Apple account actions.
