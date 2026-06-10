const fs = require('fs');
const path = require('path');

function walk(dir) {
  let list = fs.readdirSync(dir);
  list.forEach(file => {
    let filePath = path.join(dir, file);
    let stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      walk(filePath);
    } else if (filePath.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('<Text') && !/import\s+\{[^}]*?\bText\b[^}]*?\}\s+from\s+['"]react-native['"]/.test(content)) {
        console.log(filePath);
      }
    }
  });
}

walk('src');
