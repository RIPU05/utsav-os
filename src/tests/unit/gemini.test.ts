import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractJsonFromResponse,
  GeminiApiError,
  getGeminiClient,
  callGeminiStructured,
  streamGeminiContent,
} from '@/lib/gemini';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';

describe('Gemini Client & Structured Caller Suite', () => {
  const originalEnv = process.env.GEMINI_API_KEY;

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
    vi.restoreAllMocks();
  });

  describe('extractJsonFromResponse', () => {
    it('extracts clean JSON from raw markdown fenced strings', () => {
      const rawFenced = '```json\n{"suggestedTitle": "Royal Gala"}\n```';
      expect(extractJsonFromResponse(rawFenced)).toBe('{"suggestedTitle": "Royal Gala"}');

      const unfenced = '{"suggestedTitle": "Royal Gala"}';
      expect(extractJsonFromResponse(unfenced)).toBe('{"suggestedTitle": "Royal Gala"}');
    });

    it('extracts JSON surrounded by preamble text', () => {
      const mixed = 'Here is the plan:\n```json\n{"title": "Gala"}\n```\nEnjoy!';
      expect(extractJsonFromResponse(mixed)).toBe('{"title": "Gala"}');
    });
  });

  describe('GeminiApiError', () => {
    it('instantiates GeminiApiError with properties', () => {
      const error = new GeminiApiError('Quota exceeded', 429, true);
      expect(error.name).toBe('GeminiApiError');
      expect(error.statusCode).toBe(429);
      expect(error.isRetryable).toBe(true);
      expect(error.message).toBe('Quota exceeded');
    });
  });

  describe('getGeminiClient', () => {
    it('throws 500 GeminiApiError when GEMINI_API_KEY is missing', () => {
      delete process.env.GEMINI_API_KEY;
      expect(() => getGeminiClient()).toThrow(GeminiApiError);
    });

    it('returns client instance when GEMINI_API_KEY is present', () => {
      process.env.GEMINI_API_KEY = 'test-key-ai-123';
      const client = getGeminiClient();
      expect(client).toBeDefined();
    });
  });

  describe('callGeminiStructured', () => {
    const testSchema = z.object({
      title: z.string(),
      count: z.number(),
    });

    it('successfully calls and parses structured JSON from custom client', async () => {
      const mockClient = {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: '```json\n{"title": "Jaipur Gala", "count": 250}\n```',
          }),
        },
      };

      const result = await callGeminiStructured('generate plan', testSchema, {
        customClient: mockClient as unknown as GoogleGenAI,
        maxRetries: 0,
        timeoutMs: 2000,
      });

      expect(result).toEqual({ title: 'Jaipur Gala', count: 250 });
      expect(mockClient.models.generateContent).toHaveBeenCalled();
    });

    it('throws when model returns empty text', async () => {
      const mockClient = {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: '',
          }),
        },
      };

      await expect(
        callGeminiStructured('prompt', testSchema, {
          customClient: mockClient as unknown as GoogleGenAI,
          maxRetries: 0,
          timeoutMs: 1000,
        })
      ).rejects.toThrow(GeminiApiError);
    });

    it('throws when model returns unparseable JSON', async () => {
      const mockClient = {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: 'This is plain text with no json',
          }),
        },
      };

      await expect(
        callGeminiStructured('prompt', testSchema, {
          customClient: mockClient as unknown as GoogleGenAI,
          maxRetries: 0,
          timeoutMs: 1000,
        })
      ).rejects.toThrow(GeminiApiError);
    });

    it('throws when JSON schema validation fails', async () => {
      const mockClient = {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: '{"title": 12345, "count": "not-a-number"}',
          }),
        },
      };

      await expect(
        callGeminiStructured('prompt', testSchema, {
          customClient: mockClient as unknown as GoogleGenAI,
          maxRetries: 0,
          timeoutMs: 1000,
        })
      ).rejects.toThrow(GeminiApiError);
    });
  });

  describe('streamGeminiContent', () => {
    it('yields chunks from generateContentStream', async () => {
      const mockClient = {
        models: {
          generateContentStream: vi
            .fn()
            .mockResolvedValue([
              { text: 'Drafting invitation: ' },
              { text: 'You are cordially invited.' },
            ]),
        },
      };

      const chunks: string[] = [];
      for await (const chunk of streamGeminiContent('write invitation', {
        customClient: mockClient as unknown as GoogleGenAI,
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Drafting invitation: ', 'You are cordially invited.']);
    });
  });
});
