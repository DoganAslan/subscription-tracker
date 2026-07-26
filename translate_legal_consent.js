const fs = require('fs');
const path = require('path');
const translate = require('google-translate-api-x');

const consentTextTR = "Gizlilik Politikası ve Kullanım Koşullarını okudum, anladım ve kabul ediyorum.";

const localesDir = path.join(__dirname, 'src', 'locales', 'translations');

async function main() {
  const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const langCode = file.replace('.json', '');
    const filePath = path.join(localesDir, file);
    
    console.log("Processing " + langCode + "...");
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.legal) {
      data.legal = {};
    }

    if (data.legal.consentText) {
      console.log(langCode + " already has consent text. Skipping.");
      continue;
    }

    if (langCode === 'tr') {
      data.legal.consentText = consentTextTR;
    } else {
      try {
        const translateTarget = langCode === 'zh' ? 'zh-CN' : langCode;
        
        console.log("Translating to " + translateTarget + "...");
        const resConsent = await translate(consentTextTR, { from: 'tr', to: translateTarget });
        data.legal.consentText = resConsent.text;

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


