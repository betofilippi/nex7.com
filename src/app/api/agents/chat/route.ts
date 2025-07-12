import { NextRequest, NextResponse } from 'next/server';
import { getClaudeClient } from '../../../../lib/claude-client';
import { getAgentManager } from '../../../../lib/agents/manager';
import { getAgent } from '../../../../lib/agents/definitions';
import { streamSSE } from '../../../../lib/sse-utils';

export async function POST(request: NextRequest) {
  try {
    const { conversationId, message, agentId, stream = false } = await request.json();

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: 'conversationId and message are required' },
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
        let fullResponse = '';
        
        await agentManager.sendMessageStream(
          conversationId,
          message,
          agentId,
          (chunk) => {
            fullResponse += chunk;
            send({ type: 'chunk', content: chunk });
          }
        );

        // Send final message with metadata
        const finalMessage = agentManager.getConversationHistory(conversationId).pop();
        send({ type: 'done', message: finalMessage });
      });
    } else {
      // Regular response
      const response = await agentManager.sendMessage(
        conversationId,
        message,
        agentId
      );

      return NextResponse.json({ message: response });
    }
  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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