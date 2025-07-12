import { NextRequest, NextResponse } from 'next/server';
import { getClaudeClient } from '../../../../lib/claude-client';
import { apiRateLimiter, streamRateLimiter } from '../../../../lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Parse request body first to check if streaming is requested
    const body = await request.json();
    const { message, conversationId, tools, stream } = body;

    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Use appropriate rate limiter
    const rateLimiter = stream ? streamRateLimiter : apiRateLimiter;
    const { allowed, retryAfter } = await rateLimiter.checkLimit(ip);
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter?.toString() || '60',
          },
        }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Get or create Claude client
    const client = getClaudeClient(apiKey);

    // Handle streaming response
    if (stream) {
      // Create SSE stream
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const stream = await client.sendMessageStream(message, conversationId, tools);
            
            let fullContent = '';
            
            for await (const event of stream) {
              if (event.type === 'content_block_delta') {
                const delta = event.delta;
                if (delta.type === 'text_delta') {
                  fullContent += delta.text;
                  const data = JSON.stringify({ 
                    type: 'delta', 
                    content: delta.text 
                  });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
              } else if (event.type === 'message_stop') {
                // Update conversation with full response
                if (conversationId) {
                  const conversation = client.getConversation(conversationId);
                  if (conversation) {
                    conversation.messages.push({
                      role: 'assistant',
                      content: fullContent,
                    });
                    client.updateConversation(conversationId, conversation.messages);
                  }
                }
                
                const data = JSON.stringify({ 
                  type: 'done',
                  conversationId,
                });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                controller.close();
              }
            }
          } catch (error) {
            const errorData = JSON.stringify({ 
              type: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        },
      });

      return new NextResponse(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle non-streaming response
    const response = await client.sendMessage(message, conversationId, tools);

    // Extract response content
    const content = response.content[0];
    const responseData = {
      content: content.type === 'text' ? content.text : content,
      usage: response.usage,
      model: response.model,
      conversationId,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Claude API error:', error);
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Claude API rate limit exceeded' },
          { status: 429 }
        );
      }
      if (error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}