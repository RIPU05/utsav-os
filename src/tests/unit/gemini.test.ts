import { describe, it, expect } from 'vitest';
import { extractJsonFromResponse, GeminiApiError } from '@/lib/gemini';

describe('Gemini Client Utilities', () => {
  it('extracts clean JSON from raw markdown fenced strings', () => {
    const rawFenced = '```json\n{"suggestedTitle": "Royal Gala"}\n```';
    expect(extractJsonFromResponse(rawFenced)).toBe('{"suggestedTitle": "Royal Gala"}');

    const unfenced = '{"suggestedTitle": "Royal Gala"}';
    expect(extractJsonFromResponse(unfenced)).toBe('{"suggestedTitle": "Royal Gala"}');
  });

  it('instantiates GeminiApiError with properties', () => {
    const error = new GeminiApiError('Quota exceeded', 429, true);
    expect(error.name).toBe('GeminiApiError');
    expect(error.statusCode).toBe(429);
    expect(error.isRetryable).toBe(true);
    expect(error.message).toBe('Quota exceeded');
  });
});
