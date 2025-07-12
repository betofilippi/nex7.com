import { RateLimiterOptions, RateLimitInfo, RateLimitResult } from './rate-limiter';

// Interface for Redis-like storage
export interface RateLimiterStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlMs?: number): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, ttlMs: number): Promise<void>;
  del(key: string): Promise<void>;
}

// In-memory store implementation (fallback when Redis is not available)
export class MemoryStore implements RateLimiterStore {
  private store: Map<string, { value: string; expireAt?: number }> = new Map();
  
  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expireAt && item.expireAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  async set(key: string, value: string, ttlMs?: number): Promise<void> {
    const expireAt = ttlMs ? Date.now() + ttlMs : undefined;
    this.store.set(key, { value, expireAt });
  }
  
  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const value = (parseInt(current || '0') + 1).toString();
    const item = this.store.get(key);
    const expireAt = item?.expireAt;
    this.store.set(key, { value, expireAt });
    return parseInt(value);
  }
  
  async expire(key: string, ttlMs: number): Promise<void> {
    const item = this.store.get(key);
    if (item) {
      item.expireAt = Date.now() + ttlMs;
    }
  }
  
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
  
  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expireAt && item.expireAt < now) {
        this.store.delete(key);
      }
    }
  }
}

// Distributed rate limiter using sliding window algorithm
export class DistributedRateLimiter {
  private store: RateLimiterStore;
  private windowMs: number;
  private maxRequests: number;
  private maxRequestsAuthenticated: number;
  private keyPrefix: string;
  private standardHeaders: boolean;
  private legacyHeaders: boolean;
  
  constructor(
    store: RateLimiterStore,
    options: RateLimiterOptions & { keyPrefix?: string }
  ) {
    this.store = store;
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.maxRequestsAuthenticated = options.maxRequestsAuthenticated || options.maxRequests * 2;
    this.keyPrefix = options.keyPrefix || 'ratelimit:';
    this.standardHeaders = options.standardHeaders !== false;
    this.legacyHeaders = options.legacyHeaders || false;
  }
  
  private getKey(identifier: string): string {
    return `${this.keyPrefix}${identifier}`;
  }
  
  async checkLimit(
    identifier: string,
    isAuthenticated: boolean = false,
    skipCount: boolean = false
  ): Promise<RateLimitResult> {
    const key = this.getKey(identifier);
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const limit = isAuthenticated ? this.maxRequestsAuthenticated : this.maxRequests;
    
    // Get current count and timestamps
    const countKey = `${key}:count`;
    const timestampsKey = `${key}:timestamps`;
    
    // Get timestamps within the window
    const timestampsData = await this.store.get(timestampsKey);
    let timestamps: number[] = timestampsData ? JSON.parse(timestampsData) : [];
    
    // Filter out old timestamps
    timestamps = timestamps.filter(ts => ts > windowStart);
    
    const current = timestamps.length;
    const remaining = Math.max(0, limit - current);
    const resetTime = new Date(now + this.windowMs);
    
    const info: RateLimitInfo = {
      limit,
      current,
      remaining,
      resetTime
    };
    
    // Check if limit exceeded
    if (current >= limit) {
      const oldestRequest = timestamps[0];
      const retryAfter = oldestRequest + this.windowMs - now;
      return {
        allowed: false,
        retryAfter: Math.ceil(retryAfter / 1000),
        info
      };
    }
    
    // Add current request if not skipping
    if (!skipCount) {
      timestamps.push(now);
      await this.store.set(timestampsKey, JSON.stringify(timestamps), this.windowMs);
    }
    
    return { allowed: true, info };
  }
  
  // Generate rate limit headers
  generateHeaders(info: RateLimitInfo, retryAfter?: number): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.standardHeaders) {
      headers['RateLimit-Limit'] = info.limit.toString();
      headers['RateLimit-Remaining'] = info.remaining.toString();
      headers['RateLimit-Reset'] = info.resetTime.toISOString();
    }
    
    if (this.legacyHeaders) {
      headers['X-RateLimit-Limit'] = info.limit.toString();
      headers['X-RateLimit-Remaining'] = info.remaining.toString();
      headers['X-RateLimit-Reset'] = Math.floor(info.resetTime.getTime() / 1000).toString();
    }
    
    if (retryAfter !== undefined) {
      headers['Retry-After'] = retryAfter.toString();
    }
    
    return headers;
  }
  
  async reset(identifier?: string): Promise<void> {
    if (identifier) {
      const key = this.getKey(identifier);
      await this.store.del(`${key}:count`);
      await this.store.del(`${key}:timestamps`);
    } else {
      // Reset all would require scanning keys, which is expensive
      // This should be implemented based on the specific store
      console.warn('Reset all is not implemented for distributed rate limiter');
    }
  }
}

// Factory function to create rate limiter based on environment
export function createRateLimiter(
  options: RateLimiterOptions & { keyPrefix?: string },
  store?: RateLimiterStore
): DistributedRateLimiter {
  // Use provided store or default to memory store
  const limiterStore = store || new MemoryStore();
  
  // Periodically cleanup memory store if using it
  if (limiterStore instanceof MemoryStore) {
    setInterval(() => {
      limiterStore.cleanup();
    }, 60 * 1000); // Cleanup every minute
  }
  
  return new DistributedRateLimiter(limiterStore, options);
}

// Export configured rate limiters
export const distributedApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  maxRequestsAuthenticated: 100,
  standardHeaders: true,
  keyPrefix: 'ratelimit:api:'
});

export const distributedAuthRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  maxRequestsAuthenticated: 10,
  standardHeaders: true,
  keyPrefix: 'ratelimit:auth:'
});

export const distributedStreamRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  maxRequestsAuthenticated: 30,
  standardHeaders: true,
  keyPrefix: 'ratelimit:stream:'
});