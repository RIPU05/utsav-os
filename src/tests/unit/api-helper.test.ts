import { describe, it, expect } from 'vitest';
import { checkRequestSafety, handleApiError } from '@/lib/api-helper';
import { GeminiApiError } from '@/lib/gemini';
import { z } from 'zod';

describe('API Route Safety & Error Handling', () => {
  it('allows safe incoming requests within rate limits', () => {
    const req = new Request('https://example.com/api/test', {
      headers: { 'x-forwarded-for': '192.0.2.1' },
    });
    const result = checkRequestSafety(req);
    expect(result.allowed).toBe(true);
    expect(result.clientIp).toBe('192.0.2.1');
  });

  it('normalizes Zod validation errors to 400 responses', async () => {
    const testSchema = z.object({ city: z.string().min(2) });
    const parseResult = testSchema.safeParse({ city: '' });

    if (!parseResult.success) {
      const response = handleApiError(parseResult.error);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Validation Error');
      expect(json.details.length).toBeGreaterThan(0);
    }
  });

  it('handles GeminiApiError with appropriate status code', async () => {
    const geminiError = new GeminiApiError('API Key Missing', 500, false);
    const response = handleApiError(geminiError);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('API Key Missing');
  });

  it('handles generic unknown errors as 500 responses', async () => {
    const unknownError = new Error('Database connection failed');
    const response = handleApiError(unknownError);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Database connection failed');

    // Test non-Error object
    const nonErrorObj = 'String error';
    const response2 = handleApiError(nonErrorObj);
    expect(response2.status).toBe(500);
    const json2 = await response2.json();
    expect(json2.error).toBe('Internal Server Error');
  });

  it('rejects requests with 429 when rate limit is exceeded', () => {
    const abusiveIp = '198.51.100.99';
    // Consume quota
    for (let i = 0; i < 35; i++) {
      const req = new Request('https://example.com/api/test', {
        headers: { 'x-forwarded-for': abusiveIp },
      });
      checkRequestSafety(req);
    }

    const blockedReq = new Request('https://example.com/api/test', {
      headers: { 'x-forwarded-for': abusiveIp },
    });
    const result = checkRequestSafety(blockedReq);
    expect(result.allowed).toBe(false);
    expect(result.response).toBeDefined();
    expect(result.response?.status).toBe(429);
  });
});
