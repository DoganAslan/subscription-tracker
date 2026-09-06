import { describe, expect, it } from '@jest/globals';
import { AI_MAX_OUTPUT_TOKENS, requireCompleteAiText } from '@/services/ai/responseGuard';

describe('AI response completion guard', () => {
  it('rejects a response that Gemini stopped because the token budget ended', () => {
    expect(() => requireCompleteAiText('Yarım kalan cümle', 'MAX_TOKENS')).toThrow('AI response was truncated');
  });

  it('accepts a completed response and reserves enough room for Turkish text', () => {
    expect(requireCompleteAiText('Tam yanıt.', 'STOP')).toBe('Tam yanıt.');
    expect(AI_MAX_OUTPUT_TOKENS).toBeGreaterThanOrEqual(2_000);
  });
});
