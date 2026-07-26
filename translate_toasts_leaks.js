const fs = require('fs');
const path = require('path');
const translate = require('google-translate-api-x');

const toastsTR = {
  "subscriptionSaved": "Abonelik Kaydedildi",
  "subscriptionUpdated": "Abonelik Güncellendi",
  "subscriptionDeleted": "Abonelik Silindi",
  "failedToAddSub": "Abonelik eklenemedi",
  "failedToUpdateSub": "Abonelik güncellenemedi",
  "failedToDeleteSub": "Abonelik silinemedi"
};

const localesDir = path.join(__dirname, 'src', 'locales', 'translations');

async function main() {
  const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const langCode = file.replace('.json', '');
    const filePath = path.join(localesDir, file);
    
    console.log("Processing toasts for " + langCode + "...");
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.global) data.global = {};

    if (langCode === 'tr') {
      Object.assign(data.global, toastsTR);
    } else {
      try {
        const translateTarget = langCode === 'zh' ? 'zh-CN' : langCode;
        console.log("Translating to " + translateTarget + "...");
        
        for (const key of Object.keys(toastsTR)) {
          const res = await translate(toastsTR[key], { from: 'tr', to: translateTarget });
          data.global[key] = res.text;
        }
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


