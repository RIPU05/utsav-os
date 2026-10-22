import { describe, it, expect } from 'vitest';
import { SimpleLruMemoryCache, createPayloadKey } from '@/lib/cache';

describe('LRU Memory Cache & Key Construction', () => {
  it('stores and retrieves items correctly', () => {
    const cache = new SimpleLruMemoryCache<string>(3, 60);
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
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

  it('generates consistent payload keys', () => {
    const keyA = createPayloadKey('test', { city: 'Jaipur', guests: 200 });
    const keyB = createPayloadKey('test', { city: 'Jaipur', guests: 200 });
    expect(keyA).toBe(keyB);
  });
});
