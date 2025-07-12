import { NextRequest, NextResponse } from 'next/server';
import { getVercelClient } from '../../../../../../lib/vercel/client';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ deploymentId: string }> }
) {
  const params = await context.params;
  const client = await getVercelClient();
  if (!client) {
    return NextResponse.json(
      { error: 'Not authenticated with Vercel' },
      { status: 401 }
    );
  }

  const { deploymentId } = params;
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    async start(controller) {
      let previousState = '';
      let checkCount = 0;
      const maxChecks = 300; // 5 minutes max (1 check per second)
      
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Send initial connection event
      sendEvent('connected', { deploymentId });

      const checkDeployment = async () => {
        try {
          const deployment = await client.getDeployment(deploymentId);
          
          // Send status update if state changed
          if (deployment.state !== previousState) {
            previousState = deployment.state;
            
            // Calculate build metrics
            const metrics: any = {
              state: deployment.state,
              url: deployment.url,
              createdAt: deployment.createdAt,
            };

            if (deployment.buildingAt) {
              metrics.buildingAt = deployment.buildingAt;
              if (deployment.ready) {
                metrics.buildDuration = deployment.ready - deployment.buildingAt;
              }
            }

            sendEvent('status', {
              deployment,
              metrics,
              progress: getProgressForState(deployment.state),
            });
          }

          // Check if deployment is complete
          if (['READY', 'ERROR', 'CANCELED'].includes(deployment.state)) {
            // Send completion event
            sendEvent('complete', {
              deployment,
              success: deployment.state === 'READY',
            });
            
            // Close the stream
            controller.close();
            return;
          }

          checkCount++;
          if (checkCount >= maxChecks) {
            sendEvent('timeout', { message: 'Deployment monitoring timed out' });
            controller.close();
            return;
          }

          // Schedule next check
          setTimeout(checkDeployment, 1000);
        } catch (error) {
          console.error('Error checking deployment status:', error);
          sendEvent('error', { 
            message: 'Failed to check deployment status',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          controller.close();
        }
      };

      // Start checking
      checkDeployment();
    },
  });

  return new NextResponse(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

function getProgressForState(state: string): number {
  switch (state) {
    case 'QUEUED':
      return 10;
    case 'INITIALIZING':
      return 30;
    case 'BUILDING':
      return 60;
    case 'READY':
      return 100;
    case 'ERROR':
    case 'CANCELED':
      return 0;
    default:
      return 0;
  }
}