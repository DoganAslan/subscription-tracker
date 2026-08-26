const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(projectRoot, 'src');

function collectSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

function hasTranslationPath(dictionary, translationPath) {
  return translationPath.split('.').every(segment => {
    if (!dictionary || !Object.prototype.hasOwnProperty.call(dictionary, segment)) return false;
    dictionary = dictionary[segment];
    return true;
  });
}

require.extensions['.ts'] = function transpileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

function collectReferencedTranslationPaths({ proxyOnly = false } = {}) {
  const paths = new Set();
  const referencePattern = /(?<![A-Za-z0-9_])t\.([A-Za-z_][A-Za-z0-9_]*)\??\.([A-Za-z_][A-Za-z0-9_]*)/g;

  for (const filePath of collectSourceFiles(sourceRoot)) {
    const source = fs.readFileSync(filePath, 'utf8');
    const importsProxy = /import\s*\{\s*t\s*\}\s*from\s*['"][^'"]*locales\/i18n['"]/.test(source);
    if (proxyOnly !== importsProxy) continue;
    for (const match of source.matchAll(referencePattern)) {
      paths.add(`${match[1]}.${match[2]}`);
    }
  }

  return [...paths].sort();
}

const { LANGUAGES } = require(path.join(sourceRoot, 'locales', 'index.ts'));

for (const locale of ['tr', 'en']) {
  test(`${locale.toUpperCase()} çalışma zamanı sözlüğü kullanılan bütün sabit çeviri anahtarlarını içermeli`, () => {
    const jsonDictionary = JSON.parse(
      fs.readFileSync(path.join(sourceRoot, 'locales', 'translations', `${locale}.json`), 'utf8'),
    );
    const missingContextKeys = collectReferencedTranslationPaths().filter(
      translationPath => !hasTranslationPath(LANGUAGES[locale], translationPath),
    );
    const missingProxyKeys = collectReferencedTranslationPaths({ proxyOnly: true }).filter(
      translationPath => !hasTranslationPath(jsonDictionary, translationPath),
    );

    assert.deepEqual(
      [...new Set([...missingContextKeys, ...missingProxyKeys])].sort(),
      [],
      `Eksik ${locale.toUpperCase()} anahtarları: ${[...missingContextKeys, ...missingProxyKeys].join(', ')}`,
    );
  });
}
