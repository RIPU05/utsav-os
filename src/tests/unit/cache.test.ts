import { describe, it, expect } from 'vitest';
import {
  SimpleLruMemoryCache,
  createPayloadKey,
  planGenerationCache,
  followupCache,
} from '@/lib/cache';

describe('LRU Memory Cache & Key Construction', () => {
  it('stores and retrieves items correctly', () => {
    const cache = new SimpleLruMemoryCache<string>(3, 60);
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
    expect(cache.size()).toBe(1);

    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get('key1')).toBeNull();
  });

  it('evicts oldest items when max capacity is exceeded', () => {
    const cache = new SimpleLruMemoryCache<string>(2, 60);
    cache.set('k1', 'v1');
    cache.set('k2', 'v2');
    cache.set('k3', 'v3'); // should evict k1

    expect(cache.get('k1')).toBeNull();
    expect(cache.get('k2')).toBe('v2');
    expect(cache.get('k3')).toBe('v3');
  });

  it('evicts expired items on access', () => {
    const cache = new SimpleLruMemoryCache<string>(5, -10); // already expired
    cache.set('expiredKey', 'value');
    expect(cache.get('expiredKey')).toBeNull();
  });

  it('generates consistent payload keys', () => {
    const keyA = createPayloadKey('test', { city: 'Jaipur', guests: 200 });
    const keyB = createPayloadKey('test', { city: 'Jaipur', guests: 200 });
    expect(keyA).toBe(keyB);
  });

  it('handles circular references safely in createPayloadKey', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const key = createPayloadKey('circ', circular);
    expect(key).toContain('circ:');
  });

  it('operates singleton caches correctly', () => {
    planGenerationCache.set('test-singleton', { ok: true });
    expect(planGenerationCache.get('test-singleton')).toEqual({ ok: true });
    followupCache.set('test-followup', { q: 1 });
    expect(followupCache.get('test-followup')).toEqual({ q: 1 });
  });
});
