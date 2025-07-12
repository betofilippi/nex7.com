import { NextRequest, NextResponse } from 'next/server';
// Remove auth dependencies for production build
// import { getServerSession } from 'next-auth';
// import { authOptions } from '../../auth/[...nextauth]/route';
import { getClaudeClient } from '../../../../lib/claude-client';
import { getAgentManager } from '../../../../lib/agents/manager';
import { streamSSE } from '../../../../lib/sse-utils';

// Initiate agent collaboration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const {
      conversationId,
      task,
      agents: requestedAgents,
      parallel = false,
      context = {}
    } = await request.json();

    if (!conversationId || !task || !requestedAgents || requestedAgents.length === 0) {
      return NextResponse.json(
        { error: 'conversationId, task, and agents are required' },
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

    // Get Nexy (orchestrator) to coordinate the collaboration
    const agentInstances = (agentManager as any).agentInstances;
    const nexyAgent = agentInstances.get('nexy');

    if (!nexyAgent) {
      return NextResponse.json(
        { error: 'Orchestrator agent not available' },
        { status: 500 }
      );
    }

    // Use Nexy's coordination tool
    const coordination = await nexyAgent.coordinateAgents({
      agents: requestedAgents,
      taskPlan: task,
      parallel
    });

    // Execute tasks with each agent
    const results: any[] = [];

    if (parallel) {
      // Execute in parallel
      const promises = requestedAgents.map(async (agentId: string) => {
        const agent = agentInstances.get(agentId);
        if (!agent) return { agentId, error: 'Agent not found' };

        agent.setConversationId(conversationId);
        const response = await agent.sendMessage(
          `${task} (Context: ${JSON.stringify(context)})`,
          conversationId
        );

        return {
          agentId,
          response: response.content[0].type === 'text' ? response.content[0].text : '',
          timestamp: new Date()
        };
      });

      const parallelResults = await Promise.all(promises);
      results.push(...parallelResults);
    } else {
      // Execute sequentially
      for (const agentId of requestedAgents) {
        const agent = agentInstances.get(agentId);
        if (!agent) {
          results.push({ agentId, error: 'Agent not found' });
          continue;
        }

        agent.setConversationId(conversationId);
        
        // Pass previous results as context
        const enrichedContext = {
          ...context,
          previousResults: results
        };

        const response = await agent.sendMessage(
          `${task} (Context: ${JSON.stringify(enrichedContext)})`,
          conversationId
        );

        results.push({
          agentId,
          response: response.content[0].type === 'text' ? response.content[0].text : '',
          timestamp: new Date()
        });

        // Update Nexy's coordination progress
        nexyAgent.updateCoordinationProgress(
          coordination.coordinationId,
          agentId,
          'completed',
          response
        );
      }
    }

    // Get summary from Nexy
    const summary = await nexyAgent.summarizeProgress({
      conversationId,
      includeDetails: true
    });

    return NextResponse.json({
      success: true,
      coordinationId: coordination.coordinationId,
      results,
      summary,
      executionMode: parallel ? 'parallel' : 'sequential'
    });
  } catch (error) {
    console.error('Collaboration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Collaboration failed' },
      { status: 500 }
    );
  }
}

// Stream collaborative work
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const {
      conversationId,
      task,
      agents: requestedAgents,
      context = {}
    } = await request.json();

    if (!conversationId || !task || !requestedAgents || requestedAgents.length === 0) {
      return NextResponse.json(
        { error: 'conversationId, task, and agents are required' },
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

    // Stream collaborative responses
    return streamSSE(async (send) => {
      const agentInstances = (agentManager as any).agentInstances;
      const nexyAgent = agentInstances.get('nexy');

      // Start coordination
      send({
        type: 'coordination_start',
        agents: requestedAgents,
        task
      });

      const coordination = await nexyAgent.coordinateAgents({
        agents: requestedAgents,
        taskPlan: task,
        parallel: false // Sequential for streaming
      });

      const results: any[] = [];

      // Process each agent sequentially
      for (const agentId of requestedAgents) {
        send({
          type: 'agent_start',
          agentId,
          agentName: agentId
        });

        const agent = agentInstances.get(agentId);
        if (!agent) {
          send({
            type: 'agent_error',
            agentId,
            error: 'Agent not found'
          });
          continue;
        }

        agent.setConversationId(conversationId);

        // Stream this agent's response
        let agentResponse = '';
        await agent.sendMessageStream(
          `${task} (Context: ${JSON.stringify({ ...context, previousResults: results })})`,
          conversationId,
          (chunk) => {
            agentResponse += chunk;
            send({
              type: 'agent_chunk',
              agentId,
              content: chunk
            });
          }
        );

        results.push({
          agentId,
          response: agentResponse,
          timestamp: new Date()
        });

        send({
          type: 'agent_complete',
          agentId,
          response: agentResponse
        });

        // Update coordination progress
        nexyAgent.updateCoordinationProgress(
          coordination.coordinationId,
          agentId,
          'completed',
          agentResponse
        );
      }

      // Final summary
      const summary = await nexyAgent.summarizeProgress({
        conversationId,
        includeDetails: true
      });

      send({
        type: 'coordination_complete',
        coordinationId: coordination.coordinationId,
        results,
        summary
      });
    });
  } catch (error) {
    console.error('Stream collaboration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Stream collaboration failed' },
      { status: 500 }
    );
  }
}

// Get collaboration status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const coordinationId = searchParams.get('coordinationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
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

    // Get collaboration suggestions
    const suggestions = agentManager.getCollaborationSuggestions(conversationId);

    // Get active coordinations if Nexy is available
    const agentInstances = (agentManager as any).agentInstances;
    const nexyAgent = agentInstances.get('nexy');
    
    let activeCoordinations = [];
    if (nexyAgent) {
      // This would need to be implemented in NexyAgent
      activeCoordinations = Array.from((nexyAgent as any).activeCoordinations.entries())
        .map(([id, coord]) => ({
          id,
          ...coord,
          progress: Array.from(coord.progress.entries())
        }));
    }

    return NextResponse.json({
      conversationId,
      suggestions,
      activeCoordinations,
      coordinationId: coordinationId ? 
        activeCoordinations.find(c => c.id === coordinationId) : null
    });
  } catch (error) {
    console.error('Get collaboration status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    );
  }
}