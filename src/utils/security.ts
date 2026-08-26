const MAX_LOG_STRING_LENGTH = 2_000;
const SENSITIVE_FIELD_PATTERN = /(?:authorization|password|passcode|secret|token|api[-_]?key|credential|base64|email)/i;
let productionLogProtectionInstalled = false;

function redactString(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(/([?&](?:key|api_key|apiKey)=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED_TOKEN]')
    .replace(/(?:data:[^;]+;base64,)?[A-Za-z0-9+/]{512,}={0,2}/g, '[REDACTED_LARGE_PAYLOAD]')
    .slice(0, MAX_LOG_STRING_LENGTH);
}

function redactLogValue(value: unknown, depth: number = 0): unknown {
  if (typeof value === 'string') return redactString(value);
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: value.stack ? redactString(value.stack) : undefined,
    };
  }
  if (!value || typeof value !== 'object' || depth >= 3) return value;
  if (Array.isArray(value)) return value.slice(0, 25).map(item => redactLogValue(item, depth + 1));

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, 50)
      .map(([key, nestedValue]) => [
        key,
        SENSITIVE_FIELD_PATTERN.test(key) ? '[REDACTED]' : redactLogValue(nestedValue, depth + 1),
      ]),
  );
}

/**
 * Removes noisy production logs while preserving redacted warnings and errors.
 * This keeps diagnostics useful without printing credentials or large payloads.
 */
export const neutralizeProductionLogs = () => {
  if (__DEV__ || productionLogProtectionInstalled) return;
  productionLogProtectionInstalled = true;

  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);
  const noOp = () => {};

  console.log = noOp;
  console.info = noOp;
  console.debug = noOp;
  console.warn = (...args: unknown[]) => originalWarn(...args.map(argument => redactLogValue(argument)));
  console.error = (...args: unknown[]) => originalError(...args.map(argument => redactLogValue(argument)));
};

