/**
 * @fileoverview Token Bucket in-memory rate limiter with leak-proof cleanup interval
 * and trusted IP header parsing for API traffic protection.
 */

/**
 * Result returned by the token bucket rate limiter evaluation.
 */
export interface RateLimitResult {
  /** Whether the request is permitted within current rate allowance */
  allowed: boolean;
  /** Number of remaining request tokens in the active window */
  remaining: number;
  /** Estimated seconds until the client bucket refills or resets */
  resetSeconds: number;
}

/**
 * Internal tracking record for a single client IP bucket.
 */
interface BucketRecord {
  /** Fractional count of currently available request tokens */
  tokens: number;
  /** Milliseconds epoch timestamp of the last token refill calculation */
  lastRefill: number;
}

const DEFAULT_CAPACITY = 30; // Max requests per window
const DEFAULT_WINDOW_MS = 60 * 1000; // 60 seconds

/**
 * In-memory Token Bucket rate limiter that throttles excessive requests
 * while preventing memory leaks via automatic garbage collection.
 */
class TokenBucketRateLimiter {
  private buckets = new Map<string, BucketRecord>();
  private capacity: number;
  private windowMs: number;

  /**
   * Initializes a new TokenBucketRateLimiter instance.
   *
   * @param {number} [capacity=30] - Maximum burst capacity of tokens.
   * @param {number} [windowMs=60000] - Duration in milliseconds for full bucket replenishment.
   */
  constructor(capacity = DEFAULT_CAPACITY, windowMs = DEFAULT_WINDOW_MS) {
    this.capacity = capacity;
    this.windowMs = windowMs;

    // Prune stale IP records every 5 minutes to avoid memory leaks
    if (typeof setInterval !== 'undefined') {
      const interval = setInterval(() => {
        const now = Date.now();
        this.buckets.forEach((record, ip) => {
          if (now - record.lastRefill > this.windowMs * 2) {
            this.buckets.delete(ip);
          }
        });
      }, 5 * 60 * 1000);
      if (typeof interval === 'object' && 'unref' in interval) {
        interval.unref();
      }
    }
  }

  /**
   * Checks whether the given client identifier is permitted to execute a request.
   *
   * @param {string} identifier - Unique client key (typically an IP address).
   * @returns {RateLimitResult} Status indicating whether request is allowed and remaining tokens.
   * @throws {never} This method is guarded against throwing.
   */
  public check(identifier: string): RateLimitResult {
    const now = Date.now();
    let record = this.buckets.get(identifier);

    if (!record) {
      record = { tokens: this.capacity, lastRefill: now };
      this.buckets.set(identifier, record);
    } else {
      // Refill tokens proportionally
      const timePassed = now - record.lastRefill;
      const tokensToAdd = (timePassed / this.windowMs) * this.capacity;
      record.tokens = Math.min(this.capacity, record.tokens + tokensToAdd);
      record.lastRefill = now;
    }

    if (record.tokens >= 1) {
      record.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(record.tokens),
        resetSeconds: Math.ceil(this.windowMs / 1000),
      };
    }

    const timeUntilToken = ((1 - record.tokens) / this.capacity) * this.windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.ceil(timeUntilToken / 1000),
    };
  }
}

/**
 * Shared singleton instance of the plan generation rate limiter.
 */
export const planRateLimiter = new TokenBucketRateLimiter(
  Number(process.env.RATE_LIMIT_MAX_REQUESTS || DEFAULT_CAPACITY),
  Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 60) * 1000
);

/**
 * Extracts and sanitizes client IP address from proxy request headers.
 * Supports `x-forwarded-for` and `x-real-ip` with strict alphanumeric/colon/dot validation.
 *
 * @param {Request} request - Next.js / Fetch API Request object.
 * @returns {string} Sanitized client IP address string or fallback '127.0.0.1'.
 * @throws {never} Handles missing or malformed headers safely.
 */
export function extractClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp && /^[0-9a-fA-F:.]+$/.test(firstIp)) {
      return firstIp;
    }
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp && /^[0-9a-fA-F:.]+$/.test(realIp)) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
