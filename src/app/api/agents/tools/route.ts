import { NextRequest, NextResponse } from 'next/server';
// Remove auth dependencies for production build
// import { getServerSession } from 'next-auth';
// import { authOptions } from '../../auth/[...nextauth]/route';
import { getClaudeClient } from '../../../../lib/claude-client';
import { getAgentManager } from '../../../../lib/agents/manager';

// Execute agent-specific tools
export async function POST(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const { 
      agentId, 
      toolName, 
      toolInput, 
      conversationId 
    } = await request.json();

    if (!agentId || !toolName || !toolInput) {
      return NextResponse.json(
        { error: 'agentId, toolName, and toolInput are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
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

    // Get agent instance and execute tool
    const agentInstances = (agentManager as any).agentInstances;
    const agentInstance = agentInstances.get(agentId);

    if (!agentInstance) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Execute the tool
    const result = await agentInstance.executeToolCall(toolName, toolInput);

    return NextResponse.json({
      success: true,
      agentId,
      toolName,
      result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Tool execution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Tool execution failed' },
      { status: 500 }
    );
  }
}

// Get available tools for an agent
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 401 }
      );
    }

    const claudeClient = getClaudeClient(apiKey);
    const agentManager = getAgentManager(claudeClient);

    // Get agent instance and its tools
    const agentInstances = (agentManager as any).agentInstances;
    const agentInstance = agentInstances.get(agentId);

    if (!agentInstance) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const tools = agentInstance.getTools();

    return NextResponse.json({
      agentId,
      tools,
      count: tools.length
    });
  } catch (error) {
    console.error('Get tools error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get tools' },
      { status: 500 }
    );
  }
}