const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const read = relativePath => readFileSync(join(root, relativePath), 'utf8');

const envExample = read('.env.example');
const sentryService = read('src/services/monitoring/sentry.ts');

assert(
  !/^EXPO_PUBLIC_SENTRY_DSN=.+$/m.test(envExample),
  'Do not commit a Sentry DSN to .env.example.',
);
assert(sentryService.includes('sendDefaultPii: false'), 'Sentry must keep default PII collection disabled.');
assert(sentryService.includes('tracesSampleRate: 0'), 'Sentry performance tracing must remain disabled.');
assert(sentryService.includes('maxBreadcrumbs: 0'), 'Sentry breadcrumbs must remain disabled.');
assert(sentryService.includes("platform !== 'web'"), 'Sentry must remain disabled on web builds.');

const localEnvPath = join(root, '.env');
if (existsSync(localEnvPath)) {
  const localEnv = readFileSync(localEnvPath, 'utf8');
  assert(
    !/EXPO_PUBLIC_SENTRY_DSN\s*=\s*(?!$)/m.test(localEnv) || !localEnv.includes('YOUR_DSN'),
    'Replace placeholder Sentry values only in a local or CI secret environment.',
  );
}

console.log('✅ Privacy-safe monitoring configuration checks passed.');
