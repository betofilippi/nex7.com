import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface GitHubWebhookPayload {
  action?: string;
  repository?: {
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  ref?: string;
  head_commit?: {
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
  };
  workflow_run?: {
    id: number;
    name: string;
    status: string;
    conclusion: string;
  };
  pull_request?: {
    number: number;
    title: string;
    state: string;
    merged: boolean;
  };
}

// Verify GitHub webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(payload).digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifySignature(body, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload: GitHubWebhookPayload = JSON.parse(body);

    // Handle different GitHub events
    switch (event) {
      case 'push':
        // Handle push events (commits to repository)
        console.log('Push event received:', {
          repository: payload.repository?.full_name,
          ref: payload.ref,
          commit: payload.head_commit?.id,
          message: payload.head_commit?.message,
          author: payload.head_commit?.author.name
        });

        // Trigger deployment if push is to main branch
        if (payload.ref === 'refs/heads/main' || payload.ref === 'refs/heads/master') {
          // Here you would trigger your deployment pipeline
          console.log('Triggering deployment for main branch push');
          
          // Example: Send notification to deployment system
          // await triggerDeployment({
          //   repository: payload.repository?.full_name,
          //   commit: payload.head_commit?.id,
          //   author: payload.head_commit?.author.name,
          //   message: payload.head_commit?.message
          // });
        }
        break;

      case 'pull_request':
        // Handle pull request events
        console.log('Pull request event:', {
          action: payload.action,
          number: payload.pull_request?.number,
          title: payload.pull_request?.title,
          state: payload.pull_request?.state
        });

        if (payload.action === 'closed' && payload.pull_request?.merged) {
          // PR was merged, might trigger deployment
          console.log('Pull request merged, considering deployment');
        }
        break;

      case 'workflow_run':
        // Handle GitHub Actions workflow events
        console.log('Workflow run event:', {
          name: payload.workflow_run?.name,
          status: payload.workflow_run?.status,
          conclusion: payload.workflow_run?.conclusion
        });

        // You can use this to track CI/CD pipeline status
        if (payload.workflow_run?.conclusion === 'success') {
          console.log('Workflow completed successfully');
        } else if (payload.workflow_run?.conclusion === 'failure') {
          console.log('Workflow failed');
        }
        break;

      case 'release':
        // Handle release events
        console.log('Release event:', payload.action);
        if (payload.action === 'published') {
          // New release published, trigger production deployment
          console.log('New release published, triggering production deployment');
        }
        break;

      default:
        console.log(`Unhandled event type: ${event}`);
    }

    // Store webhook data for monitoring dashboard
    // This would typically be stored in a database
    const webhookData = {
      event,
      timestamp: new Date().toISOString(),
      repository: payload.repository?.full_name,
      payload
    };

    // Example: Store in database or send to monitoring service
    // await storeWebhookEvent(webhookData);

    return NextResponse.json({ 
      success: true, 
      event,
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}