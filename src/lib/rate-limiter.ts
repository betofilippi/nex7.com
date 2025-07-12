export interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

export class RateLimiter {
  private requests: Map<string, number[]>;
  private windowMs: number;
  private maxRequests: number;

  constructor(options: RateLimiterOptions) {
    this.requests = new Map();
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  async checkLimit(identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    let userRequests = this.requests.get(identifier) || [];
    
    // Filter out requests outside the current window
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (userRequests.length >= this.maxRequests) {
      const oldestRequest = userRequests[0];
      const retryAfter = oldestRequest + this.windowMs - now;
      return { allowed: false, retryAfter: Math.ceil(retryAfter / 1000) };
    }
    
    // Add current request
    userRequests.push(now);
    this.requests.set(identifier, userRequests);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }
    
    return { allowed: true };
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter(ts => ts > windowStart);
      if (filtered.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, filtered);
      }
    }
  }

  reset(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }
}

// Create default rate limiter instances
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
});

export const streamRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 streaming requests per minute
});