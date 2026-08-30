# SubMate iOS Readiness Design

**Date:** 2026-08-30

**Status:** Awaiting final user review

## Goal

Prepare SubMate for reliable testing on iPhone and iPad without regressing the working Android application. The work covers platform isolation, iPad-aware layouts, Firebase and Google Sign-In configuration, Apple attestation, physical-device testing, and TestFlight readiness.

## Current State

- Expo Doctor passes all 21 project checks.
- The production JavaScript bundle exports successfully for iOS.
- The root layout uses `SafeAreaProvider`, the custom tab bar consumes device insets, and major input screens use keyboard avoidance.
- The repository does not contain an iOS native project. This is acceptable for an EAS-managed workflow, but no signed iOS binary has been compiled or installed yet.
- Firebase has no Apple configuration file in the repository and the Expo config has no `ios.googleServicesFile` value.
- The runtime environment has no `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
- The Android widget implementation is imported by shared code and uses `Platform.OS !== 'web'` in places where the supported platform is Android only.
- `ios.supportsTablet` is not enabled, so the current project does not intentionally target a native iPad layout.

## Scope and Order

### Phase 1: Isolate Android-only widget behavior

Keep `WidgetSyncBridge` as the shared subscription-change observer, but resolve its storage/native adapter by platform:

- Android keeps the existing widget rendering, update coordination, and background refresh behavior.
- iOS and web use a no-op adapter with the same exported interface.
- Android widget modules must never be imported into the iOS bundle.
- Android widget tests remain intact; new platform contract tests prove the iOS adapter does not call Android APIs.

This phase must not change subscription data, widget content, or Android update timing.

### Phase 2: Enable and harden iPad layouts

- Set `ios.supportsTablet` to `true`.
- Preserve portrait orientation for the first iOS beta unless device testing demonstrates a clear need for landscape.
- Use window width and safe-area insets rather than static screen dimensions for the dashboard, subscription list/form, analytics, calendar, settings, account modals, and AI chat.
- On compact widths, keep one-column flows and full-width actions.
- On regular iPad widths, cap readable content width and center it; analytics cards may use two columns only when both cards retain their minimum usable width.
- Inputs and bottom sheets must remain visible when the software keyboard is open.
- The custom tab bar must remain above the home indicator and respect left/right safe areas.

### Phase 3: Add Firebase and Google Sign-In for Apple platforms

User-owned console setup:

1. Register an Apple app in Firebase with bundle identifier `com.doganaslan.submate`.
2. Download `GoogleService-Info.plist`.
3. Confirm that the Google provider is enabled in Firebase Authentication.
4. Create or confirm the iOS OAuth client and obtain its client ID and reversed client ID.

Repository configuration:

- Add `ios.googleServicesFile` to Expo config.
- Configure the Google Sign-In plugin from the plist or explicit iOS URL scheme.
- Add `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` to the local/EAS environment without committing secrets.
- Keep the web client ID for Firebase ID-token exchange.
- Add configuration validation that gives a clear user-facing error when an iOS build is missing required identity values.

Acceptance requires successful Google sign-in, email/password sign-in, logout, and session restoration on a physical Apple device.

### Phase 4: Validate iOS-native behavior

Test on the available iPad Air M3 and at least one iPhone with Dynamic Island:

- initial launch, onboarding, login, registration, password reset;
- Face ID/Touch ID availability, enable/disable, background lock, cancellation, and automatic fallback when biometrics are unavailable;
- subscription create, edit, pause, delete, recurring calendar projection, and immediate analytics refresh;
- keyboard behavior for account email/password forms, subscription forms, and AI chat;
- local notification permission, scheduling, delivery, tap handling, badge/history behavior;
- dark/light mode, Turkish/English content, Dynamic Type, long labels, and safe areas;
- airplane mode, failed Firestore writes, relaunch, and session recovery.

Failures found here are fixed with focused regression tests before the next phase.

### Phase 5: Configure Apple App Check safely

- Register the Apple Firebase app for App Attest using the Apple Team ID.
- Use App Attest on supported physical devices and DeviceCheck only where necessary.
- Use the App Check debug provider for simulator/development environments; never commit debug tokens.
- Ship a build that sends App Check tokens while enforcement remains off.
- Monitor valid/invalid request metrics for Authentication, Firestore, Firebase AI Logic, and callable Functions.
- Enable enforcement service by service only after legitimate physical-device traffic is confirmed.

### Phase 6: EAS and TestFlight beta

- Add explicit iOS settings to the EAS development, preview, and production profiles where needed.
- Register physical test devices and create a signed development build.
- Produce an internal iOS build and complete the physical-device checklist.
- Create a production IPA and distribute it through TestFlight.
- Complete one regression pass on the final TestFlight binary before considering App Store submission.

## Architecture Boundaries

- Shared business logic remains in TypeScript and must behave identically on Android and iOS.
- Platform-specific native integrations use `.android.*` and `.ios.*` adapters behind stable interfaces.
- No iOS module imports Android widget code.
- Secrets and OAuth credentials remain in local or EAS-managed environment storage.
- Firebase security rules remain platform-neutral; App Check adds device/app attestation rather than replacing Firebase Authentication or ownership rules.

## Verification Gates

Every phase must pass:

1. targeted red/green regression tests;
2. `npm run typecheck`;
3. `npm run lint`;
4. relevant component and service tests;
5. `npx expo-doctor`;
6. Android regression verification for any shared-code change;
7. iOS export verification, followed by signed physical-device verification once credentials exist.

## User Responsibilities

- Provide access to an active Apple Developer Program membership when signed device builds begin.
- Register the Firebase Apple app and download its plist.
- Provide the iOS OAuth client ID/reversed client ID through secure local or EAS configuration.
- Keep the iPad/iPhone available for the physical-device checklist.

## Out of Scope

- New product features unrelated to iOS readiness.
- An iOS home-screen widget; the existing widget remains Android-only.
- App Store submission before TestFlight regression testing is complete.
- Enabling App Check enforcement before valid Apple-device traffic is observed.

## Completion Criteria

The iOS readiness project is complete when a TestFlight build can sign in through every supported authentication method, perform the complete subscription lifecycle, refresh analytics immediately, schedule and open notifications, lock and unlock safely with biometrics, render correctly on the target iPad and iPhone, and access protected Firebase services with valid App Check tokens.
