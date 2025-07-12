import { NextRequest, NextResponse } from 'next/server';
import { 
  createSecureApiHandler, 
  securityPresets, 
  z, 
  requestSchemas,
  sanitizers 
} from '../../../../lib/security';

// Define request schema
const createItemSchema = z.object({
  title: z.string().min(1).max(200).transform(sanitizers.stripHtml),
  description: z.string().max(1000).transform(sanitizers.stripHtml),
  priority: z.enum(['low', 'medium', 'high']),
  tags: z.array(z.string()).max(5).optional(),
});

// Example of a secure API endpoint with all security features
export const POST = createSecureApiHandler(
  async (request: NextRequest) => {
    try {
      // Parse and validate request body
      const body = await request.json();
      const validatedData = createItemSchema.parse(body);
      
      // Simulate creating an item
      const newItem = {
        id: crypto.randomUUID(),
        ...validatedData,
        createdAt: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        data: newItem,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
      }, { status: 500 });
    }
  },
  {
    ...securityPresets.authenticated,
    validation: createItemSchema,
    validateSize: 1024 * 1024, // 1MB max
  }
);

// GET endpoint with lighter security
export const GET = createSecureApiHandler(
  async (request: NextRequest) => {
    // Example: List items with pagination
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    
    return NextResponse.json({
      success: true,
      data: {
        items: [],
        pagination: {
          page,
          limit,
          total: 0,
        },
      },
    });
  },
  securityPresets.public
);