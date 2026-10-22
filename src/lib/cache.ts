interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class SimpleLruMemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxEntries: number;
  private defaultTtlMs: number;

  constructor(maxEntries = 100, defaultTtlSeconds = 600) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlSeconds * 1000;
  }

  public get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU order
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  public set(key: string, value: T, ttlSeconds?: number): void {
    const ttlMs = ttlSeconds ? ttlSeconds * 1000 : this.defaultTtlMs;
    const expiresAt = Date.now() + ttlMs;

    if (this.cache.size >= this.maxEntries) {
      // Evict oldest (first key in map)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { value, expiresAt });
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}

export const planGenerationCache = new SimpleLruMemoryCache<unknown>(100, 3600);
export const followupCache = new SimpleLruMemoryCache<unknown>(100, 3600);

export function createPayloadKey(prefix: string, payload: unknown): string {
  try {
    const serialized = JSON.stringify(payload);
    // Simple deterministic hash
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      const char = serialized.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `${prefix}:${hash}`;
  } catch {
    return `${prefix}:${Date.now()}`;
  }
}
