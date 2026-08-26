export const privacyPolicies: Record<string, string> = {
  tr: `# SubMate Gizlilik Politikası

**Son güncelleme: 18 Ağustos 2026**

Bu Gizlilik Politikası, Doğan Aslan tarafından sunulan SubMate mobil ve web uygulamasında kişisel verilerin nasıl işlendiğini açıklar. Metin; 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK), uygulanabildiği ölçüde Genel Veri Koruma Tüzüğü (GDPR) ve uygulama mağazalarının şeffaflık kuralları dikkate alınarak hazırlanmıştır.

SubMate'i kullanmadan önce bu metni okuyun. Uygulamanın isteğe bağlı bir özelliğini kullanmanız, yalnızca o özelliğin çalışması için açıklanan veri işlemlerini başlatır.

## 1. Veri sorumlusu ve iletişim

**Veri sorumlusu:** Doğan Aslan — SubMate geliştiricisi  
**İletişim:** [doganaslandevelopment@gmail.com](mailto:doganaslandevelopment@gmail.com)

Gizlilik taleplerinizde hesabınızda kullandığınız e-posta adresini ve talebinizi açıkça belirtin. Güvenliğiniz için kimliğinizi veya hesap sahipliğinizi doğrulamamız gerekebilir.

## 2. İşlediğimiz veriler

SubMate, sunduğu işlevlere göre aşağıdaki veri kategorilerini işleyebilir:

- **Hesap ve kimlik doğrulama verileri:** Firebase kullanıcı kimliği, e-posta adresi, görünen ad, profil fotoğrafı, giriş yöntemi ve hesap oluşturma/güncelleme zamanları. Parolanız Firebase Authentication tarafından işlenir; geliştirici parolanızı düz metin olarak göremez.
- **Abonelik ve bütçe verileri:** Abonelik adı, kategori, tutar, para birimi, faturalama dönemi, yenilenme ve sözleşme tarihleri, deneme veya duraklatma durumu, hatırlatma tercihi, kullanım sıklığı, notlar ve fiyat geçmişi.
- **Ödeme yöntemi etiketleri:** Kullanıcının verdiği kart adı, kart türü, yalnızca son dört hane, son kullanma ayı/yılı, para birimi ve isteğe bağlı harcama limiti. SubMate tam kart numarası, CVV/CVC, banka parolası veya gerçek banka işlem geçmişi istemez ve işlemez.
- **Paylaşım bilgileri:** Masraf bölüşme özelliği kullanılırsa eklenen kişinin adı, telefon numarası, pay tutarı ve ödeme durumu. Başka bir kişiye ait bilgileri yalnızca gerekli yetkiniz veya uygun hukuki dayanağınız varsa eklemelisiniz.
- **Tercihler ve cihazda tutulan veriler:** Dil, tema, biyometrik kilit tercihi, bildirim ayarları, bütçe hedefleri, ödeme geçmişi, araç takımı verileri, döviz kuru önbelleği ve uygulamanın çalışması için gerekli diğer yerel ayarlar.
- **Bildirim verileri:** Bildirim izni, planlanmış yerel hatırlatmalar ve cihaz/uygulama bildirim belirteci. Hatırlatmalar ödeme veya yenileme bilgilerini cihazınızda gösterebilir.
- **Yapay zekâ verileri:** Yapay zekâ sohbetini kullandığınızda yazdığınız mesaj, önceki sohbet bağlamı ve kişiselleştirilmiş yanıt için gerekli abonelik özeti Google Gemini Developer API'ye gönderilir. Fatura taramayı seçtiğinizde yalnızca seçtiğiniz görsel analiz için Gemini'ye gönderilir. Sohbet ve fatura görsellerine gereksiz kişisel, gizli, sağlık, kimlik veya tam ödeme kartı bilgisi eklemeyin.
- **Teknik istek ve hata verileri:** Firebase, Google, Expo, Sentry veya döviz kuru hizmetlerine yapılan bağlantılar sırasında IP adresi, cihaz/uygulama tanımlayıcıları, işletim sistemi, uygulama sürümü, istek zamanı ve güvenlik/işletim günlükleri hizmet sağlayıcılar tarafından işlenebilir. Sentry etkinse varsayılan kişisel veri gönderimi kapalı tutulur ve hata kırıntılarındaki serbest biçimli veriler kaldırılır.

## 3. Verileri nasıl topluyoruz?

Verilerin çoğunu hesabınızı oluştururken veya abonelik, kart etiketi, profil, yapay zekâ ve paylaşım özelliklerini kullanırken doğrudan siz sağlarsınız. Bazı teknik bilgiler uygulama ile hizmet sağlayıcılar arasındaki bağlantı sırasında otomatik oluşur. Fotoğraf galerisi, bildirim ve biyometri gibi cihaz izinleri yalnızca ilgili özelliği kullanmak istediğinizde işletim sistemi üzerinden istenir.

## 4. İşleme amaçları ve hukuki sebepler

Verileri aşağıdaki amaçlarla ve uygulanabilir hukuki sebeplere dayanarak işleriz:

- Hesap oluşturmak, oturum açtırmak, abonelikleri ve kart etiketlerini senkronize etmek, hatırlatmaları ve temel özellikleri sunmak için **sözleşmenin kurulması veya ifası**.
- Güvenliği sağlamak, kötüye kullanımı önlemek, hataları gidermek ve hizmeti geliştirmek için temel haklarınızı zedelemeyen **meşru menfaatler**.
- Bildirim, fotoğraf erişimi veya yapay zekâ gibi isteğe bağlı özelliklerde, mevzuatın gerektirdiği durumlarda **açık rıza/izin**.
- Yetkili makam taleplerine yanıt vermek ve zorunlu kayıtları tutmak için **hukuki yükümlülük**.

Bir izin veya rızayı cihaz ayarlarından ya da ilgili uygulama ayarından geri çekebilirsiniz. Geri çekme, öncesindeki hukuka uygun işlemleri etkilemez; ancak ilgili özellik çalışmayabilir.

## 5. Verilerin saklandığı yerler

- **Cihazınız:** Tercihler, önbellekler, planlanmış bildirimler ve bazı kullanım kayıtları cihazda tutulur. Uygulamayı kaldırmak cihazdaki verileri silebilir; ancak bulutta senkronize edilen verileri otomatik olarak silmez.
- **Google Firebase:** Hesap bilgileri Firebase Authentication'da; profil, abonelik ve kart etiketi kayıtları Cloud Firestore'da saklanır. Firestore çevrimdışı kullanım için cihazda yerel önbellek oluşturabilir.
- **Google Gemini:** Yapay zekâ özelliği kullanıldığında istemler, gerekli abonelik bağlamı, seçilen fatura görseli ve üretilen yanıt Google tarafından kendi Gemini API şartlarına göre işlenir. Google'ın veriyi ürün geliştirme amacıyla kullanıp kullanmaması ve saklama süresi, geliştirici hesabının ücretli/ücretsiz hizmet durumuna ve yürürlükteki Google şartlarına göre değişebilir. Bu nedenle yapay zekâ alanlarına hassas veya gereksiz kişisel veri göndermeyin.

SubMate verilerinizi reklam amacıyla satmaz, kiralamaz ve davranışsal reklam profili oluşturmaz.

## 6. Hizmet sağlayıcılar ve üçüncü taraflar

Veriler yalnızca özelliğin çalışması için gerekli olduğu ölçüde şu alıcı gruplarıyla paylaşılabilir:

- **Google Firebase:** Kimlik doğrulama, hesap yönetimi ve bulut veri saklama.
- **Google Gemini Developer API:** Kullanıcının başlattığı yapay zekâ sohbeti ve fatura analizi.
- **Expo ve cihaz işletim sistemi sağlayıcıları:** Bildirim belirteci oluşturma, yerel bildirimler, izinler ve platform hizmetleri.
- **Sentry:** Etkinleştirilmişse, kişisel veri içermemesi hedeflenen hata kayıtları ve sınırlı performans teşhisi.
- **ExchangeRate-API (open.er-api.com):** Güncel döviz kurlarını almak için seçilen baz para birimi ve bağlantının doğal sonucu olan teknik istek bilgileri.
- **Google ile giriş:** Kullanıcı bu yöntemi seçerse Google hesap kimlik doğrulaması.
- **WhatsApp:** Kullanıcı paylaşım hatırlatıcısını göndermeyi seçerse ad, telefon numarası, abonelik adı ve pay tutarı WhatsApp'a yönlendirilen mesajda yer alır. Gönderim sonrasında WhatsApp'ın koşulları ve gizlilik politikası geçerlidir.
- **Yetkili makamlar:** Kanunen zorunlu, usulüne uygun ve bağlayıcı bir talep bulunması hâlinde.

Bu sağlayıcıların kendi koşulları ve gizlilik uygulamaları bulunur. SubMate, üçüncü taraf hizmetlerin bağımsız veri işleme faaliyetlerini kontrol etmez.

## 7. Yurt dışına veri aktarımı

Firebase Authentication Amerika Birleşik Devletleri'nde, Firebase'in diğer hizmetleri ile Gemini ve Expo ise Google/sağlayıcıların küresel altyapısında çalışabilir. Bu nedenle hesabınız, uygulama verileriniz veya yapay zekâya gönderdiğiniz içerikler Türkiye dışında işlenebilir. Aktarımlar; uygulanabilir KVKK, GDPR ve ilgili sağlayıcı sözleşmelerindeki veri koruma mekanizmalarına tabi olarak gerçekleştirilir. Yurt dışı aktarımının hukuki şartları değişirse gerekli bilgilendirme, izin veya uygun güvence süreçleri güncellenir.

## 8. Biyometri ve cihaz izinleri

Desteklenen cihazlarda Face ID, Touch ID veya parmak izi doğrulaması işletim sisteminin güvenli alanında gerçekleşir. SubMate biyometrik şablonunuza erişmez, onu kopyalamaz ve sunucuya göndermez; yalnızca doğrulamanın başarılı veya başarısız olduğu sonucunu alır. Biyometri desteği olmayan platformlarda bu koruma kullanılamayabilir.

Fotoğraf ve bildirim izinleri isteğe bağlıdır. İzinleri cihaz ayarlarından kapatabilirsiniz; bu durumda fatura tarama veya hatırlatma gibi ilgili özellikler çalışmayabilir.

## 9. Saklama süreleri

- Hesap, profil, abonelik ve kart etiketi verileri hesabınız aktif olduğu sürece veya siz silene kadar saklanır.
- Yerel tercihler ve önbellekler hesap silme, uygulama verilerini temizleme veya uygulamayı kaldırma işlemine kadar cihazda kalabilir.
- Kullanıcının dışa aktardığı JSON/CSV dosyaları seçtiği konumda kalır ve bunların güvenliği/silinmesi kullanıcıya aittir.
- Yapay zekâ içerikleri, bildirim altyapısı verileri ve teknik hizmet kayıtları ilgili sağlayıcının yürürlükteki şartlarında belirtilen sürelerle tutulabilir.
- Hukuki bir zorunluluk, güvenlik olayı veya uyuşmazlık varsa yalnızca gerekli kayıtlar, amaçla sınırlı süre boyunca saklanabilir.

Saklama amacı sona erdiğinde veriler silinir, yok edilir veya uygulanabilir mevzuata uygun biçimde anonim hâle getirilir.

## 10. Hesap ve veri silme

Hesabınızı **Ayarlar > Hesap Ayarları > Hesabı Sil** yolundan silebilirsiniz. Başarılı silme işlemi Firebase Authentication hesabını, kullanıcı profilini, abonelikleri, kart etiketlerini ve bu cihazdaki uygulama önbellek/tercihlerini silmeyi hedefler.

Uygulama içi silme işlemini tamamlayamazsanız [doganaslandevelopment@gmail.com](mailto:doganaslandevelopment@gmail.com) adresine hesabınızda kullandığınız e-postadan talep gönderebilirsiniz. Kimlik doğrulamasından sonra hesapla ilişkilendirilebilir veriler silinir; sağlayıcıların güvenlik kayıtları, yedeklerden silme döngüleri ve kanunen tutulması zorunlu kayıtlar kendi sürelerine tabi olabilir. Dışa aktardığınız dosyalar ve WhatsApp gibi üçüncü taraflara kendi isteğinizle gönderdiğiniz içerikler bu işlemle silinmez.

## 11. Haklarınız

KVKK'nın 11. maddesi ve uygulanabildiği ölçüde GDPR uyarınca; verilerinizin işlenip işlenmediğini öğrenme, bilgi ve kopya talep etme, amacına uygun kullanılıp kullanılmadığını öğrenme, alıcıları bilme, düzeltme, silme/yok etme, işlemeyi kısıtlama veya itiraz etme, veri taşınabilirliği ve kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme haklarına sahip olabilirsiniz.

Talebinizi [doganaslandevelopment@gmail.com](mailto:doganaslandevelopment@gmail.com) adresine iletebilirsiniz. Başvurular uygulanabilir mevzuattaki süreler içinde yanıtlanır. Ayrıca Kişisel Verileri Koruma Kurumuna veya bulunduğunuz yerdeki yetkili veri koruma makamına şikâyet hakkınız olabilir.

## 12. Güvenlik

Aktarım sırasında HTTPS, Firebase erişim kontrolleri, hesap doğrulama ve cihazın güvenlik özellikleri gibi makul teknik ve idari tedbirlerden yararlanırız. Bununla birlikte hiçbir internet veya elektronik depolama yöntemi yüzde yüz güvenli değildir. Güçlü ve benzersiz bir parola kullanın, cihazınızı koruyun ve hesabınızda şüpheli etkinlik görürseniz bize bildirin.

## 13. Çocukların gizliliği

SubMate 18 yaşından küçük çocuklara yönelik değildir. 18 yaşından küçük bir kişiye ait verinin hukuka aykırı biçimde işlendiğini düşünüyorsanız bizimle iletişime geçin; doğrulama sonrasında gerekli silme işlemlerini yaparız.

## 14. Değişiklikler

Uygulamanın özellikleri, hizmet sağlayıcıları veya mevzuat değişirse bu politika güncellenebilir. Önemli değişiklikler yürürlüğe girmeden önce, makul olduğu ölçüde uygulama içinde veya uygun başka bir yöntemle bildirilir. Güncel sürümdeki tarih her değişiklikte yenilenir.

## 15. İletişim

Bu politika veya kişisel verileriniz hakkında:  
**Doğan Aslan — SubMate**  
[doganaslandevelopment@gmail.com](mailto:doganaslandevelopment@gmail.com)`,

  en: `# SubMate Privacy Policy

**Last updated: 18 August 2026**

This Privacy Policy explains how personal data is handled in the SubMate mobile and web application provided by Doğan Aslan. It is intended to provide clear information in line with the Turkish Personal Data Protection Law No. 6698 (KVKK), the GDPR where applicable, and app-store transparency requirements.

Please read this policy before using SubMate. Using an optional feature initiates only the processing described as necessary for that feature.

## 1. Data controller and contact

**Data controller:** Doğan Aslan — developer of SubMate  
**Contact:** [doganaslandevelopment@gmail.com](mailto:doganaslandevelopment@gmail.com)

When making a privacy request, state the email address used for your account and clearly describe your request. We may need to verify your identity or account ownership to protect your information.

## 2. Data we process

Depending on the features you use, SubMate may process:

- **Account and authentication data:** Firebase user ID, email address, display name, profile image, sign-in method, and account creation/update timestamps. Your password is handled by Firebase Authentication; the developer cannot view it in plain text.
- **Subscription and budgeting data:** Service name, category, amount, currency, billing cycle, renewal and contract dates, trial or pause status, reminder preference, usage frequency, notes, and price history.
- **Payment-method labels:** A name you assign to a card, card type, last four digits only, expiry month/year, currency, and an optional spending limit. SubMate does not request or process full card numbers, CVV/CVC codes, banking passwords, or actual bank transaction history.
- **Cost-sharing data:** If you use splitting features, the other person's name, phone number, share amount, and payment status. You must only add another person's information when you have permission or another valid legal basis to do so.
- **Preferences and on-device data:** Language, theme, biometric-lock preference, notification settings, budget goals, payment history, widget data, exchange-rate cache, and other local settings needed to operate the app.
- **Notification data:** Notification permission, scheduled local reminders, and a device/app notification token. Reminders may display payment or renewal details on your device.
- **AI data:** When you use AI chat, your message, relevant conversation context, and the subscription summary needed to personalize the answer are sent to the Google Gemini Developer API. When you choose receipt scanning, only the image you select is sent to Gemini for analysis. Do not include unnecessary personal, confidential, health, identity, or complete payment-card information in AI prompts or receipt images.
- **Technical request and error data:** When connecting to Firebase, Google, Expo, Sentry, or exchange-rate services, providers may process IP address, device/app identifiers, operating system, app version, request time, and security or operational logs. If Sentry is enabled, default PII collection is disabled and free-form breadcrumb data is removed.

## 3. How we collect data

You provide most data directly when creating an account or using subscription, card-label, profile, AI, and cost-sharing features. Some technical information is generated automatically when the app connects to service providers. Device permissions, including photo library, notifications, and biometrics, are requested by the operating system only when relevant to a feature you choose to use.

## 4. Purposes and legal bases

We process data for the following purposes and, where applicable, legal bases:

- **Performance of a contract** to create and authenticate your account, synchronize subscriptions and card labels, schedule reminders, and provide core features.
- **Legitimate interests** that do not override your fundamental rights, including securing the service, preventing abuse, fixing errors, and improving reliability.
- **Consent or device permission**, where legally required, for optional features such as notifications, photo access, or AI processing.
- **Compliance with legal obligations** and valid requests from competent authorities.

You may withdraw a permission or consent through your device or app settings. Withdrawal does not affect prior lawful processing, but the relevant feature may stop working.

## 5. Where data is stored

- **On your device:** Preferences, caches, scheduled notifications, and certain usage records are stored locally. Uninstalling the app may remove on-device data but does not automatically delete data synchronized to the cloud.
- **Google Firebase:** Account information is stored in Firebase Authentication, while profile, subscription, and card-label records are stored in Cloud Firestore. Firestore may keep a local cache for offline use.
- **Google Gemini:** When you use AI features, prompts, required subscription context, selected receipt images, and generated responses are processed under Google's current Gemini API terms. Whether Google may use content to improve products and how long it retains that content can vary depending on the developer project's paid or unpaid service status and Google's current terms. Do not send sensitive or unnecessary personal information to AI features.

SubMate does not sell or rent your personal data, show third-party behavioural advertising, or build advertising profiles.

## 6. Service providers and third parties

Data may be disclosed only as needed to operate a selected feature:

- **Google Firebase:** Authentication, account management, and cloud data storage.
- **Google Gemini Developer API:** User-initiated AI chat and receipt analysis.
- **Expo and operating-system providers:** Notification-token generation, local notifications, permissions, and platform services.
- **Sentry:** If enabled, error records and limited performance diagnostics designed not to include personal data.
- **ExchangeRate-API (open.er-api.com):** The selected base currency and technical request information naturally generated by the connection.
- **Google Sign-In:** Google account authentication when you choose this sign-in method.
- **WhatsApp:** If you choose to send a shared-payment reminder, the recipient name and number, subscription name, and share amount appear in the message forwarded to WhatsApp. WhatsApp's own terms and privacy policy apply after you proceed.
- **Competent authorities:** Where disclosure is required by a valid and binding legal request.

These providers maintain their own terms and privacy practices. SubMate does not control their independent processing activities.

## 7. International data transfers

Firebase Authentication is operated from United States data centres, while other Firebase services, Gemini, and Expo may use global provider infrastructure. Account data, app records, or content submitted to AI may therefore be processed outside Türkiye or your country of residence. Transfers are subject to applicable transfer rules and the data-protection mechanisms in the relevant provider agreements. If the law requires additional notice, consent, or safeguards, those processes will be updated accordingly.

## 8. Biometrics and device permissions

On supported devices, Face ID, Touch ID, or fingerprint verification occurs within the operating system's protected environment. SubMate does not access, copy, or transmit your biometric template; it receives only an authentication success or failure result. Biometric protection may be unavailable on unsupported platforms.

Photo and notification permissions are optional. You can disable them in device settings, in which case receipt scanning or reminders may no longer work.

## 9. Retention

- Account, profile, subscription, and card-label data is kept while your account is active or until you delete it.
- Local preferences and caches may remain until account deletion, clearing app data, or uninstalling the app.
- JSON or CSV files you export remain wherever you save them; you are responsible for securing and deleting those copies.
- AI content, notification-infrastructure data, and technical service records may be retained for the periods stated in each provider's current terms.
- If necessary for a legal obligation, security incident, or dispute, limited records may be retained only for the required period.

When retention is no longer necessary, data is deleted, destroyed, or anonymized in accordance with applicable law.

## 10. Account and data deletion

You can delete your account through **Settings > Account Settings > Delete Account**. A successful deletion is designed to remove your Firebase Authentication account, user profile, subscriptions, card labels, and app caches/preferences on that device.

If you cannot complete in-app deletion, email [doganaslandevelopment@gmail.com](mailto:doganaslandevelopment@gmail.com) from the address associated with your account. After verification, data linkable to the account will be deleted, subject to provider security logs, backup-deletion cycles, and records that must be retained by law. Exported files and content you voluntarily sent to third parties such as WhatsApp are not deleted through this process.

## 11. Your rights

Under Article 11 of the KVKK and the GDPR where applicable, you may have rights to know whether your data is processed; obtain information or a copy; learn the purpose and recipients; request correction, deletion, destruction, restriction, or portability; object to certain processing; and seek compensation for unlawful processing.

Send requests to [doganaslandevelopment@gmail.com](mailto:doganaslandevelopment@gmail.com). Requests will be handled within the period required by applicable law. You may also have the right to complain to the Turkish Personal Data Protection Authority or your local supervisory authority.

## 12. Security

We use reasonable technical and organizational measures such as HTTPS in transit, Firebase access controls, account authentication, and device security features. No internet transmission or electronic storage method is completely secure. Use a strong, unique password, protect your device, and contact us if you notice suspicious account activity.

## 13. Children's privacy

SubMate is not directed to children under 18. If you believe a minor's data has been processed unlawfully, contact us. Following verification, we will take appropriate deletion steps.

## 14. Changes to this policy

We may update this policy when app features, service providers, or laws change. Where reasonably possible, material changes will be communicated in the app or by another appropriate method before they take effect. The date above will be updated with each revision.

## 15. Contact

For questions about this policy or your personal data:  
**Doğan Aslan — SubMate**  
[doganaslandevelopment@gmail.com](mailto:doganaslandevelopment@gmail.com)`,
};

export const termsPolicies: Record<string, string> = {
  tr: `# SubMate Kullanım Koşulları

**Yürürlük tarihi: 18 Ağustos 2026**

Bu Kullanım Koşulları, Doğan Aslan tarafından sunulan SubMate mobil ve web uygulamasını kullanımınızı düzenler. Hesap oluşturarak veya SubMate'i kullanarak bu Koşulları ve Gizlilik Politikasını okuduğunuzu ve kabul ettiğinizi belirtirsiniz. Kabul etmiyorsanız uygulamayı kullanmayın.

## 1. Hizmetin kapsamı

SubMate; kullanıcıların aboneliklerini, yinelenen giderlerini, yenilenme tarihlerini, kart etiketlerini, bütçe hedeflerini ve paylaşılmış ödeme notlarını düzenlemesine yardımcı olan bağımsız bir takip ve planlama aracıdır.

SubMate:

- Banka, ödeme kuruluşu, abonelik sağlayıcısı veya sigorta/finans kurumu değildir.
- Banka hesabınıza bağlanmaz; ödeme yapmaz, para transfer etmez veya kartınızdan ücret çekmez.
- Bir aboneliği sizin adınıza başlatmaz, durdurmaz, değiştirmez veya iptal etmez.
- Uygulamada bir kaydı silmeniz gerçek satıcıdaki aboneliği iptal etmez.

Gerçek bir aboneliği sonlandırmak için ilgili sağlayıcının, uygulama mağazasının veya ödeme kuruluşunun iptal adımlarını tamamlamalısınız.

## 2. Uygunluk

SubMate 18 yaş ve üzeri kullanıcılar içindir. Uygulamayı kullanarak bağlayıcı bir sözleşme yapma ehliyetiniz olduğunu beyan edersiniz. Bir kurum veya başka bir kişi adına kullanıyorsanız onu bu Koşullara bağlama yetkinizin bulunduğunu kabul edersiniz.

## 3. Hesap ve güvenlik

Kayıt sırasında doğru ve güncel bilgi vermeli, giriş bilgilerinizi gizli tutmalı ve hesabınız altında gerçekleşen işlemler için makul güvenlik önlemleri almalısınız. Şüpheli erişim fark ederseniz parolanızı değiştirin ve [doganaslandevelopment@gmail.com](mailto:doganaslandevelopment@gmail.com) adresinden bize bildirin.

Google ile giriş gibi üçüncü taraf kimlik doğrulama yöntemlerinde ilgili sağlayıcının koşulları da geçerlidir. Hesabınızı başkasına devredemez veya yetkisiz erişime açamazsınız.

## 4. Kullanıcı verileri ve sorumluluğu

Uygulamaya girdiğiniz abonelik, kart etiketi, bütçe, not, profil ve paylaşım bilgilerinin sahibi sizsiniz. SubMate'e yalnızca hizmeti çalıştırmak, senkronize etmek, görüntülemek, yedeklemek ve seçtiğiniz özellikleri sunmak için gerekli, sınırlı bir işleme izni verirsiniz.

Girdiğiniz bilgilerin doğruluğundan, güncelliğinden ve bunları işleme hakkına sahip olmanızdan siz sorumlusunuz. Başka kişilerin adını veya telefon numarasını paylaşım özelliğine eklemeden önce gerekli izni veya hukuki dayanağı edinmelisiniz. Tam kart numarası, CVV/CVC, banka parolası, kimlik belgesi, sağlık verisi veya gereksiz hassas bilgileri uygulamaya girmeyin.

## 5. Yapay zekâ özellikleri

Yapay zekâ sohbeti ve fatura tarama özellikleri Google Gemini Developer API'den yararlanır. Bu özellikleri başlattığınızda yazdığınız istemler, gerekli abonelik özeti veya seçtiğiniz fatura görseli Google'a gönderilebilir.

Yapay zekâ çıktıları otomatik üretilir; eksik, eski, hatalı veya uygun olmayan bilgi içerebilir. Çıktılar **finansal, yatırım, vergi, hukuk, muhasebe veya tüketici danışmanlığı değildir** ve profesyonel görüş yerine kullanılamaz. Fiyatları, kampanyaları, sözleşme şartlarını ve iptal adımlarını ilgili hizmet sağlayıcısından doğrulayın. Önemli kararlar için yetkili bir uzmana danışın.

Yapay zekâya hassas, gizli veya üçüncü kişilere ait gereksiz bilgi göndermemek kullanıcının sorumluluğundadır.

## 6. Tahminler, döviz kurları ve bildirimler

Bütçe toplamları, tasarruf önerileri, fiyat tahminleri, sağlık puanları, döviz çevrimleri ve benzeri sonuçlar kullanıcı girdileri ile üçüncü taraf verilerine dayanan yaklaşık bilgilerdir. Güncel veya hatasız oldukları garanti edilmez.

Bildirimler; cihaz ayarları, işletim sistemi kısıtlamaları, pil optimizasyonu, internet bağlantısı veya hatalı kullanıcı verisi nedeniyle gecikebilir ya da hiç görünmeyebilir. Yenileme, deneme süresi, sözleşme bitişi ve ödeme tarihlerini ayrıca kendiniz takip etmelisiniz. Kaçırılan bildirim, otomatik yenileme veya üçüncü taraf ücretlerinden SubMate sorumlu değildir; emredici tüketici haklarınız saklıdır.

## 7. Kart etiketleri ve paylaşılan ödemeler

Kart bölümü yalnızca abonelikleri kullanıcı tarafından verilen ödeme yöntemi etiketleriyle düzenler. SubMate ödeme işleyen bir cüzdan değildir ve kart doğrulaması yapmaz. Son dört hane gibi alanlar yalnızca ayırt etme amacı taşır.

Masraf bölüşme ve WhatsApp hatırlatıcıları muhasebe veya tahsilat hizmeti değildir. Gönderilmeden önce mesajı ve alıcıyı kontrol etmelisiniz. Taraflar arasındaki borç, ödeme veya uyuşmazlıklardan ilgili kişiler sorumludur.

## 8. Kabul edilebilir kullanım

Şunları yapamazsınız:

- Uygulamayı hukuka aykırı, yanıltıcı, dolandırıcılık amaçlı veya başkalarının haklarını ihlal edecek şekilde kullanmak.
- Başka bir kişinin hesabına, verisine veya cihazına izinsiz erişmek ya da erişmeye çalışmak.
- Uygulamanın güvenliğini, altyapısını veya çalışmasını bozmak; zararlı kod göndermek; makul olmayan otomatik trafik üretmek.
- Kanunen izin verilen hâller dışında kaynak kodu tersine mühendislik, kopyalama, yeniden satma veya türev hizmet oluşturma amacıyla kullanmak.
- Yapay zekâ özelliklerini zararlı, yasa dışı veya üçüncü taraf hizmet koşullarını ihlal eden içerik üretmek için kullanmak.

## 9. Fikri mülkiyet

SubMate adı, logosu, arayüzü, tasarımı, yazılımı ve uygulama tarafından sağlanan özgün içerik; Doğan Aslan'a veya ilgili lisans verenlere aittir. Size yalnızca bu Koşullara uygun, kişisel, sınırlı, geri alınabilir, devredilemez ve münhasır olmayan kullanım hakkı verilir. Kullanıcı tarafından girilen veriler üzerindeki haklar kullanıcıda kalır.

Üçüncü taraf marka ve hizmet adları ilgili sahiplerine aittir. Uygulamada görünmeleri sponsorluk, ortaklık veya onay anlamına gelmez.

## 10. Üçüncü taraf hizmetler ve bağlantılar

SubMate; Firebase, Gemini, Google ile giriş, Expo, döviz kuru hizmetleri, WhatsApp ve cihaz işletim sistemi özellikleri gibi üçüncü taraf hizmetlerden yararlanabilir veya bunlara bağlantı açabilir. Bu hizmetlerin kullanılabilirliği, doğruluğu, güvenliği ve veri uygulamaları kendi sağlayıcılarının koşullarına tabidir. Üçüncü taraf hizmetlerdeki değişiklik veya kesinti bazı SubMate özelliklerini etkileyebilir.

## 11. Hizmet değişiklikleri ve kullanılabilirlik

Uygulamayı geliştirmek, güvenliği sağlamak, mevzuata uymak veya kullanılmayan özellikleri kaldırmak için özellikleri değiştirebilir, askıya alabilir ya da sonlandırabiliriz. Makul olduğu ölçüde önemli değişiklikleri önceden duyurmaya çalışırız. Belirli bir özelliğin veya verinin sürekli, kesintisiz, hatasız ya da her cihazla uyumlu olacağı taahhüt edilmez.

Verilerinizin dışa aktarma özelliğini kullanarak düzenli kopyasını almak sizin sorumluluğunuzdadır. Dışa aktarılan dosyaları güvenli bir yerde saklayın.

## 12. Hesabın askıya alınması ve sona erme

Bu Koşulları veya hukuku ciddi biçimde ihlal etmeniz, güvenlik riski oluşturmanız ya da hizmeti kötüye kullanmanız hâlinde, uygulanabilir mevzuatın izin verdiği ölçüde erişiminiz sınırlandırılabilir veya hesabınız askıya alınabilir. Mümkün ve uygun olduğunda önceden bildirim yapılır.

Hesabınızı **Ayarlar > Hesap Ayarları > Hesabı Sil** yolundan silebilirsiniz. Silme işleminin kapsamı Gizlilik Politikasında açıklanır. Uygulamanın kaldırılması tek başına bulut hesabını silmez.

## 13. Garanti reddi

SubMate, emredici hukukta aksi öngörülmedikçe, “olduğu gibi” ve “mevcut olduğu ölçüde” sunulur. Uygulamanın tüm ihtiyaçlarınızı karşılayacağı, her hesaplamanın doğru olacağı, hataların anında düzeltileceği veya hizmetin kesintisiz çalışacağı garanti edilmez.

Bu hüküm; kanunen vazgeçilemeyen tüketici haklarını, açıkça verdiğimiz taahhütleri veya uygulanabilir zorunlu garantileri ortadan kaldırmaz.

## 14. Sorumluluğun sınırı

Uygulanabilir hukukun izin verdiği azami ölçüde SubMate ve geliştiricisi; kullanıcının yanlış/eksik girdisi, üçüncü taraf hizmet kesintisi, cihaz veya bildirim sorunu, yapay zekâ çıktısına güvenme, gerçek aboneliğin ayrıca iptal edilmemesi ya da kullanıcının dışa aktardığı dosyaları korumaması nedeniyle doğan dolaylı veya öngörülemeyen kayıplardan sorumlu tutulamaz.

Hiçbir hüküm; kasıt veya ağır ihmalden doğan sorumluluğu, ölüm veya bedensel zarara ilişkin kanunen sınırlandırılamayan sorumluluğu ya da emredici tüketici ve kişisel veri haklarını kaldırmaz. Bulunduğunuz hukuk düzeni bazı sınırlamalara izin vermiyorsa ilgili hüküm yalnızca izin verilen ölçüde uygulanır.

## 15. Gizlilik

Kişisel verilerin işlenmesi, saklanması, aktarılması ve silinmesi Gizlilik Politikasında açıklanır. Bu Koşullar ile Gizlilik Politikası arasında kişisel veri işlemesi bakımından çelişki olursa Gizlilik Politikası esas alınır.

## 16. Koşulların değişmesi

Mevzuat, özellikler veya hizmet sağlayıcıları değiştiğinde bu Koşullar güncellenebilir. Esaslı değişiklikler için, makul olduğu ölçüde yürürlükten önce uygulama içi veya başka uygun bir bildirim sunulur. Değişiklikten sonra uygulamayı kullanmaya devam etmeniz, emredici hukukta ek onay gerekmediği ölçüde güncel Koşulları kabul ettiğiniz anlamına gelir.

## 17. Uygulanacak hukuk ve uyuşmazlıklar

Bu Koşullar, kanunlar ihtilafı kuralları saklı kalmak üzere Türkiye Cumhuriyeti hukukuna tabidir. Tüketici işlemlerinde, tüketicinin yerleşim yerindeki tüketici hakem heyetleri ve tüketici mahkemeleri dahil emredici görev ve yetki kuralları saklıdır. Bu Koşullar kanunen sahip olduğunuz zorunlu başvuru yollarını sınırlandırmaz.

## 18. Bölünebilirlik ve feragat etmeme

Bir hükmün geçersiz veya uygulanamaz olması diğer hükümlerin geçerliliğini etkilemez; geçersiz hüküm amacına en yakın ve hukuken uygulanabilir kapsamda yorumlanır. Bir hakkın hemen kullanılmaması o haktan vazgeçildiği anlamına gelmez.

## 19. İletişim

Bu Koşullar hakkındaki sorularınız için:  
**Doğan Aslan — SubMate**  
[doganaslandevelopment@gmail.com](mailto:doganaslandevelopment@gmail.com)`,

  en: `# SubMate Terms of Use

**Effective date: 18 August 2026**

These Terms of Use govern your use of the SubMate mobile and web application provided by Doğan Aslan. By creating an account or using SubMate, you acknowledge that you have read and accepted these Terms and the Privacy Policy. If you do not agree, do not use the app.

## 1. Scope of the service

SubMate is an independent tracking and planning tool that helps users organize subscriptions, recurring expenses, renewal dates, payment-card labels, budget goals, and shared-payment notes.

SubMate:

- Is not a bank, payment institution, subscription provider, insurer, or financial institution.
- Does not connect to your bank account, make payments, transfer money, or charge your card.
- Does not start, pause, change, or cancel a third-party subscription on your behalf.
- Does not cancel a real subscription when you delete a record inside the app.

To end a real subscription, you must complete the cancellation steps provided by the relevant merchant, app store, or payment provider.

## 2. Eligibility

SubMate is intended for users aged 18 or older. By using the app, you represent that you have the legal capacity to enter into a binding agreement. If you use SubMate for an organization or another person, you represent that you are authorized to bind them to these Terms.

## 3. Account and security

You must provide accurate and current registration information, keep your credentials confidential, and take reasonable security measures for activity under your account. If you suspect unauthorized access, change your password and notify us at [doganaslandevelopment@gmail.com](mailto:doganaslandevelopment@gmail.com).

Third-party authentication methods such as Google Sign-In are also subject to the provider's terms. You may not transfer your account or knowingly allow unauthorized access.

## 4. User data and responsibility

You retain ownership of subscription, card-label, budget, note, profile, and cost-sharing information you enter. You grant SubMate a limited permission to process that information only as needed to operate, synchronize, display, back up, and provide the features you select.

You are responsible for the accuracy and legality of information you enter. Before adding another person's name or phone number to a sharing feature, you must have permission or another valid legal basis. Do not enter full card numbers, CVV/CVC codes, banking passwords, identity documents, health data, or unnecessary sensitive information.

## 5. Artificial-intelligence features

AI chat and receipt scanning use the Google Gemini Developer API. When you initiate these features, your prompts, the subscription summary required for the response, or the receipt image you select may be sent to Google.

AI outputs are automatically generated and may be incomplete, outdated, inaccurate, or unsuitable. They are **not financial, investment, tax, legal, accounting, or consumer advice** and must not replace professional advice. Verify prices, promotions, contract terms, and cancellation steps with the relevant provider. Consult a qualified professional before making an important decision.

You are responsible for avoiding sensitive, confidential, or unnecessary third-party information in AI inputs.

## 6. Estimates, exchange rates, and notifications

Budget totals, savings suggestions, price forecasts, health scores, currency conversions, and similar results are estimates based on user input and third-party data. They are not guaranteed to be current or error-free.

Notifications may be delayed or fail because of device settings, operating-system restrictions, battery optimization, connectivity, or inaccurate user data. You must independently monitor renewal, trial, contract, and payment dates. Subject to mandatory consumer rights, SubMate is not responsible for missed notifications, automatic renewals, or third-party charges.

## 7. Card labels and shared payments

The card section only organizes subscriptions using labels supplied by the user. SubMate is not a payment-processing wallet and does not verify cards. Fields such as the last four digits are for identification only.

Cost splitting and WhatsApp reminders are not accounting, collection, or payment services. Review the recipient and message before sending. The relevant individuals remain responsible for debts, payments, and disputes between them.

## 8. Acceptable use

You must not:

- Use the app unlawfully, deceptively, fraudulently, or in a way that infringes another person's rights.
- Access or attempt to access another person's account, data, or device without authorization.
- Disrupt the app's security, infrastructure, or operation; transmit malicious code; or generate unreasonable automated traffic.
- Reverse engineer, copy, resell, or create derivative services from the source code except where applicable law expressly permits it.
- Use AI features to create harmful or illegal content or to violate third-party service terms.

## 9. Intellectual property

The SubMate name, logo, interface, design, software, and original app content belong to Doğan Aslan or the relevant licensors. You receive only a personal, limited, revocable, non-transferable, and non-exclusive right to use the app in accordance with these Terms. User-entered data remains owned by the user.

Third-party trademarks and service names belong to their respective owners. Their appearance in the app does not imply sponsorship, partnership, or endorsement.

## 10. Third-party services and links

SubMate may use or open third-party services such as Firebase, Gemini, Google Sign-In, Expo, exchange-rate services, WhatsApp, and operating-system features. Their availability, accuracy, security, and data practices are governed by their own terms. Changes or interruptions to a third-party service may affect SubMate features.

## 11. Service changes and availability

We may change, suspend, or discontinue features to improve the app, maintain security, comply with law, or remove unused functionality. Where reasonable, we will try to give notice of material changes. We do not promise that a particular feature or item of data will always be available, uninterrupted, error-free, or compatible with every device.

You are responsible for using the export feature to keep copies of data important to you and for securing exported files.

## 12. Suspension and termination

To the extent permitted by applicable law, access may be restricted or suspended if you materially breach these Terms or applicable law, create a security risk, or abuse the service. Where possible and appropriate, notice will be provided.

You can delete your account through **Settings > Account Settings > Delete Account**. The Privacy Policy explains the scope of deletion. Uninstalling the app alone does not delete a cloud account.

## 13. Disclaimer of warranties

Except where mandatory law provides otherwise, SubMate is provided “as is” and “as available.” We do not warrant that the app will meet every need, every calculation will be accurate, errors will be corrected immediately, or the service will operate without interruption.

This section does not remove non-waivable consumer rights, any express promise we make, or warranties required by applicable law.

## 14. Limitation of liability

To the maximum extent permitted by law, SubMate and its developer are not liable for indirect or unforeseeable losses caused by inaccurate or incomplete user input, a third-party outage, device or notification failure, reliance on AI output, failure to cancel a real subscription separately, or failure to protect an exported file.

Nothing in these Terms excludes liability for fraud, wilful misconduct, gross negligence where it cannot be limited, death or personal injury where limitation is prohibited, or mandatory consumer and data-protection rights. If your jurisdiction does not permit a limitation, it applies only to the extent legally allowed.

## 15. Privacy

The Privacy Policy explains how personal data is processed, stored, transferred, and deleted. If these Terms conflict with the Privacy Policy concerning personal-data processing, the Privacy Policy controls.

## 16. Changes to these Terms

We may update these Terms when laws, features, or service providers change. Where reasonably possible, material changes will be communicated in the app or by another appropriate method before taking effect. Continued use after a change constitutes acceptance only to the extent additional consent is not required by mandatory law.

## 17. Governing law and disputes

These Terms are governed by the laws of the Republic of Türkiye, subject to applicable conflict-of-law rules. Mandatory consumer jurisdiction and remedies, including the competent consumer arbitration committee or consumer court at the consumer's place of residence where applicable, remain available. These Terms do not restrict any mandatory legal remedy.

## 18. Severability and no waiver

If a provision is invalid or unenforceable, the remaining provisions continue in effect, and the affected provision will be interpreted to the closest lawful extent. A delay in enforcing a right is not a waiver of that right.

## 19. Contact

For questions about these Terms:  
**Doğan Aslan — SubMate**  
[doganaslandevelopment@gmail.com](mailto:doganaslandevelopment@gmail.com)`,
};
