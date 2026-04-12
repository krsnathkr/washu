interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * Returns the cached data for `key` if it hasn't expired.
 * Otherwise, calls `fetcher`, caches the result for `ttlMs` milliseconds, and returns it.
 */
export async function getOrSet<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key);

  if (entry && entry.expiry > now) {
    return entry.data as T;
  }

  const data = await fetcher();
  cache.set(key, {
    data,
    expiry: now + ttlMs,
  });

  return data;
}
