const fs = require('fs');
const path = require('path');
const translate = require('google-translate-api-x');

const privacyPolicyTR = `SubMate olarak kişisel ve finansal verilerinizin mahremiyetine büyük önem veriyoruz. Bu Kapsamlı Gizlilik Politikası, Uygulamamızı kullanırken hangi verilerin nasıl işlendiğini, saklandığını ve güvence altına alındığını hiçbir açık bırakmayacak şekilde açıklamaktadır.

1. Veri Toplamama İlkesi ve Sovereign Vault Sistemi
SubMate, mahremiyet odaklı bir yaklaşımla ("Privacy by Design") geliştirilmiştir. Bu doğrultuda temel prensibimiz şudur:
BİZ SİZİN VERİLERİNİZİ TOPLAMIYORUZ. UYGULAMAYA GİRDİĞİNİZ HİÇBİR ABONELİK BİLGİSİ, ÖDEME TUTARI VEYA CÜZDAN ETİKETİ ŞİRKETİMİZE AİT SUNUCULARA (CLOUD) GÖNDERİLMEZ VE KAYDEDİLMEZ.
Tüm verileriniz Cihaz İçi Şifreleme (On-Device Encryption) kullanılarak yalnızca kendi akıllı telefonunuzun yerel hafızasında saklanır. Bu nedenle, verilerinizin yetkisiz erişime uğraması, satılması veya sızdırılması tarafımızca teknik olarak imkansızdır.

2. İşlenen Veri Türleri ve Kapsamı
2.1. Finansal Veriler ve Abonelikler
Uygulamaya eklediğiniz abonelik isimleri (Netflix, Gym, Kira vb.), harcama kategorileri, tutarlar ve takvim bildirim tarihleri tamamen cihazınızın hafızasındadır. Şirketimiz, harcama alışkanlıklarınızla ilgili bir profil oluşturmaz.
2.2. Kredi Kartı ve Cüzdan Bilgileri
Uygulamanın "Cüzdan" bölümü, sadece bütçenizi zihninizde ayırmanıza yardımcı olan bir etiketleme sistemidir. Uygulama, geçerli bir 16 haneli kredi kartı numarasını, son kullanma tarihini (SKT) veya güvenlik kodunu (CVV/CVC) asla talep etmez, almaz ve saklamaz. Yalnızca kartlarınızı ayırt etmek için kendinizin belirlediği "İsim" (Örn: Maaş Kartım) ve hatırlatıcı 4 haneli rakamlar cihazda lokal olarak tutulur. Dolayısıyla uygulama, PCI-DSS (Ödeme Kartı Sektörü Veri Güvenliği Standardı) kapsamı dışındadır ve kart kopyalanması/çalınması gibi durumlarda hukuken taraf gösterilemez.

3. Cihaz İzinleri ve Biyometrik Doğrulama
Uygulamanın çalışabilmesi için işletim sisteminden bazı izinler talep edilebilir:
• Biyometrik Veriler (Face ID / Touch ID): Uygulama girişine şifre koymak isterseniz, doğrulama işlemi tamamen cihazınızın kendi güvenli ortamında (Secure Enclave) gerçekleşir. SubMate sizin parmak izinize veya yüz verinize asla erişemez, sadece işletim sisteminden "Doğrulandı" veya "Reddedildi" sinyalini alır.
• Bildirimler: Yaklaşan abonelik ödemelerini haber vermek içindir. Bildirim içeriklerinde hassas tutarlar gösterilmez.
• Depolama / Dosya Erişimi: Yalnızca verilerinizi JSON formatında dışa veya içe aktarmak (Export/Import) istediğinizde, dosyayı cihazınıza kaydetmek için kullanılır.

4. Üçüncü Taraf Entegrasyonları ve Veri Paylaşımı
SubMate, özelliklerini sunabilmek için dış kaynaklarla sınırlı iletişim kurar:
• Döviz Kurları API'si: Kur analizi yapmak için güncel kurları dış bir kaynaktan çeker. Bu sorgular anonimdir; sizin portföy büyüklüğünüz veya abonelikleriniz dış API'ye gönderilmez.
• Analitik ve Hata Ayıklama (Crashlytics vb.): Uygulamanın çökmesi durumunda, sorunu çözebilmek adına işletim sistemi sürümünüz ve cihaz modeliniz gibi tamamen anonimleştirilmiş teknik hata logları toplanabilir. Bu loglar hiçbir kişisel veya finansal veri içermez.

5. Veri Silme ve Taşıma Hakkı
Verileriniz sunucularımızda olmadığı için bize bir "hesap silme" veya "veri silme" talebi göndermenize gerek yoktur. SubMate uygulamasını cihazınızdan kaldırdığınız (Uninstall) anda, işletim sisteminiz tüm verilerinizi kalıcı ve geri döndürülemez biçimde silecektir. Verilerinizin kontrolü ve yedeği tamamen kullanıcının mesuliyetindedir.

6. Yaş Sınırı
SubMate, 18 yaş ve üzeri bireylerin kullanımı için tasarlanmıştır. Uygulama kişisel veri toplamadığı için çocukların verilerini kasıtlı olarak toplama gibi bir ihlal söz konusu olamaz.

7. Politika Güncellemeleri ve İletişim
Şirket, bu Gizlilik Politikasını herhangi bir zamanda güncelleme hakkını saklı tutar. Uygulama veri toplamadığı için, gizliliğinizle ilgili oluşabilecek her türlü soru ve teknik konu için mağaza (App Store / Play Store) iletişim kanalları üzerinden bize ulaşabilirsiniz.`;

const termsOfUseTR = `Lütfen SubMate ("Uygulama") mobil uygulamasını indirmeden, kurmadan veya kullanmadan önce bu Kullanım Koşulları sözleşmesini ("Sözleşme") dikkatlice okuyunuz. Bu Sözleşme, Uygulama'nın kullanımı ile ilgili olarak sizinle ("Kullanıcı") Uygulama geliştiricileri ("Şirket", "Biz" veya "Tarafımız") arasındaki hukuki olarak bağlayıcı tek anlaşmadır.

1. Hizmetin Doğası ve Kabulü
SubMate, kişisel dijital aboneliklerinizi takip etmeniz, bütçe yönetimi yapmanız ve yenileme tarihlerini kaydetmeniz için tasarlanmış bağımsız bir bilgi organizasyon aracıdır. Uygulamayı cihazınıza yükleyerek, bu Sözleşme'deki tüm şartları, feragatnameleri ve sorumluluk sınırlandırmalarını kayıtsız şartsız kabul etmiş olursunuz. Şartları kabul etmiyorsanız, Uygulamayı derhal cihazınızdan silmelisiniz.

2. Sorumluluk Reddi ve Hizmet Sınırlandırmaları (ÖNEMLİ)
SubMate bir finans kuruluşu, banka, ödeme geçidi, portföy yönetim şirketi veya mali danışman değildir. Uygulamanın kullanımı tamamen kendi riskiniz altındadır.

2.1. Finansal İşlemler ve İptaller
Uygulama üzerinden hiçbir şekilde gerçek bir ödeme işlemi yapılamaz, abonelik başlatılamaz veya mevcut bir abonelik iptal edilemez. SubMate, yalnızca kullanıcının manuel olarak girdiği verileri organize eder. Aboneliklerinizin zamanında iptal edilmesi, kredi kartı veya banka hesabınızdan çekilecek tutarların takibi ve üçüncü taraf hizmet sağlayıcılarla (Netflix, Spotify vb.) olan hukuki ilişkiniz tamamen sizin sorumluluğunuzdadır.

2.2. Bildirimler ve Anımsatıcılar Garantisi
HİÇBİR BİLDİRİMİN ZAMANINDA ULAŞACAĞI GARANTİ EDİLEMEZ. İŞLETİM SİSTEMLERİNİN (iOS/ANDROID) PİL TASARRUF MODLARI, ARKA PLAN KISITLAMALARI VEYA YAZILIMSAL HATALAR SEBEBİYLE UYGULAMA BİLDİRİMLERİNİN GÖSTERİLMEMESİ DURUMUNDA, İPTAL EDİLMEYİ UNUTULAN ABONELİKLERDEN DOĞACAK MADDİ ZARARLARDAN ŞİRKET KESİNLİKLE SORUMLU TUTULAMAZ.

2.3. Kur Riski ve Döviz Çevirici Doğruluğu
Uygulama içinde sunulan "Kur Riski Analizi" (Currency Risk) ve döviz çeviri özellikleri, üçüncü taraf API'lerden sağlanan anlık veya gecikmeli verilere dayanmaktadır. Kendi bankanızın uygulayacağı uluslararası işlem ücretleri, döviz makas aralıkları ve anlık kur dalgalanmaları nedeniyle ekranda görünen tutar ile ekstrenize yansıyan tutar arasında farklar oluşabilir. Uygulama bu tutarların %100 doğruluğunu taahhüt etmez.

2.4. "Vampir Abonelik" (Vampire Alert) ve Finansal Tavsiye
Vampir Abonelik Tespiti özelliği yalnızca basit bir algoritmik sınıflandırma yapar ve kullanıcının birbirine benzer veya atıl hizmetlere para ödediği konusunda bir tahmin sunar. Bu bir finansal tavsiye değildir. Herhangi bir aboneliği iptal etme kararı tamamen kullanıcının takdirindedir.

3. Veri Kaybı ve Yedekleme Sorumluluğu
SubMate, mahremiyetinizi korumak adına tüm verilerinizi cihazınızda yerel olarak saklar (Sovereign Vault). Uygulamanın bulut yedekleme altyapısı yoktur. Uygulamanın silinmesi, cihazın kaybolması, hasar görmesi veya işletim sistemi güncellemeleri sırasında oluşabilecek çökmeler sonucunda finansal takip verilerinizin kaybolmasından Şirket hiçbir şekilde sorumlu tutulamaz. Verilerin uygulamanın sunduğu dışa aktarma (JSON export) özelliği ile düzenli olarak yedeklenmesi tamamen Kullanıcının sorumluluğundadır.

4. Uygulamanın Kullanım Hakları ve Fikri Mülkiyet
SubMate'in tüm kod altyapısı (React Native & Expo mimarisi dâhil), arayüz tasarımları, logoları, algoritmaları ve metinleri Şirket'e aittir. Kullanıcıya yalnızca uygulamayı kişisel ve ticari olmayan amaçlarla kullanması için devredilemez, münhasır olmayan bir lisans verilir. Uygulamanın tersine mühendisliğe tabi tutulması, kopyalanması veya kaynak kodunun deşifre edilmeye çalışılması kesinlikle yasaktır.

5. "Olduğu Gibi" (As Is) Beyanı ve Tazminat
UYGULAMA, AÇIK VEYA ZIMNİ HİÇBİR GARANTİ OLMAKSIZIN "OLDUĞU GİBİ" VE "MEVCUT OLDUĞU ŞEKİLDE" SUNULMAKTADIR. ŞİRKET, TİCARİ ELVERİŞLİLİK, BELİRLİ BİR AMACA UYGUNLUK VEYA İHLAL ETMEME GARANTİLERİNİ AÇIKÇA REDDEDER. Kullanıcı, uygulamanın kullanımı sonucunda doğabilecek her türlü doğrudan, dolaylı, tesadüfi, özel veya cezai zararlardan Şirket'i, yöneticilerini, çalışanlarını ve iş ortaklarını gayrikabili rücu olarak ibra eder.

6. Uyuşmazlıkların Çözümü
Bu Sözleşme'den doğacak her türlü hukuki uyuşmazlığın çözümünde Türkiye Cumhuriyeti kanunları uygulanacaktır. Sözleşmenin herhangi bir maddesinin yetkili bir mahkeme tarafından geçersiz kılınması, diğer maddelerin geçerliliğini etkilemeyecektir.`;

const localesDir = path.join(__dirname, 'src', 'locales', 'translations');

async function main() {
  const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const langCode = file.replace('.json', '');
    const filePath = path.join(localesDir, file);
    
    console.log("Processing " + langCode + "...");
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Skip if already translated
    if (data.legal && data.legal.privacyPolicyContent && data.legal.termsOfUseContent) {
      console.log(langCode + " already has legal translations. Skipping.");
      continue;
    }

    if (!data.legal) {
      data.legal = {};
    }

    if (langCode === 'tr') {
      data.legal.privacyPolicy = 'Gizlilik Politikası';
      data.legal.termsOfUse = 'Kullanım Koşulları';
      data.legal.privacyPolicyContent = privacyPolicyTR;
      data.legal.termsOfUseContent = termsOfUseTR;
      data.legal.close = 'Kapat';
    } else {
      try {
        const translateTarget = langCode === 'zh' ? 'zh-CN' : langCode;
        
        console.log("Translating to " + translateTarget + "...");
        const resPrivacy = await translate(privacyPolicyTR, { from: 'tr', to: translateTarget });
        const resTerms = await translate(termsOfUseTR, { from: 'tr', to: translateTarget });
        const resPrivacyTitle = await translate('Gizlilik Politikası', { from: 'tr', to: translateTarget });
        const resTermsTitle = await translate('Kullanım Koşulları', { from: 'tr', to: translateTarget });
        const resClose = await translate('Kapat', { from: 'tr', to: translateTarget });

        data.legal.privacyPolicy = resPrivacyTitle.text;
        data.legal.termsOfUse = resTermsTitle.text;
        data.legal.privacyPolicyContent = resPrivacy.text;
        data.legal.termsOfUseContent = resTerms.text;
        data.legal.close = resClose.text;

      } catch (err) {
        console.error("Translation failed for " + langCode + ": ", err.message);
        continue;
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log("Successfully updated " + langCode);
  }
}

main().catch(console.error);
