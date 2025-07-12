import { NextRequest, NextResponse } from 'next/server';
import { getVercelClient } from '../../../../lib/vercel/client';

export async function GET(request: NextRequest) {
  try {
    const client = await getVercelClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Not authenticated with Vercel' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const deploymentId = searchParams.get('deploymentId');
    const stream = searchParams.get('stream') === 'true';

    if (!deploymentId) {
      return NextResponse.json(
        { error: 'Deployment ID is required' },
        { status: 400 }
      );
    }

    if (stream) {
      // Stream logs using Server-Sent Events
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            // Send initial event
            controller.enqueue(
              encoder.encode(`event: connected\ndata: ${JSON.stringify({ connected: true })}\n\n`)
            );

            // Stream logs
            for await (const log of client.streamBuildLogs(deploymentId)) {
              const data = JSON.stringify(log);
              controller.enqueue(
                encoder.encode(`event: log\ndata: ${data}\n\n`)
              );
            }

            // Send completion event
            controller.enqueue(
              encoder.encode(`event: complete\ndata: ${JSON.stringify({ complete: true })}\n\n`)
            );
            controller.close();
          } catch (error) {
            console.error('Error streaming logs:', error);
            controller.enqueue(
              encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Failed to stream logs' })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new NextResponse(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Get all logs at once
      const logs = await client.getBuildLogs(deploymentId);
      return NextResponse.json(logs);
    }
  } catch (error) {
    console.error('Error fetching Vercel logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}