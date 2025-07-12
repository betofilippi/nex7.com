import { NextRequest, NextResponse } from 'next/server';
import { getClaudeClient } from '../../../../lib/claude-client';
import { getAgentManager } from '../../../../lib/agents/manager';

export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY || request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 401 }
      );
    }

    const claudeClient = getClaudeClient(apiKey);
    const agentManager = getAgentManager(claudeClient);

    const conversationId = agentManager.createConversation(agentId);
    const conversation = agentManager.getConversation(conversationId);

    return NextResponse.json({
      conversationId,
      conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const success = agentManager.clearConversation(conversationId);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Clear conversation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}