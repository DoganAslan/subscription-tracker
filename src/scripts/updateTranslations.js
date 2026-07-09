const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'locales', 'translations');

const EN_NEW_KEYS = {
  lastXHours: "FINAL {{hours}} HOURS",
  xHoursLeft: "{{hours}} HOURS LEFT",
  trialVersionTag: "Trial Version",
  sharedPaymentOverview: "💰 Shared Payment Overview",
  unnamed: "Unnamed",
  remind: "Remind",
  aiScannerAutoFill: "Auto-Fill with AI Scanner",
  smartTipsTitle: "Smart Tips",
  insteadOf: "Instead of: ",
  becauseYouPayFor: "Because you pay for {{subName}}.",
  deleteDoesNotCancel: "Deleting this subscription from SubMate does not cancel your actual subscription. If you wish to cancel the actual subscription, you can use the button below.",
  goToCancelPage: "Go to Cancel Page",
  doesNotCancelBold: "does not cancel",
  altReason_spotify: "Instead of ChatGPT Plus, you can often zero out your AI costs by using Claude 3.5 Sonnet or Google Gemini (free version) which offer generous free tiers.",
  altReason_midjourney: "Instead of a Midjourney subscription, you can meet your image generation needs for free by using Leonardo AI, which gives free daily tokens.",
  altReason_adobe: "Instead of Adobe Creative Cloud, consider Affinity Photo & Designer which are one-time purchases, or free alternatives like Photopea and Canva.",
  altReason_netflix: "Check if your mobile plan or internet provider includes Netflix for free. Also, consider Amazon Prime Video which might already be included in your Prime shipping plan."
};

const TR_NEW_KEYS = {
  lastXHours: "🚨 SON {{hours}} SAAT",
  xHoursLeft: "{{hours}} SAAT KALDI",
  trialVersionTag: "Deneme Sürümü",
  sharedPaymentOverview: "💰 Ortak Ödeme Özeti",
  unnamed: "İsimsiz",
  remind: "Hatırlat",
  aiScannerAutoFill: "AI Scanner ile Otomatik Doldur",
  smartTipsTitle: "Tasarruf İpucu (Smart Tips)",
  insteadOf: "Yerine: ",
  becauseYouPayFor: "Çünkü {{subName}} için ödeme yapıyorsunuz.",
  deleteDoesNotCancel: "Bu aboneliği SubMate'ten silmek, gerçek aboneliğinizi iptal etmez. Eğer gerçek aboneliğinizi de iptal etmek istiyorsanız aşağıdaki butonu kullanabilirsiniz.",
  goToCancelPage: "İptal Sayfasına Git",
  doesNotCancelBold: "iptal etmez",
  altReason_spotify: "ChatGPT Plus yerine, genellikle daha geniş ücretsiz kullanım sunan Claude 3.5 Sonnet veya Google Gemini (ücretsiz sürüm) kullanarak AI masraflarınızı sıfırlayabilirsiniz.",
  altReason_midjourney: "Midjourney aboneliği yerine, her gün ücretsiz jeton veren Leonardo AI kullanarak görsel üretim ihtiyaçlarınızı ücretsiz olarak karşılayabilirsiniz.",
  altReason_adobe: "Adobe Creative Cloud yerine tek seferlik ödeme alan Affinity Photo & Designer'a geçebilir veya tamamen ücretsiz Photopea ve Canva kullanabilirsiniz.",
  altReason_netflix: "Netflix'i iptal edip Amazon Prime'a geçerseniz hem çok daha uygun fiyata film/dizi izler, hem de Amazon kargolarınızı bedavaya getirebilirsiniz."
};

const updateTranslations = () => {
  const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const lang = file.replace('.json', '');
    const filePath = path.join(localesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Ensure "features" object exists
    if (!data.features) {
      data.features = {};
    }
    
    const keysToAdd = lang === 'tr' ? TR_NEW_KEYS : EN_NEW_KEYS;
    
    for (const [key, value] of Object.entries(keysToAdd)) {
      if (!data.features[key]) {
        data.features[key] = value;
      }
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Updated ${file}`);
  }
};

updateTranslations();


