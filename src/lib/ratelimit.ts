export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

interface BucketRecord {
  tokens: number;
  lastRefill: number;
}

const DEFAULT_CAPACITY = 30; // Max requests per window
const DEFAULT_WINDOW_MS = 60 * 1000; // 60 seconds

class TokenBucketRateLimiter {
  private buckets = new Map<string, BucketRecord>();
  private capacity: number;
  private windowMs: number;

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

export const planRateLimiter = new TokenBucketRateLimiter(
  Number(process.env.RATE_LIMIT_MAX_REQUESTS || DEFAULT_CAPACITY),
  Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 60) * 1000
);

/**
 * Extracts and sanitizes client IP address from proxy request headers.
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
