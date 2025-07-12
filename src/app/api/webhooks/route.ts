import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '../../../lib/jwt';
import { 
  createSecureApiHandler,
  securityPresets,
  z,
  getWebhookManager,
  WebhookEventType,
  validators
} from '../../../lib/security';

// Schema for creating webhook
const createWebhookSchema = z.object({
  url: validators.url,
  events: z.array(z.nativeEnum(WebhookEventType)).min(1),
  secret: z.string().min(16).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  active: z.boolean().default(true),
});

// Create new webhook
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
      const validatedData = createWebhookSchema.parse(body);
      
      // Generate secret if not provided
      const secret = validatedData.secret || crypto.randomUUID();
      
      // Register webhook
      const webhookManager = getWebhookManager();
      const webhookId = await webhookManager.register(userId, {
        ...validatedData,
        secret,
      });
      
      return NextResponse.json({
        success: true,
        data: {
          id: webhookId,
          ...validatedData,
          secret, // Show secret only on creation
        },
        message: 'Webhook created successfully. Save the secret securely.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          details: error.issues,
        }, { status: 400 });
      }
      
      console.error('Create webhook error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create webhook',
      }, { status: 500 });
    }
  },
  {
    ...securityPresets.authenticated,
    validation: createWebhookSchema,
  }
);

// List user's webhooks
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
      
      // List webhooks
      const webhookManager = getWebhookManager();
      const webhooks = await webhookManager.list(userId);
      
      // Don't expose secrets in list
      const sanitizedWebhooks = webhooks.map(({ secret, ...webhook }) => webhook);
      
      return NextResponse.json({
        success: true,
        data: sanitizedWebhooks,
      });
    } catch (error) {
      console.error('List webhooks error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to list webhooks',
      }, { status: 500 });
    }
  },
  securityPresets.authenticated
);