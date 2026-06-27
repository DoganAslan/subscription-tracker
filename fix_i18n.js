const fs = require('fs');
const path = require('path');

const localesDir = path.join('src', 'locales', 'translations');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const filePath = path.join(localesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace  with {{email}}
  content = content.replace(/\$\{currentUser\.email\}/g, '{{email}}');
  
  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Dictionaries fixed.');
