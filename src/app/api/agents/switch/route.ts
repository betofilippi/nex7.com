import { NextRequest, NextResponse } from 'next/server';
import { getClaudeClient } from '../../../../lib/claude-client';
import { getAgentManager } from '../../../../lib/agents/manager';
import { getAgent } from '../../../../lib/agents/definitions';

export async function POST(request: NextRequest) {
  try {
    const { conversationId, agentId } = await request.json();

    if (!conversationId || !agentId) {
      return NextResponse.json(
        { error: 'conversationId and agentId are required' },
        { status: 400 }
      );
    }

    // Validate agent exists
    if (!getAgent(agentId)) {
      return NextResponse.json(
        { error: 'Invalid agent ID' },
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

    const success = agentManager.switchAgent(conversationId, agentId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to switch agent' },
        { status: 400 }
      );
    }

    const activeAgent = agentManager.getActiveAgent(conversationId);
    const messages = agentManager.getConversationHistory(conversationId);

    return NextResponse.json({
      success,
      activeAgent,
      lastMessage: messages[messages.length - 1]
    });
  } catch (error) {
    console.error('Switch agent error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}