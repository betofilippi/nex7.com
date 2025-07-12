import { LRUCache } from 'lru-cache';

interface CacheOptions {
  max?: number;
  ttl?: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache: LRUCache<string, any>;

  constructor(options: CacheOptions = {}) {
    this.cache = new LRUCache({
      max: options.max || 500,
      ttl: options.ttl || 1000 * 60 * 15, // 15 minutes default
    });
  }

  set(key: string, value: any, ttl?: number): void {
    this.cache.set(key, value, { ttl });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get(key) as T;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instances
export const apiCache = new MemoryCache({ max: 1000, ttl: 1000 * 60 * 5 }); // 5 minutes
export const dbCache = new MemoryCache({ max: 500, ttl: 1000 * 60 * 10 }); // 10 minutes
export const userCache = new MemoryCache({ max: 100, ttl: 1000 * 60 * 30 }); // 30 minutes

// Cache key generators
export const generateCacheKey = (prefix: string, ...args: (string | number)[]): string => {
  return `${prefix}:${args.join(':')}`;
};

// Cache decorators
export function withCache<T extends any[], R>(
  cache: MemoryCache,
  keyGenerator: (...args: T) => string,
  ttl?: number
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      const key = keyGenerator(...args);
      
      // Check cache first
      if (cache.has(key)) {
        return cache.get<R>(key)!;
      }

      // Execute original method
      const result = await method.apply(this, args);
      
      // Cache the result
      cache.set(key, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}

// Cache management utilities
export const invalidateCache = (pattern: string, cache: MemoryCache = apiCache): void => {
  const keys = cache.keys();
  const regex = new RegExp(pattern);
  
  keys.forEach(key => {
    if (regex.test(key)) {
      cache.delete(key);
    }
  });
};

export const warmupCache = async (
  keys: string[],
  fetcher: (key: string) => Promise<any>,
  cache: MemoryCache = apiCache
): Promise<void> => {
  const promises = keys.map(async (key) => {
    if (!cache.has(key)) {
      try {
        const data = await fetcher(key);
        cache.set(key, data);
      } catch (error) {
        console.error(`Failed to warmup cache for key: ${key}`, error);
      }
    }
  });

  await Promise.all(promises);
};

// API response caching middleware
export interface CachedResponse<T = any> {
  data: T;
  timestamp: number;
  etag?: string;
}

export const cacheResponse = <T>(
  data: T,
  ttl?: number,
  etag?: string
): CachedResponse<T> => ({
  data,
  timestamp: Date.now(),
  etag,
});

export const getCachedResponse = <T>(
  cache: MemoryCache,
  key: string
): CachedResponse<T> | null => {
  return cache.get<CachedResponse<T>>(key) || null;
};

export const isCacheValid = (
  cachedResponse: CachedResponse,
  maxAge: number
): boolean => {
  return Date.now() - cachedResponse.timestamp < maxAge;
};

// Redis-like operations for future Redis integration
export class RedisLikeCache extends MemoryCache {
  async setex(key: string, seconds: number, value: any): Promise<void> {
    this.set(key, value, seconds * 1000);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const value = this.get(key);
    if (value !== undefined) {
      this.set(key, value, seconds * 1000);
      return true;
    }
    return false;
  }

  async ttl(key: string): Promise<number> {
    // This would need actual Redis integration to get accurate TTL
    return this.has(key) ? 300 : -1; // Mock return 5 minutes or -1 if not exists
  }

  async mget(keys: string[]): Promise<(any | null)[]> {
    return keys.map(key => this.get(key) || null);
  }

  async mset(keyValuePairs: Record<string, any>): Promise<void> {
    Object.entries(keyValuePairs).forEach(([key, value]) => {
      this.set(key, value);
    });
  }
}

export const redisCache = new RedisLikeCache({ max: 2000, ttl: 1000 * 60 * 30 });