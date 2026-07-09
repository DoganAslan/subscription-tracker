const fs = require('fs');
const path = require('path');
const translate = require('google-translate-api-x');

const authLeaksTR = {
  emailAddress: "E-posta Adresi",
  password: "Şifre",
  forgotPasswordLabel: "Şifremi Unuttum?",
  logInBtn: "Giriş Yap",
  fullName: "Ad Soyad",
  confirmPassword: "Şifreyi Onayla",
  createAccountBtn: "Hesap Oluştur"
};

const localesDir = path.join(__dirname, 'src', 'locales', 'translations');

async function main() {
  const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const langCode = file.replace('.json', '');
    const filePath = path.join(localesDir, file);
    
    console.log("Processing auth leaks for " + langCode + "...");
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.authLeaks) {
      data.authLeaks = {};
    }

    if (data.authLeaks.emailAddress) {
      console.log(langCode + " already has auth leaks text. Skipping.");
      continue;
    }

    if (langCode === 'tr') {
      data.authLeaks = authLeaksTR;
    } else {
      try {
        const translateTarget = langCode === 'zh' ? 'zh-CN' : langCode;
        console.log("Translating to " + translateTarget + "...");
        
        const promises = Object.keys(authLeaksTR).map(async (key) => {
          const res = await translate(authLeaksTR[key], { from: 'tr', to: translateTarget });
          return { key, text: res.text };
        });

        const results = await Promise.all(promises);
        results.forEach(res => {
          data.authLeaks[res.key] = res.text;
        });

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
