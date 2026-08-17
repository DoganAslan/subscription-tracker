# 📱 SubMate - Comprehensive Project Handover & Architecture Document

> **Target Audience:** AI Assistants, Senior Mobile Engineers, and Development Teams taking over the SubMate codebase.  
> **Document Purpose:** Complete technical architecture, feature mechanics, codebase map, state flows, build instructions, and guidelines for zero-friction project continuation.

---

## 📌 Table of Contents
1. [Executive Summary & Product Vision](#1-executive-summary--product-vision)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Project Directory & File Map](#3-project-directory--file-map)
4. [Complete Feature Inventory & Implementation Details](#4-complete-feature-inventory--implementation-details)
5. [State Management & Data Flow](#5-state-management--data-flow)
6. [Notification & Background Task Engine](#6-notification--background-task-engine)
7. [Design System & Liquid Glass UI](#7-design-system--liquid-glass-ui)
8. [Internationalization & Dynamic Translation Engine](#8-internationalization--dynamic-translation-engine)
9. [Security, Sanitization & Firestore Rules](#9-security-sanitization--firestore-rules)
10. [Hardware Cutouts & Safe Area Handling](#10-hardware-cutouts--safe-area-handling)
11. [Build, Release & Deployment Pipelines](#11-build-release--deployment-pipelines)
12. [Testing & Verification Suites](#12-testing--verification-suites)
13. [Rules & Guidelines for Future AI / Developers](#13-rules--guidelines-for-future-ai--developers)

---

## 1. Executive Summary & Product Vision

**SubMate** is a next-generation, AI-driven subscription and recurring financial expense tracking mobile application built with React Native and Expo (SDK 56). 

### Core Capabilities:
- **Intelligent Tracking**: Automated renewal calculations, leap-year-safe date math, cross-currency normalization, and price hike detection.
- **Smart Notifications**: Offline deterministic notifications (`sub_remind_{id}`) scheduled 2 days prior to billing at 09:00, plus taahhüt (contract doom) alerts 7 days prior.
- **FinTech AI Hub**: Free Trial & Virtual Card Shield, FX / Inflation Surge Predictor, Annual SubMate Wrapped, Family Vault with direct WhatsApp payment reminders, and Gamification XP Badges.
- **Ultra-Modern UX**: Frosted Liquid Glass floating tab bar with live drag/slide gestures, dynamic Safe Area handling (iOS Dynamic Island & Android Punch-Hole Camera), and slide-in glass Profile Drawer.

---

## 2. Tech Stack & Dependencies

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Expo (Bare Workflow) | `~56.0.17` | Native runtime & module ecosystem |
| **Core** | React Native / React | `0.85.3` / `19.2.3` | Mobile UI framework |
| **Language** | TypeScript | `~6.0.3` | Strict type safety |
| **Routing** | Expo Router | `~56.2.16` | File-based typed navigation |
| **Backend / DB** | Firebase / Firestore | `^12.14.0` | Cloud database & Auth |
| **State (Server)**| TanStack React Query | `^5.101.0` | Server caching, mutations, optimistic updates |
| **State (Client)**| Zustand | `^5.0.14` | Global client stores (Auth, Currency, Profile) |
| **Animation** | React Native Reanimated | `4.3.1` | Hardware-accelerated UI animations |
| **Gestures** | React Native Gesture Handler | `~2.31.1` | Swipe actions, drag tabs, touch tracking |
| **Safe Area** | React Native Safe Area Context | `~5.7.0` | Inset measurements for notches & Dynamic Island |
| **Styling** | NativeWind / Vanilla StyleSheet | `^4.2.5` | Dynamic themes & Liquid Glass styling |
| **Biometrics** | Expo Local Authentication | `~56.0.5` | FaceID / Fingerprint biometric vault lock |
| **Notifications** | Expo Notifications | `~56.0.22` | Local push notification scheduler |
| **Haptics** | Expo Haptics | `~56.0.3` | Micro-interaction tactile feedback |

---

## 3. Project Directory & File Map

```
subscription-tracker/
├── android/                         # Android native project & Gradle build files
├── assets/                          # App icons, splash screens, brand logos
├── scripts/
│   ├── verify-all.js                # Core simulation & logic verification test suite (20 tests)
│   └── verify-notifications.js      # Notification date math & flow test suite (35 tests)
├── src/
│   ├── app/                         # Expo Router screen pages
│   │   ├── _layout.tsx              # Root layout (SafeAreaProvider, Auth, Privacy Shield, Toast)
│   │   ├── index.tsx                # Initial entry / splash redirector
│   │   ├── onboarding.tsx           # Multi-step interactive onboarding
│   │   └── (tabs)/                  # Main Tab Navigation
│   │       ├── _layout.tsx          # LiquidGlassTabBar & Tab definitions
│   │       ├── index.tsx            # Dashboard (Hero Card, Quick Actions, Category Donut, Sub list)
│   │       ├── subscriptions/       # Subscriptions List, Details [id].tsx, Add/Edit sub.tsx
│   │       ├── analytics/           # Deep spending analytics, charts, Wrapped trigger
│   │       ├── ai/                  # AI Financial Hub (Trial Shield, Inflation Predictor)
│   │       ├── calendar/            # Interactive monthly payment calendar
│   │       ├── wallet/              # Virtual & Physical Card management
│   │       └── settings/            # Currency, Language, Theme, Biometrics, Export/Import
│   ├── components/
│   │   ├── ui/                      # Base atoms (Button.tsx, Input.tsx, CategoryBadge.tsx)
│   │   ├── common/                  # ProtectedRoute.tsx, AppLockGuard.tsx, ToastConfig.tsx
│   │   ├── CardWidget.tsx           # Wallet credit card visual widget
│   │   ├── FloatingActionButton.tsx # Dynamic bottom-offset '+' action button
│   │   ├── ProfileDrawerModal.tsx   # Slide-in glass profile drawer & fast switches
│   │   └── SpringButton.tsx         # Bouncy spring physics touchable button
│   ├── context/
│   │   ├── LanguageContext.tsx      # Language provider (TR/EN) with AsyncStorage sync
│   │   └── ThemeContext.tsx         # Dark/Light theme provider with dynamic colors
│   ├── features/
│   │   ├── ai/                      # AI Trial Shield & Inflation Predictor cards
│   │   ├── analytics/               # Donut charts, bar charts, SubmateWrappedModal.tsx
│   │   ├── cards/                   # Virtual/physical cards hooks & components
│   │   ├── dashboard/               # CategoryBreakdownCard, QuickActionsEditorModal
│   │   ├── family/                  # FamilySpaceModal, SharedVaultCard
│   │   ├── gamification/            # FinancialBadgesModal, BadgesWidget, XP engine
│   │   ├── subscriptions/           # SubscriptionForm, SubscriptionCard, useSubscriptions
│   │   └── widgets/                 # HomeScreenWidgetPreviewCard (2x2, 4x2, 4x4)
│   ├── locales/
│   │   ├── i18n.ts                  # Localization dictionary
│   │   └── translations/            # tr.json & en.json
│   ├── services/
│   │   ├── ai/                      # AI heuristics (aiTrialShield.ts, aiInflationPredictor.ts)
│   │   ├── firebase/                # Firebase initialization & strict type definitions
│   │   └── notificationService.ts   # Deterministic local notification scheduler
│   ├── store/
│   │   ├── useAuthStore.ts          # Auth state (User, tokens)
│   │   ├── useCurrencyStore.ts      # Base currency & cached exchange rates
│   │   ├── useProfileStore.ts       # User avatar & display name persistence
│   │   └── useBudgetStore.ts        # Monthly spending limits & alerts
│   └── utils/
│       ├── calculations.ts          # Monthly cost multipliers (weekly, monthly, yearly, etc.)
│       ├── categoryMeta.ts          # Dynamic Category & Billing Cycle Translation Engine
│       ├── currency.ts              # Live exchange rates & dynamic cross-currency conversion
│       ├── haptics.ts               # Platform-safe haptic vibration helper
│       ├── heroTheme.ts             # Hero card customizable gradient presets
│       ├── reportExporter.ts        # CSV spending report exporter
│       ├── sanitizers.ts            # XSS & price input sanitization
│       ├── security.ts              # Production log neutralizer & security hardening
│       ├── vault.ts                 # Encrypted JSON vault backup export & import
│       └── whatsapp.ts              # WhatsApp reminder deep link generator
├── firestore.rules                  # Strict user-isolated Firestore security rules
├── package.json                     # Project manifest & dependency versions
└── tsconfig.json                    # TypeScript paths & build configuration
```

---

## 4. Complete Feature Inventory & Implementation Details

### 1. Liquid Glass Floating Capsule Tab Bar (`src/app/(tabs)/_layout.tsx`)
- **Visuals**: Frosted glass pill (`height: 58px`, `borderRadius: 28px`), floating above the bottom edge.
- **Drag Gesture**: Integrated `PanResponder` tracking touch coordinates across tabs in real-time. Sliding a finger over another tab previews the selection indicator pill with active haptics.
- **Hardware Safe Bottom**: Automatically computes `bottom: Math.max(insets.bottom + 6, 16)` to never collide with the iOS Home Indicator or Android Gesture Navigation Bar.

### 2. Intelligent Subscription Management (`src/features/subscriptions/`)
- **Swipe Actions**: Swipe right-to-left on any card in `SubscriptionList` to trigger a destructive delete action with confirmation modal.
- **Cycle Math**: `calculateMonthlyCosts` converts any frequency (`daily: 30x`, `weekly: 4.33x`, `biweekly: 2.16x`, `monthly: 1x`, `quarterly: /3`, `yearly: /12`) into accurate monthly budget figures.
- **Price Hike Detection**: Tracks `priceHistory: PriceHistoryEntry[]`. If current amount exceeds the previous historical price, an amber alert badge displays the exact percentage increase (e.g. `+25%`).

### 3. Dynamic Category & Cycle Translation Engine (`src/utils/categoryMeta.ts`)
- Solves the legacy bug where subscriptions saved in one language (e.g., `"Entertainment"`, `"monthly"`) stayed in that language when changing app language.
- `getCategoryLabel(cat, isTurkish)`: Normalizes any category string into the active language (`"Eğlence"` in TR vs `"Entertainment"` in EN).
- `getBillingCycleLabel(cycle, isTurkish)`: Normalizes any cycle string (`"Aylık"` vs `"Monthly"`, `"Yıllık"` vs `"Yearly"`).
- `CategoryBadge.tsx` and `SubscriptionCard.tsx` react to language changes in real-time.

### 4. Side Profile Drawer & Fast Controls (`src/components/ProfileDrawerModal.tsx`)
- Tapping the top-left avatar on the Dashboard smoothly slides in a glassmorphic Profile Drawer.
- Contains 1-tap fast switches: **Dark/Light Theme Toggle**, **TR/EN Language Switch**, **SubMate Wrapped**, **Badges/XP**, **Shared Family Vault**, **JSON Vault Backup Export**, and **CSV Spending Report Export**.

### 5. Six AI & FinTech Super Features
1. **Free Trial & Virtual Card Shield** (`AiTrialShieldCard.tsx`): Scans subscriptions with `isTrial: true`. Flags trials expiring in < 24h as Critical (`urgent_24h`) and alerts user to link a virtual card or cancel before being billed.
2. **SubMate Annual Wrapped** (`SubmateWrappedModal.tsx`): 5-slide interactive annual financial recap (total spent, top category, biggest single subscription, and estimated savings potential).
3. **Shared Vault & WhatsApp Reminders** (`SharedVaultCard.tsx` & `whatsapp.ts`): Splits shared subscription costs among members and provides a 1-tap WhatsApp deep link with pre-formatted reminder text and bank transfer details.
4. **Inflation & FX Surge Predictor** (`AiInflationPredictorCard.tsx`): Analyzes foreign currency subscriptions against FX volatility and projects likely price surges (+25%).
5. **Gamification Badges & XP Engine** (`FinancialBadgesModal.tsx` & `BadgesWidget.tsx`): Rewards users with XP and 8 financial achievements (e.g., *Smart Saver*, *Trial Hunter*, *Vault Master*, *Multi-Currency Pro*).
6. **Live Home Screen Widget Preview** (`HomeScreenWidgetPreviewCard.tsx`): Interactive preview of Android & iOS widgets across 3 standard sizes (`2x2`, `4x2`, `4x4`).

---

## 5. State Management & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                       React Query                           │
│  - useSubscriptions: queries & mutations with cache sync    │
│  - useCards: virtual and physical card sync                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                      Zustand Stores                         │
│  - useAuthStore: user auth session & token                  │
│  - useCurrencyStore: base currency (TRY/USD/EUR) & FX rates │
│  - useProfileStore: avatar URI & custom display names       │
│  - useBudgetStore: monthly limits & spending targets        │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    React Context Layer                      │
│  - LanguageContext: active locale ('tr' | 'en') & dict      │
│  - ThemeContext: dark/light theme tokens & dynamic styles   │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Notification & Background Task Engine

File: `src/services/notificationService.ts`

- **Deterministic ID Generation**: Every subscription notification is scheduled with ID `sub_remind_${subscription.id}`. Updating or deleting a subscription deterministically cancels and reschedules the exact notification without duplicates or orphaned alarms.
- **2-Day Prior Notification**: Scheduled for 09:00 AM local time, 2 days before the renewal date. If the renewal is within 24 hours, an immediate trigger is dispatched.
- **Contract Doom Reminder**: Taahhüt contracts with `contractEndDate` schedule a warning 7 days prior to commitment expiration (`doom_contract_${subscription.id}`).
- **Date Parsing Safety (`safeToDate`)**: Defensive parser handling `Date`, ISO strings, Firestore `Timestamp` objects (`.toDate()`), `null`, and `undefined` without throwing runtime exceptions.

---

## 7. Design System & Liquid Glass UI

- **Color Tokens**: Defined dynamically in `ThemeContext.tsx` (`primary: '#3B82F6'`, `surface: isDark ? '#1E293B' : '#FFFFFF'`, `background: isDark ? '#0B0F19' : '#F8FAFC'`).
- **Glassmorphism**: Built using semi-transparent RGBA backgrounds (`rgba(15, 23, 42, 0.92)` in dark mode, `rgba(255, 255, 255, 0.92)` in light mode) paired with subtle 1px translucent borders (`rgba(255, 255, 255, 0.16)`).
- **Physics-Based Haptics**: Integrated via `src/utils/haptics.ts` supporting `impactLight`, `impactMedium`, `selection`, `notificationSuccess`, and `notificationWarning`.

---

## 8. Internationalization & Dynamic Translation Engine

- **Dictionary Structure**: `src/locales/translations/tr.json` and `en.json`.
- **Runtime Switching**: Managed by `LanguageProvider` with persistent AsyncStorage storage under `@submate_app_lang`.
- **Zero Language Leaks**: All search placeholders, empty states, filter chips, delete confirmation dialogs, and AI cards support complete 100% Turkish and English strings.

---

## 9. Security, Sanitization & Firestore Rules

1. **Firestore Rules (`firestore.rules`)**:
   - Strict user isolation: `match /users/{userId}/{document=**} { allow read, write: if request.auth != null && request.auth.uid == userId; }`.
   - Complete rejection of unauthorized cross-user reads/writes.
2. **Input Sanitization (`src/utils/sanitizers.ts`)**:
   - Strips malicious HTML/script injection tags from subscription names, descriptions, and notes.
   - Price sanitization normalizes commas into dots and restricts numeric scale.
3. **Production Log Neutralization (`src/utils/security.ts`)**:
   - `neutralizeProductionLogs()` disables `console.log` and `console.debug` in production release builds to prevent sensitive financial data leakage into system logcats.

---

## 10. Hardware Cutouts & Safe Area Handling

- **Root Provider**: `<SafeAreaProvider>` wrapped at the highest root layout level in `src/app/_layout.tsx`.
- **Translucent Status Bar**: Configured via `<StatusBar style="auto" translucent={true} />`.
- **Top Insets Formula**:
  ```typescript
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(
    insets.top + 6,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 16
  );
  ```
  Guarantees headers and profile avatars are never clipped under Android punch-hole cameras or iPhone Dynamic Island / Notch cutouts.
- **Bottom Insets Formula**:
  - Tab bar container: `bottom: Math.max(insets.bottom + 6, 16)`
  - Floating Action Button: `bottom: Math.max(insets.bottom + 84, 90)`

---

## 11. Build, Release & Deployment Pipelines

### Android Standalone Release APK Build:
To build a standalone production APK (with 0 Expo Dev Launcher UI, completely offline embedded JavaScript bundle):

```bash
# Navigate to android directory and assemble release APK
cd android
./gradlew assembleRelease
```
**Output Location**: `android/app/build/outputs/apk/release/app-release.apk` (~123.7 MB)

### Development Server:
```bash
npm start
# or
npx expo start
```

---

## 12. Testing & Verification Suites

SubMate includes two independent automated verification test suites:

### 1. General Simulation & Feature Logic Suite
```bash
node ./scripts/verify-all.js
```
*Coverage (20 Tests - 100% Pass)*:
- FX currency conversions & cross-rate accuracy
- Notification scheduling math & deterministic ID checks
- Biometric lock fallback logic
- AI Trial Shield risk level calculations
- SubMate Wrapped annual math & savings projection
- Shared Vault split calculations
- FX Surge / Inflation predictions
- Gamification XP & achievement badge unlocks
- Widget data structure formatting

### 2. Notification Deep Verification Suite
```bash
node ./scripts/verify-notifications.js
```
*Coverage (35 Tests - 100% Pass)*:
- `getNextRenewalDate` monthly, weekly, yearly, quarterly cycles
- Leap year & end-of-month overflow protection (Jan 31 → Feb 28)
- Taahhüt (contract doom) 7-day alert calculation
- `safeToDate` parser resilience with `null`, `undefined`, ISO strings, Firestore timestamps
- File export and import consistency

---

## 13. Rules & Guidelines for Future AI / Developers

When making changes to this codebase, follow these rules:

1. **Category & Cycle Localization**: Always use `getCategoryLabel(category, isTurkish)` and `getBillingCycleLabel(cycle, isTurkish)` from `@/utils/categoryMeta` instead of rendering raw database strings.
2. **Translation Destructuring**: When using `const { t, currentLanguage } = useTranslation();`, always check if `isTurkish` is needed (`const isTurkish = currentLanguage === 'tr';`).
3. **Safe Area Insets**: Never use hardcoded top or bottom paddings on full-screen containers. Always incorporate `useSafeAreaInsets()`.
4. **Button Text Responsiveness**: Always include `numberOfLines={1}`, `adjustsFontSizeToFit`, and `minimumFontScale={0.85}` on button labels inside `flexDirection: 'row'` layouts to avoid text collisions when translating to longer languages.
5. **Deterministic Notification IDs**: When scheduling notifications for subscriptions, always use the prefix `sub_remind_${id}` or `doom_contract_${id}`.
6. **Always Run Test Suites**: After modifying services, utilities, or components, execute:
   ```bash
   node ./scripts/verify-all.js
   node ./scripts/verify-notifications.js
   ```

---
*Handover document successfully generated for SubMate.*
