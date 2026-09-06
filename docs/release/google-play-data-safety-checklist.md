# SubMate — Google Play Data Safety Review Checklist

> This is an engineering review worksheet, not a submitted Google Play declaration. **Verify before submission** in the installed release build, Play Console's current questionnaire, and each provider's current documentation. Data processing can change when an SDK, configuration, feature, or release channel changes.

| Data category | Collected or processed | Purpose | Shared with | Optional | Retention owner | Source of truth | Verify before submission |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Account identifiers (email, Firebase UID, display name) | Yes, for signed-in accounts | Authentication, account access, profile | Firebase Authentication; Firestore where profile data is stored | Account use is optional; required after choosing account features | Firebase project / user account lifecycle | `src/services/firebase/*`, Privacy Policy | [ ] Confirm every sign-in method, account field, and deletion path |
| Subscription, renewal, category, payment-label and card-last-four data | Yes, when entered by the user | Subscription tracking, analytics, reminders, widgets, backup | Firestore for signed-in account data; device storage for local preferences/widget state | Optional; entered by user | Firebase project and device, until user deletes or clears data | Subscription/card services, backup module, Privacy Policy | [ ] Confirm exact fields and all storage locations |
| Payment credentials (full card PAN, CVV/CVC, bank password) | **Not collected** | Not applicable | Not applicable | Not applicable | Not applicable | Card form and Privacy Policy | [ ] Confirm no screen, log, backup, or SDK captures these values |
| Local notification permission and reminder schedule | Processed on device | Optional payment reminders | Device operating system only | Yes | Device operating system / app local storage | Notification service, Privacy Policy | [ ] Confirm there is no remote push token or remote notification provider in the release |
| Biometric authentication result | Processed on device | Optional app-lock verification | Device operating system only | Yes | Device operating system; SubMate stores only the enabled preference | Biometric service, Privacy Policy | [ ] Confirm no biometric template or image enters app storage/cloud |
| User-entered AI messages, relevant subscription summary, selected receipt image | Yes, only after user action | AI chat or receipt analysis | Google Gemini Developer API | Yes | Provider and app context under their applicable settings | AI services, Privacy Policy | [ ] Confirm request payload, provider, region/configuration, and disclosure |
| Diagnostic error details | Only when optional diagnostics are enabled and a DSN is configured | Stability diagnosis | Sentry | Yes | Sentry project retention settings | Monitoring service, Settings, Privacy Policy | [ ] Confirm diagnostics remain off by default and PII scrubbing is active |
| Exported backup file | Generated on device after user action | User-controlled portability/backup | User-selected storage or sharing destination | Yes | User-selected destination | Backup/export service, Privacy Policy | [ ] Confirm schema, encryption statement, and share-sheet behavior |
| Device/app technical connection data (IP, device/app identifiers, OS, app version, timestamps) | May be processed by service providers during requests | Service delivery, security, operations | Firebase, Google, Expo, Sentry if enabled, exchange-rate provider | Depends on selected feature/provider | Relevant provider | Privacy Policy, provider settings | [ ] Review each active SDK's current Data Safety declaration |

## Release review checklist

- [ ] Confirm Android package name: `com.doganaslan.submate`.
- [ ] Confirm every Firebase product and analytics/crash SDK enabled in the release build.
- [ ] Confirm whether analytics, advertising ID, remote notifications, or remote config are absent or present; update this table if present.
- [ ] Confirm exported files contain only documented fields and are not automatically uploaded.
- [ ] Confirm account deletion removes Firestore records covered by the documented deletion flow and surfaces a failure when deletion cannot finish.
- [ ] Confirm support email: `doganaslandevelopment@gmail.com`.
- [ ] Complete the Data Safety questionnaire in Play Console using the installed release build as evidence.
- [ ] Have a qualified privacy/legal reviewer assess local law and country-specific obligations before public release.
