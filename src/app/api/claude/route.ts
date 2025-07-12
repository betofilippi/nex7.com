import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '../../../lib/jwt';
import { getClaudeClient, ClaudeTool } from '../../../lib/claude-client';
import { apiRateLimiter, streamRateLimiter } from '../../../lib/rate-limiter';
import { streamSSE } from '../../../lib/sse-utils';
import { Stream } from '@anthropic-ai/sdk/streaming';
import Anthropic from '@anthropic-ai/sdk';

// Request body type
interface ClaudeRequestBody {
  message: string;
  conversationId?: string;
  tools?: ClaudeTool[];
  stream?: boolean;
}

// Response types
interface ClaudeResponse {
  message: string;
  conversationId: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

interface ClaudeError {
  error: string;
  code?: string;
  retryAfter?: number;
}

// Extract user ID from request for rate limiting
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Get token from cookies or Authorization header
    let token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return null;
    }

    const payload = await verifyJWT(token);
    return payload.userId;
  } catch (error) {
    console.error('Error extracting user ID:', error);
    return null;
  }
}

// Validate request body
function validateRequestBody(body: unknown): body is ClaudeRequestBody {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const { message, conversationId, tools, stream } = body as Record<string, unknown>;

  // Message is required and must be a string
  if (typeof message !== 'string' || message.trim().length === 0) {
    return false;
  }

  // ConversationId is optional but must be a string if provided
  if (conversationId !== undefined && typeof conversationId !== 'string') {
    return false;
  }

  // Tools is optional but must be an array if provided
  if (tools !== undefined && !Array.isArray(tools)) {
    return false;
  }

  // Stream is optional but must be a boolean if provided
  if (stream !== undefined && typeof stream !== 'boolean') {
    return false;
  }

  return true;
}

// Log request for monitoring
function logRequest(
  userId: string | null,
  conversationId: string | undefined,
  message: string,
  stream: boolean,
  status: 'start' | 'success' | 'error',
  error?: string
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    userId: userId || 'anonymous',
    conversationId,
    messageLength: message.length,
    stream,
    status,
    error,
  };

  if (status === 'error') {
    console.error('Claude API Error:', logData);
  } else {
    console.log('Claude API Request:', logData);
  }
}

export async function POST(request: NextRequest) {
  let userId: string | null = null;
  let requestBody: ClaudeRequestBody;

  try {
    // Parse and validate request body
    const body = await request.json();
    if (!validateRequestBody(body)) {
      return NextResponse.json<ClaudeError>(
        { error: 'Invalid request body. Message is required.' },
        { status: 400 }
      );
    }
    requestBody = body;

    // Extract user ID for authentication and rate limiting
    userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json<ClaudeError>(
        { error: 'Unauthorized. Please log in to use Claude API.' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimiter = requestBody.stream ? streamRateLimiter : apiRateLimiter;
    const rateLimitResult = await rateLimiter.checkLimit(userId);

    if (!rateLimitResult.allowed) {
      logRequest(userId, requestBody.conversationId, requestBody.message, !!requestBody.stream, 'error', 'Rate limit exceeded');
      return NextResponse.json<ClaudeError>(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
            'X-RateLimit-Limit': String(requestBody.stream ? 10 : 30),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + (rateLimitResult.retryAfter || 60) * 1000)
          }
        }
      );
    }

    // Log request start
    logRequest(userId, requestBody.conversationId, requestBody.message, !!requestBody.stream, 'start');

    // Get API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logRequest(userId, requestBody.conversationId, requestBody.message, !!requestBody.stream, 'error', 'API key not configured');
      return NextResponse.json<ClaudeError>(
        { error: 'Claude API is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Initialize Claude client
    const claudeClient = getClaudeClient(apiKey);

    // Create conversation if not provided
    let conversationId = requestBody.conversationId;
    if (!conversationId) {
      conversationId = claudeClient.createConversation();
    } else {
      // Verify conversation exists
      const conversation = claudeClient.getConversation(conversationId);
      if (!conversation) {
        // Create new conversation with provided ID
        conversationId = claudeClient.createConversation(conversationId);
      }
    }

    // Handle streaming response
    if (requestBody.stream) {
      return streamSSE(async (send) => {
        try {
          let fullResponse = '';
          const stream = await claudeClient.sendMessageStream(
            requestBody.message,
            conversationId,
            requestBody.tools
          );

          // Process stream chunks
          for await (const chunk of stream as Stream<Anthropic.MessageStreamEvent>) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;
              fullResponse += text;
              send({ type: 'delta', content: text });
            } else if (chunk.type === 'message_stop') {
              // Update conversation with full response
              const conversation = claudeClient.getConversation(conversationId!);
              if (conversation) {
                const messages = [...conversation.messages];
                messages.push({ role: 'assistant', content: fullResponse });
                claudeClient.updateConversation(conversationId!, messages);
              }

              // Send completion signal
              send({ 
                type: 'done', 
                conversationId,
                usage: {
                  inputTokens: 0, // Would need to extract from stream metadata
                  outputTokens: 0
                }
              });
            } else if (chunk.type === 'error') {
              throw new Error('Stream error');
            }
          }

          logRequest(userId, conversationId, requestBody.message, true, 'success');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Stream processing failed';
          logRequest(userId, conversationId, requestBody.message, true, 'error', errorMessage);
          send({ type: 'error', error: errorMessage });
        }
      });
    }

    // Handle non-streaming response
    const response = await claudeClient.sendMessage(
      requestBody.message,
      conversationId,
      requestBody.tools
    );

    // Extract response content
    const responseContent = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    logRequest(userId, conversationId, requestBody.message, false, 'success');

    return NextResponse.json<ClaudeResponse>({
      message: responseContent,
      conversationId,
      usage: response.usage ? {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      } : undefined
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const isAnthropicError = error instanceof Error && error.message.includes('Anthropic');
    
    logRequest(
      userId, 
      requestBody?.conversationId, 
      requestBody?.message || '', 
      !!requestBody?.stream, 
      'error', 
      errorMessage
    );

    // Handle specific Anthropic API errors
    if (isAnthropicError) {
      return NextResponse.json<ClaudeError>(
        { 
          error: 'Claude API error. Please try again later.',
          code: 'CLAUDE_API_ERROR'
        },
        { status: 503 }
      );
    }

    return NextResponse.json<ClaudeError>(
      { 
        error: errorMessage,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve conversation history
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json<ClaudeError>(
        { error: 'Unauthorized. Please log in to view conversations.' },
        { status: 401 }
      );
    }

    // Get conversation ID from query params
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json<ClaudeError>(
        { error: 'Conversation ID is required.' },
        { status: 400 }
      );
    }

    // Get API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json<ClaudeError>(
        { error: 'Claude API is not configured.' },
        { status: 500 }
      );
    }

    // Get conversation from Claude client
    const claudeClient = getClaudeClient(apiKey);
    const conversation = claudeClient.getConversation(conversationId);

    if (!conversation) {
      return NextResponse.json<ClaudeError>(
        { error: 'Conversation not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      conversationId: conversation.id,
      messages: conversation.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json<ClaudeError>(
      { error: 'Failed to retrieve conversation.' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear conversation history
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json<ClaudeError>(
        { error: 'Unauthorized. Please log in to delete conversations.' },
        { status: 401 }
      );
    }

    // Get conversation ID from query params
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json<ClaudeError>(
        { error: 'Conversation ID is required.' },
        { status: 400 }
      );
    }

    // Get API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json<ClaudeError>(
        { error: 'Claude API is not configured.' },
        { status: 500 }
      );
    }

    // Delete conversation
    const claudeClient = getClaudeClient(apiKey);
    const deleted = claudeClient.deleteConversation(conversationId);

    if (!deleted) {
      return NextResponse.json<ClaudeError>(
        { error: 'Conversation not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Conversation deleted successfully.',
      conversationId 
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json<ClaudeError>(
      { error: 'Failed to delete conversation.' },
      { status: 500 }
    );
  }
}