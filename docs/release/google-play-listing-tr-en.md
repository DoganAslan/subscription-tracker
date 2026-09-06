# SubMate — Google Play Listeleme Paketi

> Bu dosya, Google Play Console'a yapıştırılmadan önce son ürün davranışı, destek bağlantıları ve mağaza alanlarıyla insan tarafından gözden geçirilmelidir. Bu belge bir mağaza gönderimi veya hukuki uyum beyanı değildir.

## Türkçe

### Uygulama adı

SubMate: Abonelik Takibi

### Kısa açıklama

Aboneliklerini, yenileme tarihlerini ve aylık toplamını tek yerde takip et.  
**Karakter sayısı: 72 / 80**

### Uzun açıklama

SubMate, düzenli ödemelerini daha görünür hale getirmek isteyenler için bir abonelik takip uygulamasıdır.

Aboneliklerini, ücretlerini, para birimlerini ve yenileme tarihlerini ekle; aylık toplamını, yaklaşan ödemelerini ve harcama dağılımını tek ekranda gör. Ödeme günlerini kaçırmamak için cihazında yerel hatırlatmalar planlayabilir, takvim görünümünden gelecek ödemelerini inceleyebilirsin.

Öne çıkanlar:

- Abonelik, kart ve yenileme günü takibi
- Aylık toplam, kategori dağılımı ve yaklaşan ödeme analizi
- Ödeme günleri için isteğe bağlı yerel bildirimler
- Takvim ve ana ekran aracıyla hızlı özet
- İsteğe bağlı yapay zekâ sohbetiyle kayıtlı abonelik özetini değerlendirme
- Verilerini dışa aktarma ve desteklenen yedekten geri yükleme
- Biyometrik kilit tercihiyle uygulamaya erişimi koruma

SubMate banka hesabına bağlanmaz; tam kart numarası, CVV/CVC veya banka parolası istemez. Uygulama finansal tavsiye, yatırım tavsiyesi ya da ödeme iptal hizmeti sunmaz. Yerel bildirimler ve analizler bilgi amaçlıdır; güncel fiyat ve sözleşme koşullarını ilgili hizmet sağlayıcısından doğrulamalısın.

Hesap kullanımı için Firebase Authentication ve Firestore altyapısı kullanılır. Yapay zekâ ve fatura analizi yalnızca sen başlattığında çalışır. Veri işleme ayrıntıları için uygulama içindeki Gizlilik Politikası'nı incele.

Destek: doganaslandevelopment@gmail.com

### Ekran görüntüsü başlıkları

1. **Aboneliklerin tek bakışta** — Aylık toplamını ve yaklaşan ödemelerini gör.
2. **Yenilemeleri kaçırma** — Takvimde ödeme günlerini planla.
3. **Harcama dağılımını anla** — Kategorilere göre aboneliklerini incele.
4. **Ödeme yöntemlerini düzenle** — Kartlarına bağlı abonelikleri takip et.
5. **Kendi verinle soru sor** — İsteğe bağlı yapay zekâ sohbetiyle abonelik özetini değerlendir.

### Özellik görseli metni

**Aboneliklerin kontrol altında.**  
Ödeme günlerini, aylık toplamını ve yaklaşan yenilemelerini takip et.

### Yayın inceleme notları

- Test hesabı istenirse yalnızca ayrı, zararsız test verileri içeren bir hesap sağlanmalıdır.
- Yapay zekâ özelliği, uygulama içinden kullanıcının yazdığı soruyla başlatılır; yanıtlar finansal tavsiye değildir.
- Bildirimler yereldir ve cihaz izni gerektirir.

## English

### App name

SubMate: Subscription Tracker

### Short description

Track subscriptions, renewal dates, and monthly totals in one place.  
**Character count: 69 / 80**

### Full description

SubMate is a subscription tracker for people who want a clearer view of recurring payments.

Add subscriptions, prices, currencies, and renewal dates. See your monthly total, upcoming payments, and spending breakdown in one place. You can schedule optional local reminders on your device and review upcoming charges in a calendar.

Highlights:

- Track subscriptions, payment cards, and renewal dates
- Review monthly totals, category breakdowns, and upcoming payments
- Schedule optional local payment reminders
- Use calendar and home-screen widgets for a quick summary
- Optionally discuss your recorded subscription summary with AI chat
- Export your data and restore a supported backup
- Protect app access with an optional biometric lock

SubMate does not connect to your bank account and does not request full card numbers, CVV/CVC codes, or banking passwords. It does not provide financial or investment advice, or cancel subscriptions for you. Reminders and analyses are informational; confirm current prices and contract terms with the relevant provider.

Firebase Authentication and Firestore are used for account use and cloud data storage. AI chat and receipt analysis only run when you start them. See the in-app Privacy Policy for details about data processing.

Support: doganaslandevelopment@gmail.com

### Screenshot captions

1. **Your subscriptions at a glance** — See monthly totals and upcoming payments.
2. **Never miss a renewal** — Plan payment dates in the calendar.
3. **Understand your spending** — Review subscriptions by category.
4. **Organize payment methods** — Track subscriptions linked to your cards.
5. **Ask about your own data** — Optionally review your subscription summary with AI chat.

### Feature graphic copy

**Subscriptions, under control.**  
Track payment dates, monthly totals, and upcoming renewals.

### Review notes

- If a test account is requested, provide a separate account with harmless test data only.
- AI starts only from an in-app question written by the user; responses are not financial advice.
- Notifications are local and require device permission.

## Final release review

- [ ] Confirm the final app name is available in the selected Play country/countries.
- [ ] Confirm the support email can receive and answer user messages.
- [ ] Replace screenshot captions only with screenshots from the released build.
- [ ] Ensure the privacy-policy URL in Play Console serves the same reviewed content as the in-app policy.
- [ ] Re-check every claim after enabling, disabling, or changing an SDK.
