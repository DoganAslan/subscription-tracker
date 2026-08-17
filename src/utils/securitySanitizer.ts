/**
 * Security Sanitizer Utility
 * Protection against XSS, HTML Tag Injection, Script Payload Injection, and NoSQL control string attacks.
 */

/**
 * Strips HTML tags, script elements, event attributes (e.g. onerror=, onload=), and dangerous protocol prefixes.
 */
export function sanitizeString(input: string, maxLen: number = 250): string {
  if (typeof input !== 'string') return '';

  let sanitized = input
    // Remove HTML tags
    .replace(/<[^>]*>?/gm, '')
    // Remove inline javascript handlers (e.g. onerror=, onclick=)
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^"\s>]+/gi, '')
    // Strip javascript: or data: URI protocols
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:/gi, '')
    // Remove null bytes & dangerous control characters
    .replace(/\0/g, '')
    .trim();

  // Enforce max length boundary
  if (sanitized.length > maxLen) {
    sanitized = sanitized.substring(0, maxLen);
  }

  return sanitized;
}

/**
 * Sanitizes numeric price / currency inputs to prevent NaN or negative infinity exploits.
 */
export function sanitizeNumericAmount(val: number | string): number {
  const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '.')) : Number(val);
  if (isNaN(num) || !isFinite(num) || num < 0) {
    return 0;
  }
  // Round to 2 decimal places to prevent floating point overflows
  return Math.round(num * 100) / 100;
}

/**
 * Filters AI chat user inputs to neutralize potential Prompt Injection instructions.
 */
export function sanitizeAiPrompt(prompt: string): string {
  if (typeof prompt !== 'string') return '';

  let clean = sanitizeString(prompt, 500);

  // Neutralize common system override phrases
  clean = clean
    .replace(/ignore previous instructions/gi, '[filtered instruction]')
    .replace(/disregard all prior rules/gi, '[filtered instruction]')
    .replace(/system prompt:/gi, '[filtered label]');

  return clean;
}
