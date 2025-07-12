import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import path from 'path';

// Security headers to add to all responses
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Content Security Policy for Claude endpoints
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'frame-ancestors': ["'none'"],
};

// Generate CSP header string
function generateCSP(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}

// Validate webhook signatures
export function validateWebhookSignature(
  request: NextRequest,
  payload: string,
  secret: string
): boolean {
  const signature = request.headers.get('x-webhook-signature');
  if (!signature) return false;

  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')}`;

  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Validate internal API key
export function validateInternalAPIKey(
  request: NextRequest,
  expectedKey: string
): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const providedKey = authHeader.substring(7);
  
  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(providedKey),
    Buffer.from(expectedKey)
  );
}

// Security middleware for Claude endpoints
export function claudeSecurityMiddleware(request: NextRequest): NextResponse | null {
  // Check if this is a Claude endpoint
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith('/api/claude/')) {
    return null;
  }

  // Create response headers
  const headers = new Headers();
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  // Add CSP header
  headers.set('Content-Security-Policy', generateCSP());

  // Add request ID for tracing
  const requestId = crypto.randomUUID();
  headers.set('X-Request-ID', requestId);

  // Log request for monitoring
  console.log(`[Claude Security] ${request.method} ${pathname} - Request ID: ${requestId}`);

  // For OPTIONS requests, return early with CORS headers
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...Object.fromEntries(headers),
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Webhook-Signature',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Continue with the request
  return null;
}

// Sanitize command inputs
export function sanitizeCommand(command: string): string {
  // Remove potentially dangerous characters
  const sanitized = command
    .replace(/[;&|`$]/g, '') // Remove command chaining characters
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/[<>]/g, '') // Remove redirects
    .trim();

  return sanitized;
}

// Validate file paths
export function isPathSafe(filePath: string, basePath: string): boolean {
  const resolvedPath = path.resolve(basePath, filePath);
  return resolvedPath.startsWith(basePath);
}

// IP allowlist for internal services
const ALLOWED_IPS = process.env.CLAUDE_ALLOWED_IPS?.split(',') || [];

export function isIPAllowed(clientIP: string): boolean {
  if (ALLOWED_IPS.length === 0) return true; // No restriction if not configured
  return ALLOWED_IPS.includes(clientIP);
}

// Request validation schema
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateClaudeRequest(
  request: NextRequest,
  requireAuth: boolean = true
): ValidationResult {
  // Check content type
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return { valid: false, error: 'Invalid content type' };
  }

  // Check authorization if required
  if (requireAuth) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return { valid: false, error: 'Missing authorization' };
    }
  }

  // Check request size (10MB limit)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    return { valid: false, error: 'Request too large' };
  }

  return { valid: true };
}

// Error response helper
export function createSecurityErrorResponse(
  message: string,
  status: number = 403
): NextResponse {
  return NextResponse.json(
    {
      error: 'Security Error',
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}