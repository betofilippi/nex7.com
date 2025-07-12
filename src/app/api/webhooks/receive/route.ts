import { NextRequest, NextResponse } from 'next/server';
import { 
  webhookVerification,
  getAuditLogger,
  AuditEventType 
} from '../../../../lib/security';

// Webhook receiver endpoint
export async function POST(request: NextRequest) {
  // Use webhook verification middleware
  return webhookVerification()(request, async (req, payload) => {
    try {
      // Log webhook received
      await getAuditLogger().log({
        eventType: AuditEventType.WEBHOOK_SENT,
        resource: 'webhook',
        resourceId: payload.id,
        action: payload.event,
        result: 'success',
        metadata: {
          event: payload.event,
          timestamp: payload.timestamp,
        },
      });
      
      // Process webhook based on event type
      switch (payload.event) {
        case 'user.created':
          // Handle user created event
          console.log('New user created:', payload.data);
          break;
          
        case 'user.updated':
          // Handle user updated event
          console.log('User updated:', payload.data);
          break;
          
        case 'project.created':
          // Handle project created event
          console.log('New project created:', payload.data);
          break;
          
        default:
          console.log('Unhandled webhook event:', payload.event);
      }
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      // Log webhook failure
      await getAuditLogger().log({
        eventType: AuditEventType.WEBHOOK_FAILED,
        resource: 'webhook',
        resourceId: payload?.id,
        action: payload?.event,
        result: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      console.error('Webhook processing error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to process webhook',
      }, { status: 500 });
    }
  });
}