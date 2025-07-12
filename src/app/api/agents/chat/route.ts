import { NextRequest, NextResponse } from 'next/server';
import { getClaudeClient } from '../../../../lib/claude-client';
import { getAgentManager } from '../../../../lib/agents/manager';
import { getAgent } from '../../../../lib/agents/definitions';
import { streamSSE } from '../../../../lib/sse-utils';
// Remove auth dependencies for production build
// import { getServerSession } from 'next-auth';
// import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    // Get user session - disabled for production build
    // const session = await getServerSession(authOptions);
    const userId = 'anonymous'; // Fallback for production

    const { conversationId, message, agentId, stream = false, createNew = false } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    // Get API key from environment or request headers
    const apiKey = process.env.ANTHROPIC_API_KEY || request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 401 }
      );
    }

    // Initialize managers
    const claudeClient = getClaudeClient(apiKey);
    const agentManager = getAgentManager(claudeClient);

    // Set user ID if available
    if (userId) {
      agentManager.setUserId(userId);
    }

    // Create new conversation if requested
    let activeConversationId = conversationId;
    if (createNew || !conversationId) {
      activeConversationId = agentManager.createConversation(agentId);
    }

    // Validate agent exists
    if (agentId && !getAgent(agentId)) {
      return NextResponse.json(
        { error: 'Invalid agent ID' },
        { status: 400 }
      );
    }

    if (stream) {
      // Streaming response
      return streamSSE(async (send) => {
        await agentManager.sendMessageStream(
          activeConversationId,
          message,
          agentId,
          (chunk) => {
            send({ type: 'chunk', content: chunk });
          }
        );

        // Send final message with metadata
        const finalMessage = agentManager.getConversationHistory(activeConversationId).pop();
        const collaborations = agentManager.getCollaborationSuggestions(activeConversationId);
        
        send({ 
          type: 'done', 
          message: finalMessage,
          conversationId: activeConversationId,
          collaborations 
        });
      });
    } else {
      // Regular response
      const response = await agentManager.sendMessage(
        activeConversationId,
        message,
        agentId
      );

      const collaborations = agentManager.getCollaborationSuggestions(activeConversationId);

      return NextResponse.json({ 
        message: response,
        conversationId: activeConversationId,
        collaborations 
      });
    }
  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new agent conversation
export async function PUT(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions);
    const userId = 'anonymous'; // Fallback for production

    const { agentId = 'nexy' } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY || request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 401 }
      );
    }

    const claudeClient = getClaudeClient(apiKey);
    const agentManager = getAgentManager(claudeClient);

    if (userId) {
      agentManager.setUserId(userId);
    }

    const conversationId = agentManager.createConversation(agentId);
    const agent = getAgent(agentId);

    return NextResponse.json({
      conversationId,
      agent,
      greeting: agent?.greeting
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions);
    const userId = 'anonymous'; // Fallback for production

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 401 }
      );
    }

    const claudeClient = getClaudeClient(apiKey);
    const agentManager = getAgentManager(claudeClient);

    const conversation = agentManager.getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const activeAgent = agentManager.getActiveAgent(conversationId);
    const messages = agentManager.getConversationHistory(conversationId);
    const collaborations = agentManager.getCollaborationSuggestions(conversationId);

    return NextResponse.json({
      conversation,
      activeAgent,
      messages,
      collaborations
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}