import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '../../../lib/jwt';
import { 
  createSecureApiHandler,
  securityPresets,
  z,
  getApiKeyManager,
  ApiKeyPermission,
  ApiKeyScope 
} from '../../../lib/security';

// Schema for creating API key
const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.nativeEnum(ApiKeyPermission)).default([ApiKeyPermission.READ]),
  scopes: z.array(z.nativeEnum(ApiKeyScope)).default([ApiKeyScope.USER]),
  expiresIn: z.number().min(1).max(365).optional(), // Days
});

// Create new API key
export const POST = createSecureApiHandler(
  async (request: NextRequest) => {
    try {
      // Get user from JWT token
      const token = request.cookies.get('auth-token')?.value;
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      const payload = await verifyJWT(token);
      const userId = payload.userId;
      
      // Parse request body
      const body = await request.json();
      const validatedData = createApiKeySchema.parse(body);
      
      // Create API key
      const apiKeyManager = getApiKeyManager();
      const apiKey = await apiKeyManager.create({
        ...validatedData,
        userId,
      });
      
      // Return key (only time the actual key is shown)
      return NextResponse.json({
        success: true,
        data: {
          id: apiKey.id,
          key: apiKey.key,
          name: apiKey.name,
          description: apiKey.description,
          permissions: apiKey.permissions,
          scopes: apiKey.scopes,
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt,
        },
        message: 'Save this API key securely. It will not be shown again.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          details: error.issues,
        }, { status: 400 });
      }
      
      console.error('Create API key error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create API key',
      }, { status: 500 });
    }
  },
  {
    ...securityPresets.authenticated,
    validation: createApiKeySchema,
  }
);

// List user's API keys
export const GET = createSecureApiHandler(
  async (request: NextRequest) => {
    try {
      // Get user from JWT token
      const token = request.cookies.get('auth-token')?.value;
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      const payload = await verifyJWT(token);
      const userId = payload.userId;
      
      // List API keys
      const apiKeyManager = getApiKeyManager();
      const keys = await apiKeyManager.list(userId);
      
      return NextResponse.json({
        success: true,
        data: keys,
      });
    } catch (error) {
      console.error('List API keys error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to list API keys',
      }, { status: 500 });
    }
  },
  securityPresets.authenticated
);