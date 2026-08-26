# SubMate Derin Refactor Tasarımı

**Tarih:** 26 Ağustos 2026

**Durum:** Kullanıcı derin refactor yaklaşımını seçti; yazılı spesifikasyon kullanıcı incelemesini bekliyor.

**Kapsam:** Expo SDK 57 tabanlı SubMate uygulamasının davranışını koruyarak mimari olarak ayrıştırılması, taramada doğrulanan hataların düzeltilmesi ve test/performans/güvenlik sınırlarının güçlendirilmesi.

## 1. Amaç

Mevcut uygulama özellik bakımından yeterli, fakat bazı route ve feature dosyaları veri erişimi, iş kuralı, platform yan etkisi, form state'i ve büyük JSX ağaçlarını aynı yerde yönetiyor. En belirgin örnekler:

- `SubscriptionForm.tsx`: yaklaşık 1.500 satır
- `settings/index.tsx`: yaklaşık 1.000 satır
- dashboard `index.tsx`: yaklaşık 900 satır
- account settings: yaklaşık 630 satır
- analytics ve calendar: yaklaşık 550 satır

Refactorun amacı yalnız satırları farklı dosyalara taşımak değildir. Hedef, aynı finansal verinin dashboard, analiz, takvim, cüzdan ve widget içinde aynı kurallarla hesaplanmasını; her yan etkinin tek sahibi olmasını; route dosyalarının yalnız ekran bileşimi ve navigasyon içermesini sağlamaktır.

## 2. Başarı ölçütleri

Refactor tamamlandığında:

1. Route dosyaları navigasyon ve ekran bileşimi dışında iş kuralı taşımayacak ve normalde 250 satırı aşmayacak.
2. `SubscriptionForm`un mevcut import yolu ve dış props sözleşmesi korunacak; asıl koordinatör yaklaşık 200 satıra inecek.
3. Yeni route/screen/controller/section dosyalarının hiçbiri 500 satırı aşmayacak; yaprak bileşenler normalde 250 satırın altında kalacak.
4. Tüm faturalama döngüleri tek kanonik maliyet motorunu kullanacak.
5. Tüm yenileme tarihleri tek kanonik recurrence motorunu kullanacak.
6. Bir kullanıcı için yalnız bir Firestore abonelik dinleyicisi bulunacak.
7. Abonelik değişiklikleri tek, birleştirilmiş widget senkron hattından geçecek.
8. Logout veya A kullanıcısından B kullanıcısına geçiş sonrasında A kullanıcısının query, profil veya widget verisi görünmeyecek.
9. Form kaydı başarısız olduğunda ekran kapanmayacak; yalnız başarılı mutation sonrasında navigasyon yapılacak.
10. Refactor edilen yollarda yeni `any` eklenmeyecek ve mevcut `any` kullanımları kaldırılacak.
11. Gerçek bir assertion hatası test komutunu non-zero çıkış koduyla durduracak.
12. TypeScript, ESLint, uygulama testleri, Functions testleri, Firestore rules testleri, güvenlik testleri, audit, Expo Doctor ve production JS export başarılı olacak.
13. Bu çalışma kapsamında APK veya IPA oluşturulmayacak.

Satır hedefleri mutlak bir parçalama zorunluluğu değildir. Bir modülü sırf hedefe uymak için yapay parçalara ayırmak yerine, tek sorumluluk ve açık arayüz önceliklidir.

## 3. Kapsam dışı değişiklikler

Bu refactor sırasında şunlar yapılmayacak:

- Yeni kullanıcı özelliği eklemek
- Görsel tasarımı baştan değiştirmek
- Navigasyon rotalarını veya kullanıcıya görünen temel akışları değiştirmek
- Firestore koleksiyon adlarını değiştirmek veya veri migrasyonu gerektirmek
- Büyük Expo/React Native sürüm yükseltmesi yapmak
- Cloud Functions deploy etmek ya da ücretli Blaze planını zorunlu kılmak
- Legal metinleri değiştirmek
- Kullanıcının mevcut çalışma ağacındaki ilgisiz değişiklikleri geri almak

Doğrulanmış bir bug için gerekli küçük davranış değişiklikleri kapsam içindedir.

## 4. Tasarım ilkeleri

### 4.1 Bağımlılık yönü

```text
Route
  -> Feature screen
      -> View-model / controller
          -> Application coordinator / use-case
              -> Repository veya platform adapter

Pure domain
  -> billing
  -> recurrence
  -> normalization
  -> projections
```

- Domain modülleri React, Expo, Firebase, AsyncStorage veya i18n singleton'ına doğrudan bağlanmayacak.
- Saat, dil, kur ve platform diyaloğu gibi değişkenler parametre veya adapter olacak.
- Route ve sunum bileşenleri Firebase/AsyncStorage çağırmayacak.
- Firebase, bildirim, widget ve yerel depolama erişimi adapter/application sınırında kalacak.
- Yeni feature sınırları dosya bazlı ESLint kurallarıyla korunacak; global olarak kapalı `react-hooks/exhaustive-deps` kuralı önce yeni klasörlerde yeniden etkinleştirilecek.

### 4.2 Kademeli strangler yaklaşımı

Eski dış arayüzler geçiş boyunca facade/re-export olarak korunacak. Her mimari dilim tek başına derlenip test edildikten sonra bir sonraki dilime geçilecek. Büyük dosya tek hamlede yeniden yazılmayacak.

### 4.3 Tek sahip ilkesi

Her yan etkinin yalnız bir sahibi olacak:

- Firestore subscription stream: `SubscriptionFeedProvider`
- Widget projection/render: `WidgetSyncBridge`
- Auth kullanıcı geçişi ve temizlik: `SessionLifecycleCoordinator`
- Kur yükleme ve refresh: `CurrencyRatesProvider`
- Bildirim izni bootstrap'i: root notification coordinator
- AI backend seçimi ve fallback: `AiGateway`

## 5. Ortak domain çekirdeği

### 5.1 Kanonik billing motoru

Mevcut kod aylık maliyeti dashboard, analytics, widget, wallet ve iki ayrı utility içinde farklı biçimde hesaplıyor. Doğrulanmış hata olarak `biannually` bazı yerlerde `/12`, `biennially` ise bölünmeden hesaplanıyor.

Yeni yapı:

```text
src/domain/subscriptions/
  billing.ts
  recurrence.ts
  normalization.ts
  projections.ts
  cardAssignment.ts
```

Temel API:

```ts
type SubscriptionCostContext = {
  baseCurrency: string;
  rates: ExchangeRates;
};

type SubscriptionCostBreakdown = {
  billingGross: number;
  monthlyGross: number;
  monthlyRecovered: number;
  monthlyNet: number;
};

calculateSubscriptionCost(
  subscription: Subscription,
  context: SubscriptionCostContext,
): SubscriptionCostBreakdown;
```

Altı döngünün katsayıları açık typed record ile tanımlanacak:

- weekly: `52 / 12`
- monthly: `1`
- quarterly: `1 / 3`
- biannually: `1 / 6`
- yearly: `1 / 12`
- biennially: `1 / 24`

Substring eşleştirmesi kullanılmayacak. Dashboard, analytics, wallet, form bütçe uyarısı, CSV export ve widget bu API'ye geçirilecek.

### 5.2 Kanonik recurrence motoru

Takvim, analiz ve widget şu anda ayrı yenileme motorları kullanıyor. Yeni API:

```ts
getNextRenewal(subscription: Subscription, from: Date): Date | null;

getRenewalsInRange(
  subscription: Subscription,
  range: { start: Date; end: Date },
): Date[];
```

Motor şu kuralları tek yerde uygulayacak:

- Haftalık, aylık, üç aylık, altı aylık, yıllık ve iki yıllık tekrar
- Ay sonu sıkıştırma (`31 Ocak -> Şubat'ın son geçerli günü`)
- Leap year
- Geçmiş yenilemeyi aritmetik sıçramayla geleceğe taşıma; sınırsız `while` yok
- Aktif denemede ilk ücret tarihi olarak `trialEndDate`
- Paused aboneliklerin ödeme projeksiyonundan çıkarılması
- Geçersiz tarih için güvenli `null`

### 5.3 Normalization ve legacy uyumluluğu

Okuma sırasında `isPaused/status`, `isFreeTrial/isTrial` ve `assignedCardId/cardId` legacy alanları normalize edilecek. Yeni yazımlar yalnız kanonik alanları kullanacak. Firestore şeması değiştirilmeden mevcut kayıtlarla uyumluluk korunacak.

## 6. Abonelik veri akışı ve widget

### 6.1 Tek canlı akış

Hedef akış:

```text
Firestore onSnapshot
  -> SubscriptionFeedProvider
      -> React Query user-scoped cache
          -> bütün ekranlar ve modallar
          -> WidgetSyncBridge
```

- İlk açılışta aynı veri için eşzamanlı `getDocs` ve `onSnapshot` çalışmayacak.
- Query anahtarları UID içerecek.
- Provider UID değişince eski listener'ı kapatacak ve yeni listener'ı açacak.
- Mutasyonlar Firestore yazımı ve kontrollü optimistic cache değişimi yapabilecek; sonrasında ayrıca invalidate/refetch/widget çağrısı yapmayacak.
- Pull-to-refresh gerekiyorsa açık bir manuel refresh use-case olacak; otomatik canlı akışla karıştırılmayacak.

### 6.2 Tek widget köprüsü

`WidgetSyncBridge`, subscription snapshot ve base currency değişimini dinleyecek. `WidgetProjectionCoordinator`:

- Son istek kazanır biçiminde debounce/coalescing uygulayacak.
- Aynı projection hash'i tekrar geldiyse AsyncStorage/native render yapmayacak.
- `buildWidgetData` saf fonksiyonunu kanonik billing/recurrence motoruyla besleyecek.
- Logout sırasında `widget_data`yı silip nötr widget görünümü render edecek.

Dashboard, mutation hook'ları ve Firestore listener içindeki ayrı `updateWidgetData` çağrıları kaldırılacak.

## 7. SubscriptionForm ayrıştırması

Mevcut import yolu korunacak:

```text
src/features/subscriptions/components/SubscriptionForm.tsx
  -> yeni form koordinatörünü re-export eden facade
```

Yeni yapı:

```text
src/features/subscriptions/components/subscription-form/
  SubscriptionForm.tsx
  SubscriptionForm.types.ts
  constants.ts
  formDefaults.ts
  subscriptionForm.styles.ts
  hooks/
    useSubscriptionFormDependencies.ts
    useReceiptScanner.ts
    useBudgetGuard.ts
  fields/
    AmountCurrencyField.tsx
    SubscriptionDateField.tsx
    OptionPickerField.tsx
    OptionPickerModal.tsx
  sections/
    BasicSubscriptionSection.tsx
    AdvancedSubscriptionSection.tsx
    SplitMembersSection.tsx
    SubscriptionFormActions.tsx
```

### 7.1 State sahipliği

- Root form tek `useForm` ve `FormProvider` sahibi olacak.
- Alan bölümleri yalnız `useFormContext`/`useWatch` ile ihtiyaç duydukları alanları izleyecek.
- Picker bileşenleri kendi görünürlük state'lerini yönetecek.
- `SubscriptionDateField` web ref'i ve native picker state'ini yönetecek.
- `SplitMembersSection` kendi `useFieldArray` state'ini yönetecek.
- Receipt hook izin, picker, image resize/compression ve AI servisini yönetecek; forma yalnız typed patch döndürecek.
- Budget guard saf projection sonucunu adapter üzerinden onaylatıp `onSubmit`i tam bir kez çağıracak.

### 7.2 Form tipleri ve doğrulama

Zod input/output tipleri ayrılacak:

```ts
type SubscriptionFormInput = z.input<typeof subscriptionSchema>;
type SubscriptionFormData = z.output<typeof subscriptionSchema>;
```

`zodResolver(...) as any`, `control._formValues` ve refactor edilen form yolundaki diğer `any` kullanımları kaldırılacak. `externalAmount` geçici olarak facade sözleşmesinde korunacak ancak typed `setValue` ile uygulanacak. Kullanılmadığı karakterizasyon testleriyle doğrulanınca ayrı bir temizlik adımında kaldırılabilecek.

Kategori listesi schema ve UI arasında tek katalogdan üretilecek. Manuel giriş, schema ve AI ad sınırları aynı değere getirilecek.

### 7.3 Submit davranışı

Akış:

```text
Input
  -> RHF input type
  -> Zod parse/sanitize
  -> canonical budget projection
  -> gerekiyorsa platform confirmation adapter
  -> async screen mutation
  -> yalnız başarıda navigasyon
```

Kayıt/güncelleme mutation hatasında form açık kalacak, değerler korunacak ve yerelleştirilmiş kullanıcı mesajı gösterilecek.

## 8. Büyük ekranların ayrıştırılması

Route dosyaları ilgili feature screen'i re-export edecek.

### 8.1 Dashboard

```text
src/features/dashboard/
  screens/DashboardScreen.tsx
  hooks/useDashboardViewModel.ts
  hooks/useDashboardPreferences.ts
  components/DashboardHeader.tsx
  components/SubscriptionSearch.tsx
  components/MonthlySpendHero.tsx
  components/DashboardQuickActions.tsx
  components/DashboardAlerts.tsx
  components/SpendingOverview.tsx
  components/HeroThemePickerModal.tsx
  components/DashboardOverlays.tsx
```

`useDashboardViewModel` yalnız saf/türetilmiş ekran modelini döndürecek. Arama sonuçları tek virtualized listede render edilecek. Sabit `%8,2` büyüme değeri ve sabit `3500` bütçe sınırı kaldırılacak; gerçek geçmiş veri yoksa büyüme göstergesi gösterilmeyecek, bütçe değeri store'dan gelecek.

### 8.2 Settings

```text
src/features/settings/
  screens/SettingsScreen.tsx
  hooks/useSettingsProfile.ts
  hooks/useSettingsActions.ts
  components/SettingsProfileCard.tsx
  components/SettingsSection.tsx
  components/SettingsRow.tsx
  components/DataVaultCard.tsx
  components/LanguagePickerModal.tsx
  components/CurrencyPickerModal.tsx
  components/ThemePickerModal.tsx
  styles/settingsStyles.ts
```

Profil adı ve avatar `useProfileStore` içinde tek state olacak. Route içindeki doğrudan AsyncStorage/Firebase erişimi kaldırılacak. Legal sayfalar ayrı route olduğundan erişilemeyen privacy/terms modal state ve JSX'i kaldırılacak. Para birimi kataloğu tek kaynağa indirilecek.

### 8.3 Account Settings

```text
src/features/settings/account/
  hooks/useAccountCapabilities.ts
  hooks/useAccountSecurityActions.ts
  components/AccountHero.tsx
  components/AccountSecuritySection.tsx
  components/ChangeEmailModal.tsx
  components/ChangePasswordModal.tsx
  components/DeleteAccountModal.tsx
```

Her modal kendi form/loading state'ine sahip olacak. Sağlayıcı kapasitesi açıkça modellenecek:

```ts
type AccountCapabilities = {
  hasPasswordProvider: boolean;
  canChangeEmail: boolean;
  canChangePassword: boolean;
  deleteReauthentication: 'password' | 'google';
};
```

Google kullanıcısına parola alanı gösterilmeyecek; desteklenen Google reauthentication akışı kullanılacak. Ham Firebase kodları kullanıcıya gösterilmeyecek.

### 8.4 Analytics

```text
src/features/analytics/
  screens/AnalyticsScreen.tsx
  hooks/useFinancialAnalysisViewModel.ts
  hooks/useUsageActions.ts
  components/AnalysisHeader.tsx
  components/AnalysisHero.tsx
  components/MetricGrid.tsx
  components/CashFlowSection.tsx
  components/SpendingBreakdownSection.tsx
  components/UpcomingPaymentsSection.tsx
  components/FinancialStructureSection.tsx
  components/PriorityActionsSection.tsx
  components/AnalysisSectionCard.tsx
```

Mevcut yardımcı bileşenlerin `any` props'ları açık interface'lere çevrilecek. View-model kur durumu, formatter, analiz ve insight listelerini üretecek. Ay seçimi UI state olarak screen'de kalabilecek.

### 8.5 Calendar

```text
src/features/calendar/
  screens/CalendarScreen.tsx
  hooks/useCalendarViewModel.ts
  components/CalendarHeader.tsx
  components/MonthNavigator.tsx
  components/CalendarGrid.tsx
  components/CalendarDayCell.tsx
  components/SelectedDayPayments.tsx
```

View-model, subscription listesini tek geçişte `calendarCells`, `paymentsByDay`, `monthlyTotal` ve `selectedDayPayments` modeline dönüştürecek. Recurrence üç kez yeniden hesaplanmayacak. Kategori metadata'sı ortak helper'dan gelecek.

### 8.6 Wallet

```text
src/features/wallet/
  screens/WalletScreen.tsx
  hooks/useWalletViewModel.ts
  utils/buildCardSummaries.ts
  components/WalletHeader.tsx
  components/WalletCardItem.tsx
  components/LinkedSubscriptionsPanel.tsx
  components/WalletEmptyState.tsx
```

Subscription listesi kart başına bir kez indekslenecek. `cardId` ve legacy `assignedCardId` ortak selector ile çözülecek. Aylık toplam kanonik billing motorundan gelecek; yıllık tutar `/ay` etiketiyle tam değer olarak gösterilmeyecek.

## 9. Oturum ve güvenlik sınırı

Yeni `SessionLifecycleCoordinator` UID değişimini ve logout işlemini yönetecek:

1. Canlı kullanıcı listener'larını kapatır.
2. Kullanıcıya ait React Query cache'ini temizler.
3. Profil state'ini sıfırlar.
4. Kullanıcıya ait yerel anahtarları temizler; tema ve dil gibi cihaz tercihlerini korur.
5. Widget verisini sıfırlar ve nötr görünümü render eder.
6. Firebase çıkışını tamamlar.
7. Auth state onaylandıktan sonra auth route'una geçer.

Profil yüklemesi request token/UID kontrolü kullanacak; A için başlayan async çağrı B oturumunda state yazamayacak.

Account silme akışı provider-aware reauthentication'dan geçecek. Backend atomik silme Blaze gerektirdiği için bu refactor istemci akışını iyileştirecek, fakat cross-service atomiklik iddiasında bulunmayacak. Kısmi hata durumları yerelleştirilmiş ve tekrar denenebilir olacak.

Firestore rules tarafında `splitMembers`, `priceHistory` ve `usageLogDates` listelerinin yalnız liste uzunluğu değil, öğe tip/alanları da doğrulanacak ve emulator testleri eklenecek.

## 10. Kur ve profil provider'ları

`CURRENCY_RATES` gizli, global mutable state olmaktan çıkarılacak. `CurrencyRatesProvider/useCurrencyRates` şu sözleşmeyi sunacak:

```ts
{
  rates: ExchangeRates;
  status: 'idle' | 'loading' | 'ready' | 'stale' | 'error';
  refreshedAt: number | null;
  refresh: () => Promise<void>;
}
```

Saf domain fonksiyonları kurları parametre olarak alacak. Dashboard'un kullanılmayan `setLiveRates` state'i ve analytics'in `ratesVersion` yeniden render hilesi kaldırılacak.

Profil store display name ve avatarın tek sahibi olacak. Dashboard ve Settings kendi kopya AsyncStorage akışlarını tutmayacak.

## 11. AI sınırı

Bu refactor AI davranışını yeniden tasarlamayacak ancak mevcut iki farklı backend hattını açık bir gateway arkasına alacak:

```text
AiChat UI
  -> AiGateway
      -> request DTO builder
      -> backend adapter
      -> response validator
      -> observable fallback policy
```

- UI yalnız `AiGateway` çağıracak.
- Prompt policy, request normalization ve offline karar motoru saf/test edilebilir modüller olacak.
- Firebase AI Logic ve callable fallback'in backend seçimi açık config olacak; sessiz hata yutma yerine güvenli telemetry kodu üretilecek.
- Auth, App Check, rate limit ve prompt sanitization sınırları contract testleriyle korunacak.
- Türkçe ve İngilizce aynı intent fixture'larıyla eşdeğer davranış testinden geçecek.
- Model değişimi bu refactorun zorunlu parçası değildir; önce davranış hattı tekleştirilecek.

## 12. Test mimarisi

Mevcut `verify-all.js` üretim kodunu test etmek yerine kur/bildirim/biyometri mantığını test dosyasında yeniden yazıyor ve assertion hatasında non-zero çıkmıyor. Bu betik güvenilir bir release kapısı değildir.

Expo'nun SDK 57 için önerdiği `jest-expo` ve `@testing-library/react-native` tabanlı test katmanı kurulacak. Node tabanlı saf domain testleri ile mevcut Functions/Firestore emulator testleri korunacak.

```text
tests/
  unit/domain/
  unit/mappers/
  integration/subscription-sync/
  integration/auth-session/
  integration/widget/
  components/subscription-form/
  components/account-settings/
  contracts/ai/
  firestore/
```

Tam ekran kırılgan snapshot testleri yerine kullanıcı davranışı ve saf çıktı testleri tercih edilecek.

### 12.1 Zorunlu karakterizasyon testleri

- Altı billing cycle ve aynı fixture'ın dashboard/analytics/wallet/widget toplam eşitliği
- Paused ve split abonelikler
- 29/30/31 gün, leap year, DST, geçmiş yenileme ve trial end
- Firestore Timestamp, Date, ISO string ve geçersiz tarih dönüşümü
- Legacy alan okuma ve kanonik yazım
- Form default'ları, selector değişimi, split append/remove ve exact submit payload
- Receipt scan izin reddi, iptal, base64 yokluğu, başarılı patch ve servis hatası
- Budget cancel/confirm ve `onSubmit`in tam bir kez çağrılması
- Mutation hatasında ekranda kalma; başarıda navigasyon
- Firestore listener'ın UID başına bir kez açılıp cleanup edilmesi
- Widget add/update/delete/pause, projection hash ve logout reset
- Email/password ve Google account capability/reauth akışları
- A -> logout -> B geçişinde A verisinin görünmemesi
- Türkçe/İngilizce AI intent/fallback eşdeğerliği
- Firestore kötü niyetli nested-list fixture'ları

### 12.2 Komut kapıları

```text
test:unit
test:components
test:functions
test:rules
test:security
test:all
verify:release
```

`verify:release` sırası:

1. Root typecheck
2. Functions build
3. ESLint
4. Uygulama unit/component/integration testleri
5. Functions testleri
6. Firestore rules emulator testleri
7. Güvenlik contract testleri
8. Root ve Functions production audit
9. Expo Doctor
10. Production JS export

APK/IPA bu kapının parçası olmayacak.

## 13. Bağımlılık, izin ve build temizliği

Mimari refactor ve testler tamamlandıktan sonra:

- Expo SDK 57 paketleri `expo install --check` önerdiği patch sürümlerine hizalanacak.
- Kullanılmadığı statik tarama ve build ile doğrulanan paketler küçük gruplar hâlinde kaldırılacak.
- Bakım betiklerine özel çeviri paketleri gerekiyorsa production dependency yerine devDependency'ye taşınacak.
- `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW` ve eski storage izinleri config/prebuild kaynağı doğrulandıktan sonra `android.blockedPermissions`/manifest merge kurallarıyla kaldırılacak.
- Preview/development APK kalacak; production EAS profili store uyumlu AAB üretecek.
- R8/resource shrink yalnız testler tamamlandıktan sonra ayrı, geri alınabilir adım olarak etkinleştirilecek.
- `.env.example` ile runtime'ın beklediği Android/Web Firebase anahtar adları eşitlenecek.
- `.eas-session`, geçici export klasörleri, npm cache ve build artifact'ları `.gitignore` ile korunacak.

## 14. Uygulama sırası ve checkpoint'ler

Bu belge programın tamamının mimari sözleşmesidir. Uygulama tek devasa plan yerine dört yürütme dalgasına ayrılacak:

1. **Temel güvenlik ağı:** test altyapısı, kanonik domain çekirdeği, subscription feed ve widget bridge
2. **SubscriptionForm:** facade arkasında formun ayrıştırılması ve add/edit başarı-hata akışları
3. **Ekranlar ve oturum:** dashboard, calendar, analytics, wallet, settings, account ve session lifecycle
4. **AI ve release temizliği:** AI gateway, ölü kod/paket, Expo patch, izin ve build config doğrulaması

Her dalga kendi ayrıntılı uygulama planına ve doğrulama checkpoint'ine sahip olacak. Önceki dalga yeşil olmadan sonraki dalga başlamayacak. Kapsam bu ana sözleşmeden sapmadığı sürece dalgalar yeni özellik kabul edilmeksizin sırayla yürütülecek.

1. Test altyapısını güvenilir hâle getir ve mevcut davranış karakterizasyonlarını yaz.
2. Kanonik billing, recurrence, normalization, card assignment ve currency catalog modüllerini çıkar.
3. Subscription feed provider ve widget sync bridge'i tekleştir.
4. `SubscriptionForm` facade arkasında yapraklardan başlayarak böl.
5. Add/edit mutation-success navigasyonunu düzelt.
6. Dashboard'u presentational bileşenlere ve view-model'e ayır.
7. Calendar, analytics ve wallet'ı ortak domain çekirdeğine geçirip ayır.
8. Settings ve account screens'i ayır; profil/session/provider-aware auth sınırlarını merkezileştir.
9. AI gateway/request/fallback sınırlarını ayır.
10. Ölü dosya, import ve paketleri küçük gruplarla kaldır.
11. Expo patch, izin ve build config temizliğini uygula.
12. Tam release verification kapısını çalıştır.

Her adımda:

- Önce ilgili failing/characterization test yazılır.
- Tek mimari dilim değiştirilir.
- İlgili testler, typecheck ve lint çalıştırılır.
- Başarısızlık bir sonraki dilime taşınmaz.
- Kullanıcının ilgisiz çalışma ağacı değişiklikleri korunur.

## 15. Hata yönetimi

- UI'ya ham Firebase/Expo/Google hata kodu gösterilmeyecek.
- Domain hata türleri kullanıcı mesajından ayrılacak.
- Mutation hata durumunda optimistic cache geri alınacak veya server snapshot ile uzlaştırılacak.
- Listener hata durumunda son güvenilir veri gösterilecek ve retry durumu view-model'e taşınacak.
- AI fallback yalnız tanımlanmış hata sınıflarında çalışacak; kullanıcı sorusunu yok sayan genel cevap üretmeyecek.
- Widget hatası ana uygulama mutation'ını başarısız saymayacak, fakat telemetry/breadcrumb bırakacak.
- Receipt tarama hatası formdaki mevcut alanları silmeyecek.

## 16. Regresyon ve manuel doğrulama matrisi

Otomatik testlere ek olarak şu matris kontrol edilecek:

- 320, 390, 768 ve 1180 px genişlik
- Android küçük ekran ve klavye açık modallar
- iPhone notch/Dynamic Island ve iPad safe area
- Açık/koyu tema
- Türkçe/İngilizce
- Dashboard arama, quick actions ve overlay'ler
- Form add/edit, trial, contract, split ve receipt scan
- Calendar ay/gün navigasyonu
- Analytics sütun seçimi
- Wallet expand/pin/edit
- Settings dil/kur/tema ve account modalları
- Logout ve hesap değişimi
- Android widget add/update/delete/pause/logout

Agent erişebildiği web genişlikleri, production export ve statik safe-area kontrollerini çalıştıracak. Fiziksel Android/iPhone/iPad doğrulaması için yeniden üretilebilir bir beta kontrol listesi teslim edilecek; fiziksel cihaz sonucu kullanıcı tarafından işaretlenecek. Kod refactorunun tamamlanması otomatik kapılara bağlıdır, mağaza yayınına hazır kabul edilmesi ise fiziksel cihaz matrisinin de onaylanmasını gerektirir.

## 17. Rollback stratejisi

- Eski public import yolları facade olarak son doğrulamaya kadar korunacak.
- Her aşama küçük ve bağımsız commit olacak.
- Yeni domain motoru bir tüketiciye sırayla geçirilecek; bütün tüketiciler geçmeden eski yardımcı kaldırılmayacak.
- Widget ve auth koordinatörleri doğrulanmadan eski çağrı noktaları topluca silinmeyecek.
- Büyük dependency yükseltmeleri bu refactorla birleştirilmeyecek.
- Her checkpoint'te geri dönüş yalnız o dilimin commit'ini geri almayı gerektirecek.

## 18. Tamamlanma tanımı

Çalışma şu koşulların tümü sağlandığında tamamlanmış sayılacak:

- Bu belgede tanımlanan route, form, data-flow ve session sınırları uygulanmış.
- Aynı subscription fixture'ı bütün tüketicilerde aynı aylık maliyet ve yenileme tarihini üretiyor.
- Arama sonucu tek kez render ediliyor.
- Tek Firestore listener ve tek widget bridge testlerle doğrulanmış.
- Logout sonrası önceki kullanıcı verisi query, avatar veya widgetta kalmıyor.
- Google ve password hesaplarının account capability akışları doğru.
- Refactor edilen yollarda `any` yok ve private RHF API kullanılmıyor.
- Ölü dosya/paket adayları doğrulanıp temizlenmiş.
- Tüm release verification komutları başarılı.
- Agent tarafındaki responsive/safe-area kontrolleri uygulanmış ve fiziksel cihaz beta kontrol listesi teslim edilmiş.
- APK/IPA oluşturulmamış.
