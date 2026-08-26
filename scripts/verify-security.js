const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const read = relativePath => readFileSync(join(root, relativePath), 'utf8');

const clientAi = read('src/services/ai/gemini.ts');
const serverAi = read('functions/src/index.ts');
const firestoreRules = read('firestore.rules');

assert(!clientAi.includes('config/secrets'), 'Client AI service must not read Firestore secrets.');
assert(!clientAi.includes('generativelanguage.googleapis.com'), 'Client AI service must not call Gemini directly.');
assert(!clientAi.includes('GEMINI_API_KEY'), 'Gemini API key identifiers must stay out of client code.');
assert(serverAi.includes("defineSecret('GEMINI_API_KEY')"), 'Server must use Secret Manager for Gemini.');
assert(serverAi.includes('if (!request.auth)'), 'AI callable functions must require authentication.');
assert(serverAi.includes('enforceRateLimit'), 'AI callable functions must enforce rate limits.');
assert(
  /match \/config\/secrets[\s\S]*?allow read, write: if false;/.test(firestoreRules),
  'Firestore clients must be denied access to the secrets document.',
);
assert(
  /match \/_aiRateLimits\/\{documentId\}[\s\S]*?allow read, write: if false;/.test(firestoreRules),
  'Firestore clients must be denied access to AI rate-limit records.',
);

console.log('✅ Security regression checks passed.');
