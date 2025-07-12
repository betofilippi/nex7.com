import { ClaudeClient, ClaudeMessage, ClaudeTool } from '../claude-client';
import { Agent } from './definitions';
import { AgentMemory, getAgentMemory, setAgentMemory, searchAgentMemory } from '../agent-memory';
import { BaseAgent } from './base-agent';

// Nexy's specialized tools
const NEXY_TOOLS: ClaudeTool[] = [
  {
    name: 'route_task',
    description: 'Route a task to the appropriate specialized agent',
    input_schema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'The task description' },
        suggestedAgent: { type: 'string', description: 'Suggested agent ID (dev, designer, teacher, debugger)' },
        context: { type: 'object', description: 'Additional context for the task' }
      },
      required: ['task', 'suggestedAgent']
    }
  },
  {
    name: 'get_agent_status',
    description: 'Get the current status and capabilities of all agents',
    input_schema: {
      type: 'object',
      properties: {
        includeMemory: { type: 'boolean', description: 'Include memory statistics' }
      }
    }
  },
  {
    name: 'coordinate_agents',
    description: 'Coordinate multiple agents to work on a complex task',
    input_schema: {
      type: 'object',
      properties: {
        agents: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'List of agent IDs to coordinate'
        },
        taskPlan: { type: 'string', description: 'High-level task plan' },
        parallel: { type: 'boolean', description: 'Whether agents can work in parallel' }
      },
      required: ['agents', 'taskPlan']
    }
  },
  {
    name: 'summarize_progress',
    description: 'Summarize the progress of ongoing tasks across all agents',
    input_schema: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', description: 'Conversation ID to summarize' },
        includeDetails: { type: 'boolean', description: 'Include detailed task breakdown' }
      },
      required: ['conversationId']
    }
  }
];

export class NexyAgent extends BaseAgent {
  private activeCoordinations: Map<string, {
    agents: string[];
    taskPlan: string;
    progress: Map<string, { status: string; output?: any }>;
    startTime: Date;
  }>;

  constructor(agent: Agent, claudeClient: ClaudeClient) {
    super(agent, claudeClient, NEXY_TOOLS);
    this.activeCoordinations = new Map();
  }

  async routeTask(input: { task: string; suggestedAgent: string; context?: any }): Promise<any> {
    const { task, suggestedAgent, context } = input;
    
    // Store routing decision in memory
    if (this.userId) {
      await setAgentMemory(
        this.userId,
        this.agent.id,
        `routing_${Date.now()}`,
        {
          task,
          routedTo: suggestedAgent,
          context,
          timestamp: new Date()
        },
        86400000 // 24 hours
      );
    }

    return {
      success: true,
      routedTo: suggestedAgent,
      message: `Task routed to ${suggestedAgent} agent`,
      handoffContext: {
        originalTask: task,
        routingAgent: this.agent.id,
        ...context
      }
    };
  }

  async getAgentStatus(input: { includeMemory?: boolean }): Promise<any> {
    const { includeMemory = false } = input;
    const agents = ['dev', 'designer', 'teacher', 'debugger', 'nexy'];
    const status: any = {};

    for (const agentId of agents) {
      status[agentId] = {
        available: true,
        specialties: this.getAgentSpecialties(agentId),
        currentLoad: await this.getAgentLoad(agentId)
      };

      if (includeMemory && this.userId) {
        const memories = await searchAgentMemory(this.userId, agentId, '');
        status[agentId].memoryCount = memories.length;
      }
    }

    return status;
  }

  async coordinateAgents(input: { 
    agents: string[]; 
    taskPlan: string; 
    parallel?: boolean 
  }): Promise<any> {
    const { agents, taskPlan, parallel = false } = input;
    const coordinationId = `coord_${Date.now()}`;

    this.activeCoordinations.set(coordinationId, {
      agents,
      taskPlan,
      progress: new Map(agents.map(a => [a, { status: 'pending' }])),
      startTime: new Date()
    });

    // Store coordination plan in memory
    if (this.userId) {
      await setAgentMemory(
        this.userId,
        this.agent.id,
        `coordination_${coordinationId}`,
        {
          agents,
          taskPlan,
          parallel,
          status: 'active'
        },
        3600000 // 1 hour
      );
    }

    return {
      coordinationId,
      agents,
      taskPlan,
      executionMode: parallel ? 'parallel' : 'sequential',
      status: 'initiated',
      message: `Coordination initiated with ${agents.length} agents`
    };
  }

  async summarizeProgress(input: { 
    conversationId: string; 
    includeDetails?: boolean 
  }): Promise<any> {
    const { conversationId, includeDetails = false } = input;
    const summary: any = {
      conversationId,
      timestamp: new Date(),
      activeAgents: [],
      completedTasks: [],
      pendingTasks: [],
      overallProgress: 0
    };

    // Get coordination data from memory
    if (this.userId) {
      const coordinations = await searchAgentMemory(
        this.userId, 
        this.agent.id, 
        'coordination_'
      );

      for (const coord of coordinations) {
        if (coord.value.status === 'active') {
          summary.activeAgents.push(...coord.value.agents);
          if (includeDetails) {
            summary.coordinationDetails = coord.value;
          }
        }
      }

      // Get routing history
      const routings = await searchAgentMemory(
        this.userId,
        this.agent.id,
        'routing_'
      );

      summary.totalTasksRouted = routings.length;
      if (includeDetails) {
        summary.recentRoutings = routings.slice(0, 5);
      }
    }

    // Calculate overall progress from active coordinations
    for (const [id, coord] of this.activeCoordinations) {
      const completed = Array.from(coord.progress.values())
        .filter(p => p.status === 'completed').length;
      const total = coord.agents.length;
      coord.progress.forEach((progress, agent) => {
        if (progress.status === 'completed') {
          summary.completedTasks.push({ agent, coordination: id });
        } else if (progress.status === 'in_progress' || progress.status === 'pending') {
          summary.pendingTasks.push({ agent, coordination: id, status: progress.status });
        }
      });
      summary.overallProgress += (completed / total) * 100;
    }

    if (this.activeCoordinations.size > 0) {
      summary.overallProgress /= this.activeCoordinations.size;
    }

    return summary;
  }

  protected async executeToolCall(toolName: string, toolInput: any): Promise<any> {
    switch (toolName) {
      case 'route_task':
        return this.routeTask(toolInput);
      case 'get_agent_status':
        return this.getAgentStatus(toolInput);
      case 'coordinate_agents':
        return this.coordinateAgents(toolInput);
      case 'summarize_progress':
        return this.summarizeProgress(toolInput);
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  private getAgentSpecialties(agentId: string): string[] {
    const specialties: Record<string, string[]> = {
      dev: ['coding', 'debugging', 'architecture', 'performance'],
      designer: ['ui/ux', 'styling', 'accessibility', 'responsive design'],
      teacher: ['tutorials', 'documentation', 'quizzes', 'learning paths'],
      debugger: ['error analysis', 'troubleshooting', 'performance', 'security'],
      nexy: ['orchestration', 'routing', 'coordination', 'overview']
    };
    return specialties[agentId] || [];
  }

  private async getAgentLoad(agentId: string): Promise<string> {
    // In a real implementation, this would check actual agent workload
    // For now, return a simulated load level
    const loads = ['low', 'medium', 'high'];
    return loads[Math.floor(Math.random() * loads.length)];
  }

  updateCoordinationProgress(coordinationId: string, agentId: string, status: string, output?: any) {
    const coordination = this.activeCoordinations.get(coordinationId);
    if (coordination) {
      coordination.progress.set(agentId, { status, output });
      
      // Check if coordination is complete
      const allCompleted = Array.from(coordination.progress.values())
        .every(p => p.status === 'completed' || p.status === 'failed');
      
      if (allCompleted && this.userId) {
        // Update memory with completion status
        setAgentMemory(
          this.userId,
          this.agent.id,
          `coordination_${coordinationId}`,
          {
            ...coordination,
            status: 'completed',
            completedAt: new Date()
          },
          3600000 // Keep for 1 hour after completion
        );
        
        // Clean up active coordination
        this.activeCoordinations.delete(coordinationId);
      }
    }
  }
}