export const AI_MAX_OUTPUT_TOKENS = 2_000;

export function requireCompleteAiText(text: string, finishReason?: unknown): string {
  const normalizedText = text.trim();
  if (String(finishReason || '').toUpperCase() === 'MAX_TOKENS') {
    throw new Error('AI response was truncated by the output token limit.');
  }
  if (!normalizedText) {
    throw new Error('AI returned an empty response.');
  }
  return normalizedText;
}
