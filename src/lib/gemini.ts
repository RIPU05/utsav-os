/**
 * @fileoverview Robust Google Gemini SDK integration engine with JSON schema enforcement,
 * timeout races, exponential backoff retries, and automated fallback model cascades.
 */

import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const DEFAULT_PRIMARY_MODEL = 'gemini-3.8-flash';
const DEFAULT_FALLBACK_MODEL = 'gemini-3.5-flash';
const DEFAULT_TIMEOUT_MS = 25000;
const MAX_RETRIES = 2;

/**
 * Execution parameters for Gemini API invocations.
 */
export interface GeminiCallOptions {
  /** Maximum execution duration in milliseconds before timing out */
  timeoutMs?: number;
  /** Maximum retry attempts upon transient or rate-limited errors */
  maxRetries?: number;
  /** Temperature sampling parameter between 0.0 and 1.0 */
  temperature?: number;
  /** Optional pre-configured GoogleGenAI client instance for testing */
  customClient?: GoogleGenAI;
}

/**
 * Standardized error class representing failures during Gemini AI inference.
 */
export class GeminiApiError extends Error {
  /** HTTP status code associated with this error */
  public statusCode: number;
  /** Indicates whether client should attempt retrying this operation */
  public isRetryable: boolean;

  /**
   * Constructs a new GeminiApiError.
   *
   * @param {string} message - Human-readable diagnostic message.
   * @param {number} [statusCode=500] - HTTP status code.
   * @param {boolean} [isRetryable=false] - Whether this condition is transient.
   */
  constructor(message: string, statusCode = 500, isRetryable = false) {
    super(message);
    this.name = 'GeminiApiError';
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
  }
}

/**
 * Extracts clean JSON string by stripping potential markdown code fences.
 *
 * @param {string} rawText - Raw string from LLM output.
 * @returns {string} Stripped JSON string ready for parsing.
 * @throws {never} Handles arbitrary string input safely.
 */
export function extractJsonFromResponse(rawText: string): string {
  const trimmed = rawText.trim();
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = trimmed.match(fenceRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return trimmed;
}

/**
 * Normalizes an unknown caught error into a string message.
 *
 * @param {unknown} err - Error instance or value.
 * @returns {string} Normalized message string.
 */
function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err || 'Unknown error');
}

/**
 * Creates or retrieves the GoogleGenAI client using server-only environment variables.
 * Guarantees zero client-side key leakage.
 *
 * @returns {GoogleGenAI} Initialized GoogleGenAI client instance.
 * @throws {GeminiApiError} When `GEMINI_API_KEY` is not configured in server environment.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiApiError(
      'Server configuration error: GEMINI_API_KEY is not configured on the server.',
      500,
      false
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Executes a Gemini request with structured JSON output, retries, exponential backoff,
 * and automatic fallback model cascade.
 *
 * @template T
 * @param {string} prompt - Prompt instruction text.
 * @param {z.ZodType<T>} schema - Target Zod validation schema.
 * @param {GeminiCallOptions} [options={}] - Execution options.
 * @returns {Promise<T>} Validated and typed object matching schema.
 * @throws {GeminiApiError} When generation fails or schema validation rejects the payload.
 */
export async function callGeminiStructured<T>(
  prompt: string,
  schema: z.ZodType<T>,
  options: GeminiCallOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  const client = options.customClient ?? getGeminiClient();

  const primaryModel = process.env.GEMINI_MODEL || DEFAULT_PRIMARY_MODEL;
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL;

  let lastError: Error | null = null;
  const modelsToAttempt = [primaryModel, fallbackModel];

  for (let modelIdx = 0; modelIdx < modelsToAttempt.length; modelIdx++) {
    const currentModel = modelsToAttempt[modelIdx];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let timerId: ReturnType<typeof setTimeout> | undefined;

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timerId = setTimeout(() => {
            reject(new GeminiApiError(`Gemini request timed out after ${timeoutMs}ms`, 504, true));
          }, timeoutMs);
        });

        const executionPromise = client.models.generateContent({
          model: currentModel,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: options.temperature ?? 0.3,
          },
        });

        const response = await Promise.race([executionPromise, timeoutPromise]);
        const text = response.text;

        if (!text) {
          throw new GeminiApiError('Gemini returned an empty response', 502, true);
        }

        const cleanedJson = extractJsonFromResponse(text);
        let parsedData: unknown;

        try {
          parsedData = JSON.parse(cleanedJson);
        } catch (jsonErr) {
          throw new GeminiApiError(
            `Malformed JSON returned by AI model: ${toErrorMessage(jsonErr)}`,
            502,
            false
          );
        }

        const validatedResult = schema.safeParse(parsedData);
        if (!validatedResult.success) {
          throw new GeminiApiError(
            `Gemini response schema validation failed: ${validatedResult.error.message}`,
            502,
            false
          );
        }

        return validatedResult.data;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(toErrorMessage(err));
        const isRetryable =
          err instanceof GeminiApiError
            ? err.isRetryable
            : String(err).includes('429') ||
              String(err).includes('503') ||
              String(err).includes('overloaded');

        if (attempt < maxRetries && isRetryable) {
          const backoffTime = Math.pow(2, attempt) * 600;
          await new Promise((r) => setTimeout(r, backoffTime));
          continue;
        }

        // Try fallback model if available
        break;
      } finally {
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }
      }
    }
  }

  throw new GeminiApiError(
    `AI service is currently congested. Please retry or inspect preset plans. (Details: ${toErrorMessage(lastError)})`,
    503,
    false
  );
}

/**
 * Server-side streaming generator for real-time assistant responses.
 *
 * @param {string} prompt - Prompt instructions for creative generation.
 * @param {GeminiCallOptions} [options={}] - Streaming options.
 * @returns {AsyncGenerator<string, void, unknown>} Asynchronous generator yielding text chunks.
 * @throws {GeminiApiError} When client creation or stream connection fails.
 */
export async function* streamGeminiContent(
  prompt: string,
  options: GeminiCallOptions = {}
): AsyncGenerator<string, void, unknown> {
  const client = options.customClient ?? getGeminiClient();
  const primaryModel = process.env.GEMINI_MODEL || DEFAULT_PRIMARY_MODEL;

  const responseStream = await client.models.generateContentStream({
    model: primaryModel,
    contents: prompt,
    config: {
      temperature: options.temperature ?? 0.7,
    },
  });

  for await (const chunk of responseStream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
