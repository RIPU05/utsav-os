/**
 * @fileoverview Reusable API route helpers for client request validation,
 * rate limit verification, and standardized JSON error formatting.
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { planRateLimiter, extractClientIp } from './ratelimit';
import { GeminiApiError } from './gemini';

/**
 * Result returned by request safety checks.
 */
export interface SafetyCheckResult {
  /** True if the request passes rate limiting and security gates */
  allowed: boolean;
  /** Ready-to-return 429 response if rate limit was exceeded */
  response?: NextResponse;
  /** Sanitized IP address of the client */
  clientIp: string;
}

/**
 * Checks client IP rate limit and generates a standardized 429 response if exceeded.
 *
 * @param {Request} request - Incoming Next.js request.
 * @returns {SafetyCheckResult} Status object indicating if execution should proceed.
 * @throws {never} This safety wrapper never throws.
 */
export function checkRequestSafety(request: Request): SafetyCheckResult {
  const clientIp = extractClientIp(request);
  const rateLimit = planRateLimiter.check(clientIp);

  if (!rateLimit.allowed) {
    return {
      allowed: false,
      clientIp,
      response: NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before submitting more requests.',
          retryAfterSeconds: rateLimit.resetSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
            'X-RateLimit-Remaining': '0',
          },
        }
      ),
    };
  }

  return { allowed: true, clientIp };
}

/**
 * Standardized API error response handler that differentiates Zod validation errors,
 * upstream Gemini API failures, and unexpected runtime exceptions.
 *
 * @param {unknown} err - Caught exception or rejection.
 * @returns {NextResponse} Formatted JSON response with appropriate HTTP status code.
 * @throws {never} Always succeeds in producing a response.
 */
export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation Error',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  if (err instanceof GeminiApiError) {
    return NextResponse.json(
      {
        error: err.message,
        isRetryable: err.isRetryable,
      },
      { status: err.statusCode }
    );
  }

  const message = err instanceof Error ? err.message : 'Internal Server Error';
  return NextResponse.json({ error: message }, { status: 500 });
}
