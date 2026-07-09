const fs = require('fs');
const path = require('path');
const translate = require('google-translate-api-x');

const featuresLeaksTR = {
  cancelledToSave: "Tasarruf etmek için iptal ettim!",
  justDelete: "Sadece uygulamadan sil",
  trackUsage: "Kullanımı Takip Et",
  usedXTimes: "{{count}} kez kullanıldı.",
  lastUsed: "Son: {{date}}",
  iUsedThisToday: "Bugün kullandım"
};

const globalLeaksTR = {
  deleteSubscription: "Aboneliği Sil?",
  delete: "Sil"
};

const formsLeaksTR = {
  hasContract: "Yıllık Taahhüt Sözleşmesi Var",
  contractReminderSubtext: "Bitiş tarihinden 7 gün önce hatırlat",
  contractEndDateLabel: "TAAHHÜT BİTİŞ TARİHİ"
};

const localesDir = path.join(__dirname, 'src', 'locales', 'translations');

async function main() {
  const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const langCode = file.replace('.json', '');
    const filePath = path.join(localesDir, file);
    
    console.log("Processing leaks for " + langCode + "...");
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.features) data.features = {};
    if (!data.global) data.global = {};
    if (!data.forms) data.forms = {};

    if (langCode === 'tr') {
      Object.assign(data.features, featuresLeaksTR);
      Object.assign(data.global, globalLeaksTR);
      Object.assign(data.forms, formsLeaksTR);
    } else {
      try {
        const translateTarget = langCode === 'zh' ? 'zh-CN' : langCode;
        console.log("Translating to " + translateTarget + "...");
        
        // Features
        for (const key of Object.keys(featuresLeaksTR)) {
          let text = featuresLeaksTR[key];
          // avoid translating variables by replacing them first
          const variables = [];
          text = text.replace(/\{\{[^}]+\}\}/g, (match) => {
            variables.push(match);
            return `__VAR${variables.length - 1}__`;
          });

          const res = await translate(text, { from: 'tr', to: translateTarget });
          let translatedText = res.text;
          
          // restore variables
          variables.forEach((variable, i) => {
            translatedText = translatedText.replace(new RegExp(`__VAR${i}__`, 'g'), variable);
          });
          
          data.features[key] = translatedText;
        }

        // Global
        for (const key of Object.keys(globalLeaksTR)) {
          const res = await translate(globalLeaksTR[key], { from: 'tr', to: translateTarget });
          data.global[key] = res.text;
        }

        // Forms
        for (const key of Object.keys(formsLeaksTR)) {
          const res = await translate(formsLeaksTR[key], { from: 'tr', to: translateTarget });
          data.forms[key] = res.text;
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
