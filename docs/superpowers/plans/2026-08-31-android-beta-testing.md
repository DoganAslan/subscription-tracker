# Android Beta Test Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate the installed SubMate Android 1.5.1 (versionCode 6) build across authentication, subscription management, recurring payments, AI, widgets, settings, and mobile layout before wider beta distribution.

**Architecture:** Test the existing APK on the connected Android device in risk order. Start with blocking flows (launch/auth/data persistence), then verify calculations and integrations, and finish with visual/accessibility and regression checks. Every failure is recorded with reproducible steps, expected/actual result, device details, and evidence.

**Tech Stack:** Expo/EAS Android APK, Firebase Authentication, Firestore, Firebase App Check/Play Integrity, Gemini AI, Android home-screen widget.

**Spec:** Existing project QA requirements and the Android/iOS foundation checklist in `docs/testing/ios-foundation-checklist.md`.

## Global Constraints

- Test APK: `C:\Users\dogan\Desktop\SubMate\SubMate-1.5.1-wave3-beta.apk`.
- Expected package: `com.doganaslan.submate`.
- Expected installed version: `1.5.1` / versionCode `6`.
- Do not use production financial data; use a dedicated test account.
- Do not build another APK during this pass unless a blocking defect requires a fix build.
- Record currency, locale, Android version, screen size, and network state for each defect.

## Test Data

Create or use a dedicated account with these records:

- Monthly subscriptions: Netflix (TRY), Spotify (TRY), ChatGPT Plus (USD), YouTube Premium (TRY).
- At least one annual subscription and one trial subscription.
- At least two payment cards; link subscriptions to different cards and set one card limit.
- One subscription with a payment date near today and one on the 28th–31st to exercise month-end rollover.
- One edited subscription whose price changes, plus one newly added subscription for widget refresh testing.

### Task 1: Install and baseline verification

**Files:**
- Test: connected device and `SubMate-1.5.1-wave3-beta.apk`

- [ ] **Step 1: Confirm the installed package and version**

Run:

```powershell
$adb = 'C:\Users\dogan\AppData\Local\Android\Sdk\platform-tools\adb.exe'
& $adb shell dumpsys package com.doganaslan.submate | Select-String 'versionName|versionCode'
```

Expected: `versionName=1.5.1` and `versionCode=6`.

- [ ] **Step 2: Cold-launch the app**

Force-stop, launch, and confirm the first screen appears without a red error overlay or crash:

```powershell
& $adb shell am force-stop com.doganaslan.submate
& $adb shell monkey -p com.doganaslan.submate 1
```

- [ ] **Step 3: Record baseline device details**

Record Android version, device model, display resolution, dark/light mode, locale, and Wi-Fi/mobile network.

### Task 2: Authentication and consent

**Files:**
- Test: login, sign-up, password reset, Google OAuth, legal consent

- [ ] **Step 1: Verify legal consent gating**

On the login screen, leave Privacy Policy/Terms unchecked and confirm login remains disabled. Open each document, return, check consent, and confirm the button becomes available.

- [ ] **Step 2: Test email/password login**

Log in with the dedicated account, force-stop, relaunch, and confirm the session persists without exposing sensitive data in UI or logs.

- [ ] **Step 3: Test Google sign-in**

Sign out, select Google sign-in, complete the account chooser, and confirm the app returns authenticated. Repeat once after clearing the browser session. Record the full OAuth error text if redirected to an invalid-request or authorization-error page.

- [ ] **Step 4: Test password recovery**

Request a reset email, follow the link, set a new password, and log in with it. Confirm an invalid/expired link produces a readable localized message.

### Task 3: Subscription and payment data integrity

**Files:**
- Test: add/edit/delete subscription, cards, recurring dates, Firestore persistence

- [ ] **Step 1: Add a subscription with all basic fields**

Save a monthly subscription with currency, category, renewal date, card, and optional trial flag. Confirm one success notification and one list entry.

- [ ] **Step 2: Verify validation and keyboard behavior**

Leave required fields empty, enter a decimal amount, switch between fields, and dismiss/reopen the keyboard. Confirm fields remain visible and validation text is localized and understandable.

- [ ] **Step 3: Edit price, date, card, and category**

Save each change separately. Confirm list, home totals, analysis totals, calendar entries, and card associations update after each save.

- [ ] **Step 4: Verify recurring month rollover**

Use a date on the 28th–31st, navigate to the next month, and confirm the renewal appears there with the correct clamped day when the month is shorter.

- [ ] **Step 5: Delete a subscription**

Confirm the dialog has no raw translation key, explains that deletion does not cancel the real service, and removes the record from list, totals, calendar, analysis, and widget data after confirmation.

- [ ] **Step 6: Verify cards and limits**

Add two cards, link subscriptions, edit a card limit, and confirm linked card labels and limit usage update without stale values.

### Task 4: AI advisor and localization

**Files:**
- Test: AI advisor/chat and language switching

- [ ] **Step 1: Ask a Turkish, data-specific question**

Ask which of two test subscriptions is more economical. Expected: the answer addresses the actual question, references only current test data, and includes a concise informational disclaimer.

- [ ] **Step 2: Ask an English question**

Confirm English input receives an understandable English answer when English is selected, without Turkish/English key leakage.

- [ ] **Step 3: Simulate offline/unavailable AI**

Disable network, send a message, and confirm a friendly localized fallback instead of a generic or misleading answer. Restore network and retry.

- [ ] **Step 4: Scan visible screens for translation keys**

Check login, settings, account settings, subscription form, delete dialog, calendar, widget preview, and biometric lock. No strings such as `global.biometricPrompt`, `features.justDeleteFromApp`, or raw key names may be visible.

### Task 5: Widget and notifications

**Files:**
- Test: Android home-screen widget and notification history

- [ ] **Step 1: Add the widget at supported sizes**

Add the 2x2 and larger widget sizes. Confirm the border is continuous on all four sides, content is not clipped, and the right edge has the same inset as the left.

- [ ] **Step 2: Verify live data refresh**

Record the widget total and next payment. Add a subscription, edit a price, and delete a subscription in the app. Return to the home screen and confirm the widget reflects each change without reinstalling.

- [ ] **Step 3: Verify background refresh**

Restart the device and wait for the widget refresh interval. Confirm the latest Firestore-backed values remain visible and the widget does not show stale placeholder data.

- [ ] **Step 4: Verify notification history**

Tap the top-right bell, confirm it opens notification history rather than Settings, and verify empty, unread, read, and clear-history states.

### Task 6: Biometrics, settings, and responsive layout

**Files:**
- Test: biometric lock, account settings, keyboard/modal layout, portrait/landscape

- [ ] **Step 1: Test biometric lock states**

Enable the lock, background and relaunch the app, authenticate successfully, cancel once, and test a device without enrolled biometrics if available. Confirm automatic approval/fallback behavior matches the device capability and no raw translation keys appear.

- [ ] **Step 2: Test account settings forms**

Open change-password and change-email dialogs. With the keyboard open, confirm every field, cancel button, and save button remain reachable; use `Next`/`Done` actions. Verify password change succeeds and email change either completes verification or gives a clear Firebase reauthentication/verification message.

- [ ] **Step 3: Test safe areas and rotations**

Rotate portrait/landscape on login, home, subscription form, analysis, settings, AI chat, and modal dialogs. Confirm no buttons, checkmarks, cards, or bottom navigation are clipped or hidden behind system bars.

- [ ] **Step 4: Test long text and narrow width**

Use the smallest available display/font scaling 1.0–1.3. Confirm cards wrap cleanly, equal-height grid items do not leave unusable side gaps, and horizontal content is not accidentally clipped.

### Task 7: Defect triage and exit criteria

**Files:**
- Create: `docs/testing/android-beta-results-2026-08-31.md`

- [ ] **Step 1: Record every failure**

Use this format for each defect:

```text
ID:
Severity: blocker | critical | major | minor
Device / Android:
App version:
Network / locale:
Preconditions:
Steps to reproduce:
Expected:
Actual:
Evidence: screenshot, screen recording, or logcat excerpt
```

- [ ] **Step 2: Collect crash evidence for native failures**

Run immediately after reproducing a crash:

```powershell
& $adb logcat -d -t 300 | Select-String 'AndroidRuntime|FATAL EXCEPTION|com.doganaslan.submate|FirebaseAuth|Firestore'
```

- [ ] **Step 3: Apply exit criteria**

The Android beta pass is accepted when all blocker/critical defects are resolved, authentication and subscription CRUD pass twice, widget values refresh after add/edit/delete, no raw translation keys are visible, and no tested screen clips content at the supported device sizes.
