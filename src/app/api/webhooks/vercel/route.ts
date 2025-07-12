import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getVercelClient } from '../../../../lib/vercel/client';
import { createNotificationService, DeploymentNotification } from '../../../../lib/vercel/notifications';

const VERCEL_WEBHOOK_SECRET = process.env.VERCEL_WEBHOOK_SECRET || '';
const notificationService = createNotificationService();

interface VercelWebhookPayload {
  id: string;
  type: string;
  createdAt: number;
  payload: {
    deploymentId?: string;
    deployment?: {
      id: string;
      name: string;
      url: string;
      meta: Record<string, any>;
    };
    project?: {
      id: string;
      name: string;
    };
    target?: string;
    alias?: string[];
    state?: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
    error?: {
      code: string;
      message: string;
    };
  };
}

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha1', secret)
    .update(payload)
    .digest('hex');
  
  return `sha1=${hash}` === signature;
}

// Send notification using the notification service
async function sendNotification(
  type: string,
  data: any
) {
  console.log(`[Vercel Webhook] ${type}:`, data);
  
  if (!notificationService) return;

  try {
    const notification: DeploymentNotification = {
      type: type as DeploymentNotification['type'],
      project: {
        id: data.project?.id || '',
        name: data.project?.name || '',
      },
      deployment: {
        id: data.deployment?.id || '',
        url: data.deployment?.url || data.url || '',
        state: data.deployment?.state || '',
        creator: data.deployment?.creator?.email,
      },
      error: data.error,
      timestamp: Date.now(),
    };

    await notificationService.sendNotification(notification);
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

// Handle automatic rollback for failed deployments
async function handleFailedDeployment(
  deploymentId: string,
  projectId: string,
  error: any
) {
  try {
    const client = await getVercelClient();
    if (!client) {
      console.error('Cannot rollback: No Vercel client available');
      return;
    }

    // Get previous successful deployment
    const deployments = await client.listDeployments(projectId, 10);
    const previousSuccessful = deployments.deployments.find(
      (d) => d.state === 'READY' && d.uid !== deploymentId
    );

    if (previousSuccessful) {
      console.log(`Rolling back to deployment: ${previousSuccessful.uid}`);
      
      // Redeploy the previous successful deployment
      await client.redeployDeployment(previousSuccessful.uid, {
        target: 'production',
      });
      
      await sendNotification('deployment.rollback', {
        failedDeployment: deploymentId,
        rolledBackTo: previousSuccessful.uid,
        error,
      });
    } else {
      console.error('No previous successful deployment found for rollback');
    }
  } catch (error) {
    console.error('Error during rollback:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-vercel-signature');
    
    if (!signature && VERCEL_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    const body = await request.text();
    
    // Verify signature if secret is configured
    if (VERCEL_WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(body, signature, VERCEL_WEBHOOK_SECRET);
      
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const payload: VercelWebhookPayload = JSON.parse(body);
    
    console.log(`Received Vercel webhook: ${payload.type}`, payload);

    // Handle different webhook events
    switch (payload.type) {
      case 'deployment.created':
        await sendNotification('deployment.created', {
          deployment: payload.payload.deployment,
          project: payload.payload.project,
        });
        break;

      case 'deployment.succeeded':
        await sendNotification('deployment.succeeded', {
          deployment: payload.payload.deployment,
          project: payload.payload.project,
          url: payload.payload.deployment?.url,
        });
        break;

      case 'deployment.ready':
        await sendNotification('deployment.ready', {
          deployment: payload.payload.deployment,
          project: payload.payload.project,
          alias: payload.payload.alias,
        });
        break;

      case 'deployment.error':
      case 'deployment.failed':
        const deployment = payload.payload.deployment;
        const project = payload.payload.project;
        const error = payload.payload.error;

        await sendNotification('deployment.failed', {
          deployment,
          project,
          error,
        });

        // Check if automatic rollback is enabled (via deployment meta)
        if (
          deployment?.meta?.autoRollback === 'true' && 
          project?.id && 
          deployment?.id
        ) {
          await handleFailedDeployment(deployment.id, project.id, error);
        }
        break;

      case 'deployment.canceled':
        await sendNotification('deployment.canceled', {
          deployment: payload.payload.deployment,
          project: payload.payload.project,
        });
        break;

      case 'domain.created':
        await sendNotification('domain.created', {
          domain: payload.payload,
          project: payload.payload.project,
        });
        break;

      case 'project.created':
        await sendNotification('project.created', {
          project: payload.payload.project,
        });
        break;

      case 'project.removed':
        await sendNotification('project.removed', {
          project: payload.payload.project,
        });
        break;

      default:
        console.log(`Unhandled webhook type: ${payload.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Vercel webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Webhook configuration endpoint
export async function GET(request: NextRequest) {
  // Return webhook endpoint info for configuration
  const webhookUrl = new URL('/api/webhooks/vercel', request.url);
  
  return NextResponse.json({
    endpoint: webhookUrl.toString(),
    events: [
      'deployment.created',
      'deployment.succeeded',
      'deployment.ready',
      'deployment.error',
      'deployment.failed',
      'deployment.canceled',
      'domain.created',
      'project.created',
      'project.removed',
    ],
    secretConfigured: !!VERCEL_WEBHOOK_SECRET,
  });
}