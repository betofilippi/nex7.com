import { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';

export interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

export class RateLimiter {
  private cache: LRUCache<string, number[]>;

  constructor(private config: RateLimitConfig) {
    this.cache = new LRUCache<string, number[]>({
      max: 10000, // Max number of unique tokens to track
      ttl: config.interval,
    });
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.config.interval;

    // Get existing timestamps for this identifier
    let timestamps = this.cache.get(identifier) || [];
    
    // Filter out timestamps outside the current window
    timestamps = timestamps.filter(ts => ts > windowStart);

    // Check if limit is exceeded
    if (timestamps.length >= this.config.uniqueTokenPerInterval) {
      const oldestTimestamp = Math.min(...timestamps);
      const reset = new Date(oldestTimestamp + this.config.interval);
      
      return {
        success: false,
        limit: this.config.uniqueTokenPerInterval,
        remaining: 0,
        reset,
      };
    }

    // Add current timestamp
    timestamps.push(now);
    this.cache.set(identifier, timestamps);

    const reset = new Date(now + this.config.interval);

    return {
      success: true,
      limit: this.config.uniqueTokenPerInterval,
      remaining: this.config.uniqueTokenPerInterval - timestamps.length,
      reset,
    };
  }

  reset(identifier: string): void {
    this.cache.delete(identifier);
  }

  resetAll(): void {
    this.cache.clear();
  }
}

// Predefined rate limit tiers
export const RateLimitTiers = {
  free: {
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 100,
  },
  basic: {
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 1000,
  },
  pro: {
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 10000,
  },
  enterprise: {
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 100000,
  },
};

// Middleware helper
export async function checkRateLimit(
  request: NextRequest,
  apiKey: string,
  tier: keyof typeof RateLimitTiers = 'free'
): Promise<RateLimitResult> {
  const limiter = new RateLimiter(RateLimitTiers[tier]);
  const identifier = `api:${apiKey}`;
  
  return limiter.check(identifier);
}

// Headers helper
export function setRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult
): void {
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toISOString());
}