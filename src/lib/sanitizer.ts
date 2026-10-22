import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes untrusted string input by removing potential HTML tags, scripts,
 * and dangerous URI protocols to guarantee zero-trust input safety.
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  // Sanitize with DOMPurify allowing only pure text content
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
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
