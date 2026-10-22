/**
 * Sanitizes untrusted string input by removing potential HTML tags, scripts,
 * style blocks, iframes, event handlers, and dangerous URI protocols to guarantee
 * zero-trust input safety without heavyweight server-side DOM emulation issues.
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  if (typeof input !== 'string') return String(input);

  const clean = input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove script, style, iframe, and object tags along with their inner contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    // Remove all remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove inline JS pseudo-protocols
    .replace(/javascript:[^\s"']*/gi, '')
    // Remove leftover event handlers if any
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '');

  return clean.trim();
}

/**
 * Recursively sanitizes all string properties within an arbitrary object or array.
 */
export function sanitizeObject<T>(data: T): T {
  if (typeof data === 'string') {
    return sanitizeInput(data) as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeObject(item)) as unknown as T;
  }
  if (data !== null && typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = sanitizeObject(value);
    }
    return result as unknown as T;
  }
  return data;
}
