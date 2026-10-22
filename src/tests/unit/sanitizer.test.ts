import { describe, it, expect } from 'vitest';
import { sanitizeInput, sanitizeObject } from '@/lib/sanitizer';

describe('Sanitizer - DOMPurify Hardening', () => {
  it('strips dangerous HTML tags, script blocks, and event handlers', () => {
    const maliciousInput =
      '<script>alert("pwned")</script>Traditional Wedding<img src=x onerror=alert(1)>';
    const clean = sanitizeInput(maliciousInput);

    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('onerror');
    expect(clean).toContain('Traditional Wedding');
  });

  it('safely handles empty or null inputs', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput('   ')).toBe('');
  });

  it('recursively sanitizes nested object and array payloads', () => {
    const dirtyPayload = {
      title: '<b>Gala</b>',
      categories: ['<iframe src="evil.com"></iframe>Catering', 'Decor'],
      nested: {
        nonNegotiables: '<a href="javascript:alert(1)">Strict Jain</a>',
      },
    };

    const sanitized = sanitizeObject(dirtyPayload);
    expect(sanitized.title).toBe('Gala');
    expect(sanitized.categories[0]).toBe('Catering');
    expect(sanitized.nested.nonNegotiables).toBe('Strict Jain');
  });
});
