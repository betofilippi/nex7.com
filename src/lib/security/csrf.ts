import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const CSRF_SECRET = new TextEncoder().encode(
  process.env.CSRF_SECRET || process.env.JWT_SECRET || 'csrf-secret-change-in-production'
);

const CSRF_HEADER = 'X-CSRF-Token';
const CSRF_COOKIE = 'csrf-token';
const CSRF_FIELD = '_csrf';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Methods that require CSRF protection
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// Paths to skip CSRF protection (e.g., webhooks, API endpoints with other auth)
const SKIP_PATHS = [
  '/api/webhooks',
  '/api/auth/callback', // OAuth callbacks
  '/api/health',
];

export interface CSRFToken {
  token: string;
  expires: number;
}

// Generate a new CSRF token
export async function generateCSRFToken(): Promise<string> {
  const tokenData = {
    value: randomBytes(CSRF_TOKEN_LENGTH).toString('hex'),
    expires: Date.now() + CSRF_TOKEN_EXPIRY,
  };
  
  const token = await new SignJWT(tokenData)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(CSRF_SECRET);
  
  return token;
}

// Verify CSRF token
export async function verifyCSRFToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, CSRF_SECRET);
    return payload.expires ? payload.expires > Date.now() : true;
  } catch {
    return false;
  }
}

// Extract CSRF token from request
export function extractCSRFToken(request: NextRequest): string | null {
  // Check header first (preferred for AJAX requests)
  const headerToken = request.headers.get(CSRF_HEADER);
  if (headerToken) {
    return headerToken;
  }
  
  // Check cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  if (cookieToken) {
    return cookieToken;
  }
  
  // Check body for form submissions
  // Note: This requires parsing the body, which should be done carefully
  // to avoid consuming the body stream
  
  return null;
}

// CSRF middleware for Next.js API routes
export async function csrfProtection(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const method = request.method;
  const pathname = request.nextUrl.pathname;
  
  // Skip CSRF for safe methods
  if (!PROTECTED_METHODS.includes(method)) {
    return handler(request);
  }
  
  // Skip CSRF for excluded paths
  if (SKIP_PATHS.some(path => pathname.startsWith(path))) {
    return handler(request);
  }
  
  // Get token from request
  const token = extractCSRFToken(request);
  
  if (!token) {
    return NextResponse.json(
      { 
        error: 'CSRF token missing',
        message: 'This request requires a valid CSRF token'
      },
      { status: 403 }
    );
  }
  
  // Verify token
  const isValid = await verifyCSRFToken(token);
  
  if (!isValid) {
    return NextResponse.json(
      { 
        error: 'Invalid CSRF token',
        message: 'The provided CSRF token is invalid or expired'
      },
      { status: 403 }
    );
  }
  
  // Token is valid, proceed with the request
  return handler(request);
}

// Helper to create CSRF-protected API route
export function withCSRF(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return (req: NextRequest) => csrfProtection(req, handler);
}

// Middleware to add CSRF token to response
export async function addCSRFToken(response: NextResponse): Promise<NextResponse> {
  const token = await generateCSRFToken();
  
  // Set cookie
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 86400, // 24 hours
    path: '/',
  });
  
  // Also set in header for easy access by client
  response.headers.set(CSRF_HEADER, token);
  
  return response;
}

// Client-side helper to get CSRF token
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Try to get from meta tag first
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }
  
  // Try to get from cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE) {
      return decodeURIComponent(value);
    }
  }
  
  return null;
}

// Hook for React components
export function useCSRFToken(): { 
  token: string | null; 
  headers: Record<string, string> 
} {
  const token = getCSRFToken();
  
  return {
    token,
    headers: token ? { [CSRF_HEADER]: token } : {},
  };
}