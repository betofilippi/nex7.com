import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';

// Common validation schemas
export const validators = {
  // Email validation
  email: z.string().email().toLowerCase().trim(),
  
  // Password validation (min 8 chars, at least one uppercase, lowercase, number)
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  // Username validation
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  
  // UUID validation
  uuid: z.string().uuid(),
  
  // URL validation
  url: z.string().url(),
  
  // Phone number validation (basic)
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  
  // Date validation
  date: z.string().datetime(),
  
  // Pagination
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10),
  }),
  
  // Sort options
  sort: z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),
};

// XSS prevention - sanitize HTML content
export function sanitizeHtml(input: string): string {
  // Basic HTML entity encoding
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// SQL injection prevention for raw queries (though Prisma handles this)
export function sanitizeSqlInput(input: string): string {
  // Remove or escape potentially dangerous characters
  return input
    .replace(/[';\\-]/g, '') // Remove single quotes, semicolons, backslashes, and dashes
    .replace(/--/g, '') // Remove SQL comment markers
    .trim();
}

// File upload validation
export const fileValidators = {
  image: z.object({
    mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    size: z.number().max(5 * 1024 * 1024), // 5MB max
  }),
  
  document: z.object({
    mimetype: z.enum(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
    size: z.number().max(10 * 1024 * 1024), // 10MB max
  }),
  
  csv: z.object({
    mimetype: z.enum(['text/csv', 'application/csv']),
    size: z.number().max(50 * 1024 * 1024), // 50MB max
  }),
};

// Validation error formatter
export function formatValidationErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const field = err.path.join('.');
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field].push(err.message);
  });
  
  return errors;
}

// Validation middleware
export function validateRequest<T extends ZodSchema>(schema: T) {
  return async function validation(
    request: NextRequest,
    handler: (req: NextRequest, data: z.infer<T>) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      let data: any;
      
      // Get data based on request method
      if (request.method === 'GET') {
        // Parse query parameters
        const searchParams = request.nextUrl.searchParams;
        data = Object.fromEntries(searchParams.entries());
      } else {
        // Parse JSON body
        try {
          data = await request.json();
        } catch {
          return NextResponse.json(
            { 
              error: 'Invalid request body',
              message: 'Request body must be valid JSON'
            },
            { status: 400 }
          );
        }
      }
      
      // Validate data
      const validated = await schema.parseAsync(data);
      
      // Call handler with validated data
      return handler(request, validated);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            message: 'The request data did not meet validation requirements',
            errors: formatValidationErrors(error),
          },
          { status: 400 }
        );
      }
      
      // Re-throw non-validation errors
      throw error;
    }
  };
}

// Helper to create validated API route
export function withValidation<T extends ZodSchema>(
  schema: T,
  handler: (req: NextRequest, data: z.infer<T>) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return (req: NextRequest) => validateRequest(schema)(req, handler);
}

// Common request schemas
export const requestSchemas = {
  login: z.object({
    email: validators.email,
    password: z.string().min(1, 'Password is required'),
  }),
  
  signup: z.object({
    email: validators.email,
    password: validators.password,
    name: z.string().min(2).max(100),
  }),
  
  updateProfile: z.object({
    name: z.string().min(2).max(100).optional(),
    email: validators.email.optional(),
    phone: validators.phone.optional(),
  }),
  
  createPost: z.object({
    title: z.string().min(1).max(200).transform(sanitizeHtml),
    content: z.string().min(1).max(10000).transform(sanitizeHtml),
    tags: z.array(z.string()).max(10).optional(),
  }),
  
  queryParams: z.object({
    search: z.string().max(100).optional().transform(val => val ? sanitizeSqlInput(val) : undefined),
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().positive()).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().positive().max(100)).optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
};

// Input sanitization utilities
export const sanitizers = {
  // Remove all HTML tags
  stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '');
  },
  
  // Sanitize filename
  filename(input: string): string {
    return input
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .substring(0, 255);
  },
  
  // Sanitize for use in URLs
  urlSlug(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  },
  
  // Sanitize JSON path
  jsonPath(input: string): string {
    return input
      .replace(/[^a-zA-Z0-9.[\]]/g, '')
      .substring(0, 100);
  },
};

// Request size validation
export function validateRequestSize(maxSizeBytes: number) {
  return async function sizeValidation(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const contentLength = request.headers.get('content-length');
    
    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      return NextResponse.json(
        {
          error: 'Request too large',
          message: `Request body exceeds maximum size of ${maxSizeBytes} bytes`,
        },
        { status: 413 }
      );
    }
    
    return handler(request);
  };
}

// Combined validation middleware
export function createValidationMiddleware<T extends ZodSchema>(
  schema: T,
  options?: {
    maxSize?: number;
    sanitize?: boolean;
  }
) {
  return async function middleware(
    request: NextRequest
  ): Promise<{ success: true; data: z.infer<T> } | { success: false; response: NextResponse }> {
    // Check request size if specified
    if (options?.maxSize) {
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > options.maxSize) {
        return {
          success: false,
          response: NextResponse.json(
            {
              error: 'Request too large',
              message: `Request body exceeds maximum size of ${options.maxSize} bytes`,
            },
            { status: 413 }
          ),
        };
      }
    }
    
    try {
      let data: any;
      
      // Get data based on request method
      if (request.method === 'GET') {
        const searchParams = request.nextUrl.searchParams;
        data = Object.fromEntries(searchParams.entries());
      } else {
        try {
          data = await request.json();
        } catch {
          return {
            success: false,
            response: NextResponse.json(
              { 
                error: 'Invalid request body',
                message: 'Request body must be valid JSON'
              },
              { status: 400 }
            ),
          };
        }
      }
      
      // Validate data
      const validated = await schema.parseAsync(data);
      
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          response: NextResponse.json(
            {
              error: 'Validation failed',
              message: 'The request data did not meet validation requirements',
              errors: formatValidationErrors(error),
            },
            { status: 400 }
          ),
        };
      }
      
      throw error;
    }
  };
}