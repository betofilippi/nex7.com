export interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  maxRequestsAuthenticated?: number; // Higher limit for authenticated users
  keyGenerator?: (req: any) => string; // Custom key generator function
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  standardHeaders?: boolean; // Return rate limit info in headers
  legacyHeaders?: boolean; // Return rate limit info in legacy headers
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  info: RateLimitInfo;
}

export class RateLimiter {
  private requests: Map<string, number[]>;
  private windowMs: number;
  private maxRequests: number;
  private maxRequestsAuthenticated: number;
  private keyGenerator?: (req: any) => string;
  private skipSuccessfulRequests: boolean;
  private skipFailedRequests: boolean;
  private standardHeaders: boolean;
  private legacyHeaders: boolean;

  constructor(options: RateLimiterOptions) {
    this.requests = new Map();
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.maxRequestsAuthenticated = options.maxRequestsAuthenticated || options.maxRequests * 2;
    this.keyGenerator = options.keyGenerator;
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
    this.standardHeaders = options.standardHeaders !== false;
    this.legacyHeaders = options.legacyHeaders || false;
  }

  async checkLimit(
    identifier: string,
    isAuthenticated: boolean = false,
    skipCount: boolean = false
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const limit = isAuthenticated ? this.maxRequestsAuthenticated : this.maxRequests;

    // Get existing requests for this identifier
    let userRequests = this.requests.get(identifier) || [];
    
    // Filter out requests outside the current window
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    const current = userRequests.length;
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
      const oldestRequest = userRequests[0];
      const retryAfter = oldestRequest + this.windowMs - now;
      return { 
        allowed: false, 
        retryAfter: Math.ceil(retryAfter / 1000),
        info
      };
    }
    
    // Add current request if not skipping
    if (!skipCount) {
      userRequests.push(now);
      this.requests.set(identifier, userRequests);
    }
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
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

// Rate limiter configurations for different endpoints
export const rateLimiterConfigs = {
  // General API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute for anonymous
    maxRequestsAuthenticated: 100, // 100 requests per minute for authenticated
    standardHeaders: true,
  },
  
  // Authentication endpoints (stricter limits)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    maxRequestsAuthenticated: 10, // Slightly higher for authenticated users
    skipSuccessfulRequests: true, // Only count failed attempts
    standardHeaders: true,
  },
  
  // Streaming endpoints
  stream: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 streaming requests per minute
    maxRequestsAuthenticated: 30, // 30 for authenticated users
    standardHeaders: true,
  },
  
  // File upload endpoints
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 uploads per minute
    maxRequestsAuthenticated: 20, // 20 for authenticated users
    standardHeaders: true,
  },
  
  // Webhook endpoints
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 webhook calls per minute
    maxRequestsAuthenticated: 500, // 500 for authenticated services
    standardHeaders: true,
  },
};

// Create rate limiter instances
export const apiRateLimiter = new RateLimiter(rateLimiterConfigs.api);
export const authRateLimiter = new RateLimiter(rateLimiterConfigs.auth);
export const streamRateLimiter = new RateLimiter(rateLimiterConfigs.stream);
export const uploadRateLimiter = new RateLimiter(rateLimiterConfigs.upload);
export const webhookRateLimiter = new RateLimiter(rateLimiterConfigs.webhook);

// Reserved for future AI integration rate limiters

// Helper function to get IP address from request
export function getClientIdentifier(req: any): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const forwarded = req.headers.get('x-forwarded-for');
  const real = req.headers.get('x-real-ip');
  const cloudflare = req.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (real) {
    return real;
  }
  if (cloudflare) {
    return cloudflare;
  }
  
  // Fallback to a generic identifier
  return 'unknown-client';
}

// Helper function to create a rate limiter middleware for Next.js API routes
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async function rateLimitMiddleware(
    req: any,
    res: any,
    next: () => void
  ) {
    const identifier = getClientIdentifier(req);
    const isAuthenticated = !!req.user || !!req.headers.get('authorization');
    
    const result = await limiter.checkLimit(identifier, isAuthenticated);
    
    // Add headers
    const headers = limiter.generateHeaders(result.info, result.retryAfter);
    Object.entries(headers).forEach(([key, value]) => {
      res.headers.set(key, value);
    });
    
    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Please retry after ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
      });
    }
    
    next();
  };
}