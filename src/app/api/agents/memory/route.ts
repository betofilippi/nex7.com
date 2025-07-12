import { NextRequest, NextResponse } from 'next/server';
// Remove auth dependencies for production build
// import { getServerSession } from 'next-auth';
// import { authOptions } from '../../auth/[...nextauth]/route';
import { 
  getAgentMemory, 
  setAgentMemory, 
  getAllAgentMemory,
  clearAgentMemory,
  searchAgentMemory,
  cleanupExpiredMemories
} from '../../../../lib/agent-memory';

// Get agent memory
export async function GET(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions);
    const userId = 'anonymous'; // Fallback for production

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const key = searchParams.get('key');
    const search = searchParams.get('search');

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    let memories;

    if (key) {
      // Get specific memory
      const memory = await getAgentMemory(userId, agentId, key);
      memories = memory ? [memory] : [];
    } else if (search) {
      // Search memories
      memories = await searchAgentMemory(userId, agentId, search);
    } else {
      // Get all memories for agent
      memories = await getAllAgentMemory(userId, agentId);
    }

    return NextResponse.json({
      agentId,
      memories,
      count: memories.length
    });
  } catch (error) {
    console.error('Get memory error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get memory' },
      { status: 500 }
    );
  }
}

// Set agent memory
export async function POST(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions);
    const userId = 'anonymous'; // Fallback for production

    const { 
      agentId, 
      key, 
      value, 
      expiresIn, 
      metadata 
    } = await request.json();

    if (!agentId || !key || value === undefined) {
      return NextResponse.json(
        { error: 'agentId, key, and value are required' },
        { status: 400 }
      );
    }

    const memory = await setAgentMemory(
      userId,
      agentId,
      key,
      value,
      expiresIn,
      metadata
    );

    return NextResponse.json({
      success: true,
      memory
    });
  } catch (error) {
    console.error('Set memory error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to set memory' },
      { status: 500 }
    );
  }
}

// Clear agent memory
export async function DELETE(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions);
    const userId = 'anonymous'; // Fallback for production

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const cleanup = searchParams.get('cleanup');

    if (cleanup === 'expired') {
      // Cleanup expired memories across all agents
      const count = await cleanupExpiredMemories();
      return NextResponse.json({
        success: true,
        cleaned: count,
        type: 'expired'
      });
    }

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      );
    }

    const count = await clearAgentMemory(userId, agentId);

    return NextResponse.json({
      success: true,
      agentId,
      cleared: count
    });
  } catch (error) {
    console.error('Clear memory error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clear memory' },
      { status: 500 }
    );
  }
}

// Memory analytics
export async function PUT(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions);
    const userId = 'anonymous'; // Fallback for production

    const { action } = await request.json();

    if (action === 'analytics') {
      // Get memory usage analytics for all agents
      const agents = ['nexy', 'dev', 'designer', 'teacher', 'debugger'];
      const analytics: any = {
        totalMemories: 0,
        byAgent: {},
        oldestMemory: null,
        newestMemory: null
      };

      for (const agentId of agents) {
        const memories = await getAllAgentMemory(userId, agentId);
        analytics.byAgent[agentId] = {
          count: memories.length,
          size: JSON.stringify(memories).length,
          types: [...new Set(memories.map(m => m.key.split('_')[0]))]
        };
        analytics.totalMemories += memories.length;

        // Track oldest and newest
        for (const memory of memories) {
          if (!analytics.oldestMemory || memory.createdAt < analytics.oldestMemory.createdAt) {
            analytics.oldestMemory = { agentId, createdAt: memory.createdAt };
          }
          if (!analytics.newestMemory || memory.createdAt > analytics.newestMemory.createdAt) {
            analytics.newestMemory = { agentId, createdAt: memory.createdAt };
          }
        }
      }

      return NextResponse.json(analytics);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Memory analytics error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get analytics' },
      { status: 500 }
    );
  }
}