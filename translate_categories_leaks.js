const fs = require('fs');
const path = require('path');
const translate = require('google-translate-api-x');

const categoriesTR = {
  "Entertainment": "Eğlence",
  "Music & Audio": "Müzik & Ses",
  "Productivity": "Üretkenlik",
  "Utilities & Cloud": "Araçlar & Bulut",
  "Health & Fitness": "Sağlık & Spor",
  "Finance & Insurance": "Finans & Sigorta",
  "Education & Learning": "Eğitim & Öğrenim",
  "Gaming": "Oyun",
  "Shopping & E-commerce": "Alışveriş & E-ticaret",
  "News & Media": "Haberler & Medya",
  "Food & Delivery": "Yemek & Teslimat",
  "Other": "Diğer"
};

const localesDir = path.join(__dirname, 'src', 'locales', 'translations');

async function main() {
  const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const langCode = file.replace('.json', '');
    const filePath = path.join(localesDir, file);
    
    console.log("Processing categories for " + langCode + "...");
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.categories) data.categories = {};

    if (langCode === 'tr') {
      data.categories = categoriesTR;
    } else {
      try {
        const translateTarget = langCode === 'zh' ? 'zh-CN' : langCode;
        console.log("Translating to " + translateTarget + "...");
        
        for (const key of Object.keys(categoriesTR)) {
          const res = await translate(categoriesTR[key], { from: 'tr', to: translateTarget });
          data.categories[key] = res.text;
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


