# Security Features Documentation

This directory contains comprehensive security features for the Next.js application, following OWASP guidelines.

## Features Overview

### 1. Enhanced Rate Limiting (`rate-limiter.ts`, `distributed-rate-limiter.ts`)

- **Per-user rate limiting**: Authenticated users get higher limits
- **IP-based and token-based tracking**
- **Distributed rate limiting ready** (Redis-compatible)
- **Different limits for different endpoints**

```typescript
// Usage example
import { apiRateLimiter, authRateLimiter } from './lib/rate-limiter';

// Check rate limit
const result = await apiRateLimiter.checkLimit(identifier, isAuthenticated);
if (!result.allowed) {
  // Handle rate limit exceeded
}
```

### 2. CSRF Protection (`csrf.ts`)

- **Token-based CSRF protection**
- **Automatic token generation and validation**
- **Support for headers and cookies**

```typescript
// Usage in API routes
import { withCSRF } from './lib/security/csrf';

export const POST = withCSRF(async (req) => {
  // Your handler code
});
```

### 3. Input Validation (`validation.ts`)

- **Zod-based schema validation**
- **XSS prevention**
- **SQL injection prevention**
- **Request size limits**

```typescript
// Usage example
import { withValidation, requestSchemas } from './lib/security/validation';

export const POST = withValidation(
  requestSchemas.login,
  async (req, validatedData) => {
    // validatedData is type-safe and sanitized
  }
);
```

### 4. Security Headers (`headers.ts`)

- **Content Security Policy (CSP)**
- **HTTP Strict Transport Security (HSTS)**
- **X-Frame-Options**
- **X-Content-Type-Options**
- **Permissions Policy**

```typescript
// Applied automatically via middleware
// Or manually:
import { applySecurityHeaders } from './lib/security/headers';

const response = applySecurityHeaders(response);
```

### 5. Audit Logging (`audit.ts`)

- **Comprehensive event logging**
- **User activity tracking**
- **Security event monitoring**
- **Export capabilities**

```typescript
// Usage example
import { auditLogin, auditDataAccess } from './lib/security/audit';

// Log login attempt
await auditLogin(userId, email, ipAddress, userAgent, success);

// Log data access
await auditDataAccess(userId, 'users', userId, 'read');
```

### 6. API Key Management (`api-keys.ts`)

- **Secure API key generation**
- **Permission and scope management**
- **Key rotation support**
- **Expiration handling**

```typescript
// Create API key
const apiKey = await apiKeyManager.create({
  name: 'Production API',
  userId: user.id,
  permissions: [ApiKeyPermission.READ],
  scopes: [ApiKeyScope.USER],
  expiresIn: 90, // days
});

// Validate API key
const validation = await validateApiKey(apiKey);
```

### 7. Webhook Security (`webhooks.ts`)

- **Request signing with HMAC-SHA256**
- **Timestamp validation**
- **Retry logic with exponential backoff**
- **Event management**

```typescript
// Send webhook
await sendWebhook(config, {
  event: WebhookEventType.USER_CREATED,
  data: userData,
});

// Verify incoming webhook
export const POST = webhookVerification()(request, handler);
```

## Unified Security Middleware

Use the combined security middleware for comprehensive protection:

```typescript
import { createSecureApiHandler, securityPresets } from './lib/security';

// Using presets
export const POST = createSecureApiHandler(
  handler,
  securityPresets.authenticated
);

// Custom configuration
export const POST = createSecureApiHandler(
  handler,
  {
    csrf: true,
    rateLimit: true,
    validation: mySchema,
    validateSize: 1024 * 1024, // 1MB
    audit: true,
  }
);
```

## Security Presets

- **`public`**: Minimal security for public endpoints
- **`authenticated`**: Standard security for authenticated users
- **`admin`**: Enhanced security for admin endpoints
- **`external`**: API key authentication for external integrations
- **`webhook`**: Optimized for webhook endpoints

## Client-Side Integration

Use the provided React hooks for secure client-side operations:

```typescript
import { useSecureApi, useCSRFToken } from '@/hooks/use-security';

function MyComponent() {
  const { post } = useSecureApi();
  
  const handleSubmit = async (data) => {
    const response = await post('/api/data', data);
    // CSRF token is automatically included
  };
}
```

## Environment Variables

Required environment variables:

```env
JWT_SECRET=your-jwt-secret
CSRF_SECRET=your-csrf-secret
API_KEY_SECRET=your-api-key-secret
WEBHOOK_SECRET=your-webhook-secret
```

## Best Practices

1. **Always use the security middleware** for API routes
2. **Validate all user input** using Zod schemas
3. **Log security events** for monitoring and compliance
4. **Rotate secrets regularly**
5. **Monitor rate limits** and adjust as needed
6. **Test webhook signatures** in development
7. **Review audit logs** regularly

## Testing

Example tests for security features:

```typescript
// Test rate limiting
const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 5 });
for (let i = 0; i < 6; i++) {
  const result = await limiter.checkLimit('test-user');
  if (i === 5) {
    expect(result.allowed).toBe(false);
  }
}

// Test CSRF
const token = await generateCSRFToken();
const isValid = await verifyCSRFToken(token);
expect(isValid).toBe(true);

// Test webhook signature
const payload = { event: 'test', data: {} };
const signature = generateWebhookSignature(
  JSON.stringify(payload),
  'secret',
  Date.now()
);
```