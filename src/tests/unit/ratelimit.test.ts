import { describe, it, expect } from 'vitest';
import { extractClientIp } from '@/lib/ratelimit';

describe('Rate Limiter & IP Sanitization', () => {
  it('extracts real IP from x-forwarded-for header with proxy sanitization', () => {
    const reqWithForwarded = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' },
    });
    expect(extractClientIp(reqWithForwarded)).toBe('203.0.113.195');

    const reqWithRealIp = new Request('https://example.com', {
      headers: { 'x-real-ip': '198.51.100.22' },
    });
    expect(extractClientIp(reqWithRealIp)).toBe('198.51.100.22');

    const reqFallback = new Request('https://example.com');
    expect(extractClientIp(reqFallback)).toBe('127.0.0.1');
  });

  it('rejects spoofed non-IP characters', () => {
    const reqSpoofed = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '<script>alert(1)</script>' },
    });
    expect(extractClientIp(reqSpoofed)).toBe('127.0.0.1');
  });
});
