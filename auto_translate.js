const fs = require('fs');
const path = require('path');

async function run() {
  const { translate } = await import('@vitalets/google-translate-api');

  const dir = path.join('src', 'locales', 'translations');
  const enFile = fs.readFileSync(path.join(dir, 'en.json'), 'utf8');
  const enData = JSON.parse(enFile);

  const langs = ['es', 'zh', 'hi', 'ar', 'fr', 'ru', 'pt', 'de', 'ja', 'id', 'bn', 'ur', 'ko', 'it', 'vi', 'te', 'mr', 'ta'];

  // Flatten the object
  const flatEn = [];
  function flatten(obj, currentPath) {
    for (const [k, v] of Object.entries(obj)) {
      const newPath = currentPath ? currentPath + '.' + k : k;
      if (typeof v === 'object') {
        flatten(v, newPath);
      } else {
        flatEn.push({ path: newPath, text: String(v) });
      }
    }
  }
  flatten(enData, '');

  const textsToTranslate = flatEn.map(item => item.text);
  
  // Format as XML tags to preserve structure during translation
  let htmlPayload = '';
  for(let i=0; i<textsToTranslate.length; i++) {
     htmlPayload += `<span id="${i}">${textsToTranslate[i]}</span>\n`;
  }

  for (const lang of langs) {
    console.log(`Translating ${lang}...`);
    try {
      const toLang = lang === 'zh' ? 'zh-CN' : lang;
      
      const res = await translate(htmlPayload, { to: toLang });
      
      const translatedText = res.text;
      
      const targetData = JSON.parse(JSON.stringify(enData));
      
      // parse the pseudo-html
      const spanRegex = /<span id="(\d+)">([\s\S]*?)<\/span>/gi;
      let match;
      let matchedCount = 0;
      
      while ((match = spanRegex.exec(translatedText)) !== null) {
         const id = parseInt(match[1]);
         let text = match[2].trim();
         
         // Fix up handlebars that might have spaces added (e.g. {{ count }} -> {{count}})
         text = text.replace(/\{\{\s*(.*?)\s*\}\}/g, "{{$1}}");
         
         const keys = flatEn[id].path.split('.');
         let curr = targetData;
         for (let j=0; j<keys.length - 1; j++) {
           curr = curr[keys[j]];
         }
         curr[keys[keys.length-1]] = text;
         matchedCount++;
      }
      
      if (matchedCount !== textsToTranslate.length) {
         console.warn(`Mismatch in ${lang}: parsed ${matchedCount} tags, expected ${textsToTranslate.length}. Data might be incomplete.`);
      }

      fs.writeFileSync(path.join(dir, `${lang}.json`), JSON.stringify(targetData, null, 2));
      console.log(`Finished ${lang}`);
      await new Promise(r => setTimeout(r, 500)); // sleep between langs
    } catch (e) {
      console.error(`Failed ${lang}:`, e.message);
    }
  }
}

run();
