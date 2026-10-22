import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { planRateLimiter, extractClientIp } from './ratelimit';
import { GeminiApiError } from './gemini';

export interface SafetyCheckResult {
  allowed: boolean;
  response?: NextResponse;
  clientIp: string;
}

/**
 * Checks client IP rate limit and rejects excessive requests with standard 429 response.
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
 * Standardized API error response handler.
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
