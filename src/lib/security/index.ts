// Export all security modules
export * from './csrf';
export * from './validation';
export * from './headers';
export * from './audit';
export * from './api-keys';
export * from './webhooks';

import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders, getSecurityConfig } from './headers';
import { csrfProtection, addCSRFToken } from './csrf';
import { createRateLimitMiddleware, getClientIdentifier, apiRateLimiter, authRateLimiter } from '../rate-limiter';
import { validateRequest } from './validation';
import { auditMiddleware, getAuditLogger, AuditEventType } from './audit';
import { apiKeyAuth } from './api-keys';
import { z } from 'zod';

// Security middleware options
export interface SecurityMiddlewareOptions {
  csrf?: boolean;
  rateLimit?: boolean;
  rateLimiter?: any; // RateLimiter instance
  securityHeaders?: boolean;
  audit?: boolean;
  apiKey?: boolean;
  validation?: z.ZodSchema;
  validateSize?: number;
}

// Combined security middleware
export function securityMiddleware(options: SecurityMiddlewareOptions = {}) {
  return async function middleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      // Apply rate limiting
      if (options.rateLimit !== false) {
        const limiter = options.rateLimiter || apiRateLimiter;
        const identifier = getClientIdentifier(request);
        const isAuthenticated = !!request.cookies.get('auth-token')?.value || 
                              !!request.headers.get('authorization');
        
        const result = await limiter.checkLimit(identifier, isAuthenticated);
        
        if (!result.allowed) {
          const response = NextResponse.json(
            {
              error: 'Too Many Requests',
              message: `Rate limit exceeded. Please retry after ${result.retryAfter} seconds.`,
              retryAfter: result.retryAfter,
            },
            { status: 429 }
          );
          
          // Add rate limit headers
          const headers = limiter.generateHeaders(result.info, result.retryAfter);
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          
          // Log rate limit exceeded
          if (options.audit !== false) {
            await getAuditLogger().log({
              eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
              ipAddress: identifier,
              resource: request.nextUrl.pathname,
              result: 'failure',
              metadata: { method: request.method },
            });
          }
          
          return response;
        }
      }
      
      // Apply CSRF protection
      if (options.csrf && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const csrfResult = await csrfProtection(request, handler);
        if (csrfResult.status === 403) {
          return csrfResult;
        }
      }
      
      // Apply validation if schema provided
      if (options.validation) {
        const validationResult = await validateRequest(options.validation)(request, handler);
        if (validationResult.status === 400) {
          return validationResult;
        }
      }
      
      // Apply size validation
      if (options.validateSize) {
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > options.validateSize) {
          return NextResponse.json(
            {
              error: 'Request too large',
              message: `Request body exceeds maximum size of ${options.validateSize} bytes`,
            },
            { status: 413 }
          );
        }
      }
      
      // Execute handler
      let response = await handler(request);
      
      // Apply security headers
      if (options.securityHeaders !== false) {
        response = applySecurityHeaders(response, getSecurityConfig());
      }
      
      // Add CSRF token to response if needed
      if (options.csrf && request.method === 'GET') {
        response = await addCSRFToken(response);
      }
      
      // Audit logging
      if (options.audit !== false) {
        const duration = Date.now();
        await getAuditLogger().log({
          eventType: AuditEventType.API_CALL,
          ipAddress: getClientIdentifier(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
          resource: request.nextUrl.pathname,
          action: request.method,
          result: response.status >= 400 ? 'failure' : 'success',
          metadata: {
            statusCode: response.status,
            method: request.method,
          },
        });
      }
      
      return response;
    } catch (error) {
      console.error('Security middleware error:', error);
      
      // Audit the error
      if (options.audit !== false) {
        await getAuditLogger().log({
          eventType: AuditEventType.API_CALL,
          ipAddress: getClientIdentifier(request),
          resource: request.nextUrl.pathname,
          action: request.method,
          result: 'failure',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}

// Preset security configurations
export const securityPresets = {
  // Public API endpoints (minimal security)
  public: {
    rateLimit: true,
    securityHeaders: true,
    audit: true,
  },
  
  // Authenticated API endpoints
  authenticated: {
    csrf: true,
    rateLimit: true,
    securityHeaders: true,
    audit: true,
  },
  
  // Admin API endpoints
  admin: {
    csrf: true,
    rateLimit: true,
    securityHeaders: true,
    audit: true,
    validateSize: 10 * 1024 * 1024, // 10MB max
  },
  
  // External API endpoints (API key auth)
  external: {
    apiKey: true,
    rateLimit: true,
    securityHeaders: true,
    audit: true,
  },
  
  // Webhook endpoints
  webhook: {
    rateLimit: true,
    securityHeaders: true,
    audit: true,
    validateSize: 5 * 1024 * 1024, // 5MB max
  },
};

// Helper to create secure API route handlers
export function createSecureApiHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: SecurityMiddlewareOptions = securityPresets.authenticated
): (req: NextRequest) => Promise<NextResponse> {
  return securityMiddleware(options)(handler);
}

// Export common security utilities
export { z } from 'zod';
export { validators, requestSchemas, sanitizers } from './validation';
export { getClientIdentifier, authRateLimiter, apiRateLimiter } from '../rate-limiter';

// Initialize all security services
export function initializeSecurity(): void {
  // Initialize audit logger
  const { initializeAuditLogger } = require('./audit');
  initializeAuditLogger();
  
  // Initialize API key manager
  const { initializeApiKeyManager } = require('./api-keys');
  initializeApiKeyManager();
  
  // Initialize webhook manager
  const { initializeWebhookManager } = require('./webhooks');
  initializeWebhookManager();
}