# SubMate Uygulama Rehberi

## 1. Giriş
**SubMate**, modern kullanıcıların giderek artan dijital aboneliklerini tek bir merkezden kolayca takip etmelerini, bütçelerini yönetmelerini ve gereksiz harcamaları tespit etmelerini sağlayan gelişmiş bir finansal takip uygulamasıdır. Kullanıcı dostu arayüzü, şık tasarımı ve akıllı bildirim sistemi ile kişisel finans yönetimini eğlenceli ve zahmetsiz hale getirir.

## 2. Temel Özellikler

### 2.1. Kapsamlı Gösterge Paneli (Dashboard)
Uygulamanın ana ekranı, finansal durumunuzun anlık bir özetini sunar. 
- **Finansal Sağlık Skoru:** Abonelik harcamalarınızın gelirinize veya ideal bütçenize oranını gösteren, renk kodlu (Yeşil, Sarı, Kırmızı) bir sağlık göstergesi.
- **Vampir Abonelik Tespiti (Vampire Alert):** Kullanılmayan veya aynı kategoride birbirinin kopyası olan hizmetleri (Örn: Hem Netflix hem de Prime Video) tespit ederek uyarı verir.
- **Kur Riski Analizi (Currency Risk):** Yabancı para birimi ile ödenen aboneliklerin kur dalgalanmalarından ne kadar etkilenebileceğini gösterir.

### 2.2. Abonelik Yönetimi
- **Kolay Ekleme:** Önceden tanımlı yüzlerce popüler servis (Netflix, Spotify, Adobe vb.) arasından seçim yapabilir veya tamamen özel bir abonelik ekleyebilirsiniz.
- **Akıllı Kategorizasyon:** Eğlence, Eğitim, Yazılım, Sağlık gibi kategorilerle harcamalarınızı gruplandırabilirsiniz.
- **Döviz Çevirici:** Harcamalarınız hangi para biriminde olursa olsun (USD, EUR, GBP), hepsini tek bir ana para biriminde (örn: TRY) görebilirsiniz. Kurlar günlük olarak güncellenir.

### 2.3. Cüzdan ve Kart Yönetimi
- Birden fazla ödeme yöntemini (Kredi Kartı, Banka Kartı, Sanal Kart) uygulamaya ekleyebilirsiniz.
- Hangi aboneliğin hangi karttan çekileceğini belirleyebilir, kart limitlerinizi veya sanal kartlarınızın kullanımını kolayca takip edebilirsiniz.

### 2.4. Takvim ve Hatırlatıcılar
- **Ödeme Takvimi:** Hangi gün hangi aboneliğin yenileneceğini interaktif bir takvim üzerinden görebilirsiniz.
- **Bildirimler:** Yenileme tarihinden önce bildirim alarak sürpriz ödemelerin önüne geçebilirsiniz. Deneme sürümü (Free Trial) bitiş hatırlatıcıları ile istenmeyen kart çekimlerini durdurabilirsiniz.

### 2.5. Veri Güvenliği ve Gizlilik (Sovereign Vault)
- **Cihaz İçi Şifreleme:** Verileriniz güvendedir. Biyometrik doğrulama (Face ID / Touch ID) ile uygulamaya giriş yapabilirsiniz.
- **Veri Dışa/İçe Aktarma:** Kendi verinizin sahibi sizsiniz. Tüm finansal kayıtlarınızı `.json` formatında yedekleyebilir veya başka bir cihaza taşıyabilirsiniz.

## 3. Kullanım Akışı

1. **Kayıt ve Tanıtım (Onboarding):** Uygulamayı ilk indirdiğinizde sizi şık bir tanıtım ekranı karşılar. Burada uygulamanın sunduğu özellikleri öğrenip ana sayfaya geçiş yaparsınız.
2. **İlk Aboneliği Ekleme:** Alt menüden "Subscriptions" (Abonelikler) sekmesine gidip sağ alt köşedeki **"+"** butonuna basarak ilk aboneliğinizi ekleyebilirsiniz.
3. **Ödeme Yöntemi Ekleme:** "Wallet" (Cüzdan) sekmesinden kullandığınız banka kartlarını uygulamaya tanıtabilirsiniz. (Gerçek kart numarası girilmez, sadece isim ve son 4 hane gibi takip amaçlı bilgiler istenir).
4. **Analiz ve İnceleme:** Eklediğiniz abonelikler zamanla "Dashboard" ekranında akıllı analizlere tabi tutulur. Böylece gereksiz harcamalarınızı keserek tasarruf edebilirsiniz.

## 4. Teknik Altyapı ve Performans
- **React Native & Expo:** Hem iOS hem de Android cihazlarda tam uyumlu, %100 yerel (native) hissiyatı veren akıcı performans.
- **Zustand:** Uygulama içi durum yönetimi (state management) ile ışık hızında sayfa geçişleri.
- **Güvenli Alan (Safe Area) Uyumu:** Çentikli telefonlar ve iPhone kamera adalarına tam uyumlu estetik kenar boşlukları.

SubMate, finansal özgürlüğe giden yolda gereksiz harcamalarınızı budayan ve paranızın kontrolünü tamamen size veren en iyi dijital asistanınızdır.


