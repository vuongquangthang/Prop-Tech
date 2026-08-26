type CacheEntry<T> = {
  value: T;
  savedAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

export function getCurrentDataCacheScope() {
  try {
    const rawUser = sessionStorage.getItem('user') || localStorage.getItem('user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    return String(user?.ownerUserId ?? user?.OwnerUserId ?? user?.id ?? user?.Id ?? 'anonymous');
  } catch {
    return 'anonymous';
  }
}

export function getCachedData<T>(key: string, ttlMs: number): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (Date.now() - entry.savedAt > ttlMs) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

export function setCachedData<T>(key: string, value: T) {
  cache.set(key, {
    value,
    savedAt: Date.now(),
  });
}

export function invalidateCachedData(keyPrefix: string) {
  Array.from(cache.keys()).forEach((key) => {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key);
    }
  });
}
