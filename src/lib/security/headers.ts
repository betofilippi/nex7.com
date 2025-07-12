import { NextRequest, NextResponse } from 'next/server';

// Content Security Policy configuration
export interface CSPConfig {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  fontSrc?: string[];
  connectSrc?: string[];
  mediaSrc?: string[];
  objectSrc?: string[];
  frameSrc?: string[];
  baseUri?: string[];
  formAction?: string[];
  frameAncestors?: string[];
  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
}

// Default CSP configuration
const defaultCSP: CSPConfig = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdnjs.cloudflare.com'],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  connectSrc: ["'self'", 'https://api.anthropic.com', 'wss:', 'https:'],
  mediaSrc: ["'self'"],
  objectSrc: ["'none'"],
  frameSrc: ["'self'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  upgradeInsecureRequests: true,
  blockAllMixedContent: true,
};

// Build CSP header string
export function buildCSP(config: CSPConfig = defaultCSP): string {
  const directives: string[] = [];
  
  // Add each directive
  if (config.defaultSrc) {
    directives.push(`default-src ${config.defaultSrc.join(' ')}`);
  }
  if (config.scriptSrc) {
    directives.push(`script-src ${config.scriptSrc.join(' ')}`);
  }
  if (config.styleSrc) {
    directives.push(`style-src ${config.styleSrc.join(' ')}`);
  }
  if (config.imgSrc) {
    directives.push(`img-src ${config.imgSrc.join(' ')}`);
  }
  if (config.fontSrc) {
    directives.push(`font-src ${config.fontSrc.join(' ')}`);
  }
  if (config.connectSrc) {
    directives.push(`connect-src ${config.connectSrc.join(' ')}`);
  }
  if (config.mediaSrc) {
    directives.push(`media-src ${config.mediaSrc.join(' ')}`);
  }
  if (config.objectSrc) {
    directives.push(`object-src ${config.objectSrc.join(' ')}`);
  }
  if (config.frameSrc) {
    directives.push(`frame-src ${config.frameSrc.join(' ')}`);
  }
  if (config.baseUri) {
    directives.push(`base-uri ${config.baseUri.join(' ')}`);
  }
  if (config.formAction) {
    directives.push(`form-action ${config.formAction.join(' ')}`);
  }
  if (config.frameAncestors) {
    directives.push(`frame-ancestors ${config.frameAncestors.join(' ')}`);
  }
  if (config.upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }
  if (config.blockAllMixedContent) {
    directives.push('block-all-mixed-content');
  }
  
  return directives.join('; ');
}

// Security headers configuration
export interface SecurityHeadersConfig {
  csp?: CSPConfig | false;
  hsts?: {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  } | false;
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | false;
  xContentTypeOptions?: boolean;
  xXssProtection?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: Record<string, string[]>;
  customHeaders?: Record<string, string>;
}

// Default security headers configuration
const defaultSecurityHeaders: SecurityHeadersConfig = {
  csp: defaultCSP,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: false,
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: true,
  xXssProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
  },
};

// Build Permissions-Policy header
export function buildPermissionsPolicy(policy: Record<string, string[]>): string {
  return Object.entries(policy)
    .map(([feature, allowList]) => {
      if (allowList.length === 0) {
        return `${feature}=()`;
      }
      return `${feature}=(${allowList.join(' ')})`;
    })
    .join(', ');
}

// Apply security headers to response
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = defaultSecurityHeaders
): NextResponse {
  // Content Security Policy
  if (config.csp !== false) {
    const cspHeader = buildCSP(config.csp);
    response.headers.set('Content-Security-Policy', cspHeader);
  }
  
  // HTTP Strict Transport Security
  if (config.hsts !== false && config.hsts) {
    let hstsValue = `max-age=${config.hsts.maxAge}`;
    if (config.hsts.includeSubDomains) {
      hstsValue += '; includeSubDomains';
    }
    if (config.hsts.preload) {
      hstsValue += '; preload';
    }
    response.headers.set('Strict-Transport-Security', hstsValue);
  }
  
  // X-Frame-Options
  if (config.xFrameOptions !== false && config.xFrameOptions) {
    response.headers.set('X-Frame-Options', config.xFrameOptions);
  }
  
  // X-Content-Type-Options
  if (config.xContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }
  
  // X-XSS-Protection (legacy, but still useful for older browsers)
  if (config.xXssProtection) {
    response.headers.set('X-XSS-Protection', '1; mode=block');
  }
  
  // Referrer-Policy
  if (config.referrerPolicy) {
    response.headers.set('Referrer-Policy', config.referrerPolicy);
  }
  
  // Permissions-Policy
  if (config.permissionsPolicy) {
    const permissionsPolicyHeader = buildPermissionsPolicy(config.permissionsPolicy);
    response.headers.set('Permissions-Policy', permissionsPolicyHeader);
  }
  
  // Custom headers
  if (config.customHeaders) {
    Object.entries(config.customHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  return response;
}

// Security headers middleware
export function securityHeaders(config?: SecurityHeadersConfig) {
  return async function middleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const response = await handler(request);
    return applySecurityHeaders(response, config);
  };
}

// Helper to create secure API route
export function withSecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: SecurityHeadersConfig
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    const response = await handler(req);
    return applySecurityHeaders(response, config);
  };
}

// Environment-specific configurations
export const securityConfigs = {
  // Development configuration (more relaxed)
  development: {
    csp: {
      ...defaultCSP,
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
    hsts: false, // Disable HSTS in development
    xFrameOptions: 'SAMEORIGIN' as const,
  },
  
  // Production configuration (strict)
  production: {
    csp: {
      ...defaultCSP,
      scriptSrc: ["'self'", "'strict-dynamic'", "'nonce-'"], // Use nonces in production
      upgradeInsecureRequests: true,
    },
    hsts: {
      maxAge: 63072000, // 2 years
      includeSubDomains: true,
      preload: true,
    },
    xFrameOptions: 'DENY' as const,
  },
};

// Get configuration based on environment
export function getSecurityConfig(): SecurityHeadersConfig {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production' ? securityConfigs.production : securityConfigs.development;
}

// Nonce generation for CSP
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

// Apply nonce to CSP
export function applyNonceToCSP(csp: string, nonce: string): string {
  return csp.replace("'nonce-'", `'nonce-${nonce}'`);
}