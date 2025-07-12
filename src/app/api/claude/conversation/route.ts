import { NextRequest, NextResponse } from 'next/server';
import { getClaudeClient } from '../../../../lib/claude-client';
import { apiRateLimiter } from '../../../../lib/rate-limiter';

// Create a new conversation
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Check rate limit
    const { allowed, retryAfter } = await apiRateLimiter.checkLimit(ip);
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

    // Parse request body
    const body = await request.json();
    const { id } = body;

    // Create new conversation
    const conversationId = client.createConversation(id);

    return NextResponse.json({
      conversationId,
      message: 'Conversation created successfully',
    });
  } catch (error) {
    console.error('Conversation creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get conversation details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
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

    // Get Claude client
    const client = getClaudeClient(apiKey);
    const conversation = client.getConversation(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update conversation
export async function PUT(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Check rate limit
    const { allowed, retryAfter } = await apiRateLimiter.checkLimit(ip);
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

    // Parse request body
    const body = await request.json();
    const { conversationId, messages } = body;

    if (!conversationId || !messages) {
      return NextResponse.json(
        { error: 'Conversation ID and messages are required' },
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

    // Get Claude client
    const client = getClaudeClient(apiKey);
    const conversation = client.getConversation(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Update conversation
    client.updateConversation(conversationId, messages);

    return NextResponse.json({
      message: 'Conversation updated successfully',
      conversationId,
    });
  } catch (error) {
    console.error('Update conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete conversation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
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

    // Get Claude client
    const client = getClaudeClient(apiKey);
    const deleted = client.deleteConversation(conversationId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Conversation deleted successfully',
      conversationId,
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}