/**
 * @fileoverview Lightweight in-memory Least-Recently-Used (LRU) cache with Time-To-Live (TTL)
 * expiration and deterministic payload hashing to minimize redundant LLM generation calls.
 */

/**
 * Storage wrapper representing a cached value alongside its expiration epoch.
 *
 * @template T
 */
interface CacheEntry<T> {
  /** The cached value payload */
  value: T;
  /** Epoch milliseconds when this cache entry expires */
  expiresAt: number;
}

/**
 * Generic Least Recently Used (LRU) in-memory cache supporting size bounding and TTL invalidation.
 *
 * @template T
 */
export class SimpleLruMemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxEntries: number;
  private defaultTtlMs: number;

  /**
   * Creates a new LRU cache instance.
   *
   * @param {number} [maxEntries=100] - Maximum entry count before oldest keys are evicted.
   * @param {number} [defaultTtlSeconds=600] - Default time-to-live in seconds.
   */
  constructor(maxEntries = 100, defaultTtlSeconds = 600) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlSeconds * 1000;
  }

  /**
   * Retrieves a non-expired entry from the cache, refreshing its recency rank.
   *
   * @param {string} key - Cache lookup key.
   * @returns {T | null} Cached value or null if missing or expired.
   * @throws {never}
   */
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

  /**
   * Sets or updates an entry in the cache, evicting the oldest key if maximum capacity is reached.
   *
   * @param {string} key - Storage key.
   * @param {T} value - Payload to store.
   * @param {number} [ttlSeconds] - Optional override TTL in seconds.
   * @returns {void}
   * @throws {never}
   */
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

  /**
   * Empties all items from the cache.
   *
   * @returns {void}
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Returns current count of stored cache keys.
   *
   * @returns {number} Active entry count.
   */
  public size(): number {
    return this.cache.size;
  }
}

/**
 * Singleton cache instance for full event plan generation responses.
 */
export const planGenerationCache = new SimpleLruMemoryCache<unknown>(100, 3600);

/**
 * Singleton cache instance for dynamic follow-up clarification questions.
 */
export const followupCache = new SimpleLruMemoryCache<unknown>(100, 3600);

/**
 * Generates a deterministic hash cache key from an arbitrary payload object.
 *
 * @param {string} prefix - Domain prefix for key namespacing.
 * @param {unknown} payload - Arbitrary payload object or value.
 * @returns {string} String cache key.
 * @throws {never} Safely catches serialization issues and falls back to a timestamped key.
 */
export function createPayloadKey(prefix: string, payload: unknown): string {
  try {
    const serialized = JSON.stringify(payload);
    // Deterministic 32-bit hash calculation
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
