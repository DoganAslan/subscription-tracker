export const sanitizePriceInput = (value: string): string => {
  if (!value) return '';

  // 1. Hard Length Clamping: Max 10 chars
  let clamped = value.slice(0, 10);

  // 2. Replace commas with standard JS dots
  let cleaned = clamped.replace(/,/g, '.');

  // 3. Strip absolutely everything except digits and dots
  cleaned = cleaned.replace(/[^0-9.]/g, '');

  // 4. Prevent multiple dots (e.g. "12.45.8" -> "12.458")
  const firstDotIndex = cleaned.indexOf('.');
  if (firstDotIndex !== -1) {
    const integerPart = cleaned.slice(0, firstDotIndex);
    const rawDecimal = cleaned.slice(firstDotIndex + 1).replace(/\./g, ''); // strip remaining dots
    cleaned = `${integerPart}.${rawDecimal}`;
  }

  // 5. Enforce strict 2-decimal financial precision
  if (cleaned.includes('.')) {
    const [intPart, decPart] = cleaned.split('.');
    cleaned = `${intPart}.${decPart.slice(0, 2)}`;
  }

  // 6. Prevent integer overflows that crash UI flexbox (Max limit: 999,999.99)
  const numericVal = parseFloat(cleaned);
  if (numericVal > 999999.99) return '999999.99';

  return cleaned;
};

export const sanitizeTextInput = (value: string, maxLength: number = 100): string => {
  if (!value) return ''; // Let user clear the input without jumping to fallback

  // 1. Hard Length Clamping
  let clamped = value.slice(0, maxLength);

  // 2. Exterminate Ghost Characters (Zero-Width & Non-Breaking Spaces)
  clamped = clamped.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');

  // 3. Defend Against Data Format Hijacking (CSV / JSON Injection)
  // Strip dangerous parsing characters
  let scrubbed = clamped.replace(/[<>{}\[\]"\\\/=@+]/g, '');
  // Replace commas to safeguard CSV exports
  scrubbed = scrubbed.replace(/,/g, '-');

  // 4. Check if the string became entirely empty or just whitespace after scrubbing malicious chars
  // We avoid .trim() on the actual returned variable so the user can type spaces between words.
  if (scrubbed.trim().length === 0 && value.length > 0) {
    return 'Unnamed Subscription';
  }

  return scrubbed;
};
