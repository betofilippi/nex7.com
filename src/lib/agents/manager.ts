import { ClaudeClient, ClaudeMessage } from '../claude-client';
import { Agent, agents, findBestAgentForContext } from './definitions';
import { BaseAgent } from './base-agent';
import { NexyAgent } from './nexy-agent';
import { DevAgent } from './dev-agent';
import { DesignerAgent } from './designer-agent';
import { TeacherAgent } from './teacher-agent';
import { DebuggerAgent } from './debugger-agent';

export interface AgentMessage extends ClaudeMessage {
  agentId: string;
  timestamp: Date;
  metadata?: {
    mood?: string;
    confidence?: number;
    suggestedNextAgent?: string;
    toolsUsed?: string[];
    memoryAccessed?: boolean;
  };
}

export interface AgentConversation {
  id: string;
  messages: AgentMessage[];
  activeAgentId: string;
  context: Map<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentCollaboration {
  fromAgent: string;
  toAgent: string;
  reason: string;
  context: Record<string, unknown>;
}

export class AgentManager {
  private claudeClient: ClaudeClient;
  private conversations: Map<string, AgentConversation>;
  private activeAgents: Map<string, Agent>;
  private collaborationQueue: AgentCollaboration[];
  private agentInstances: Map<string, BaseAgent>;
  private userId?: string;

  constructor(claudeClient: ClaudeClient) {
    this.claudeClient = claudeClient;
    this.conversations = new Map();
    this.activeAgents = new Map();
    this.collaborationQueue = [];
    this.agentInstances = new Map();
    this.initializeAgents();
  }

  private initializeAgents() {
    // Initialize all agent instances
    this.agentInstances.set('nexy', new NexyAgent(agents.nexy, this.claudeClient));
    this.agentInstances.set('dev', new DevAgent(agents.dev, this.claudeClient));
    this.agentInstances.set('designer', new DesignerAgent(agents.designer, this.claudeClient));
    this.agentInstances.set('teacher', new TeacherAgent(agents.teacher, this.claudeClient));
    this.agentInstances.set('debugger', new DebuggerAgent(agents.debugger, this.claudeClient));
  }

  setUserId(userId: string) {
    this.userId = userId;
    // Update all agent instances with user ID
    this.agentInstances.forEach(agent => agent.setUserId(userId));
  }

  // Create a new agent conversation
  createConversation(initialAgentId?: string): string {
    const conversationId = this.generateId();
    const activeAgentId = initialAgentId || 'nexy';
    
    this.conversations.set(conversationId, {
      id: conversationId,
      messages: [],
      activeAgentId,
      context: new Map() as Map<string, unknown>,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create underlying Claude conversation
    this.claudeClient.createConversation(conversationId);
    
    return conversationId;
  }

  // Get conversation
  getConversation(id: string): AgentConversation | undefined {
    return this.conversations.get(id);
  }

  // Switch active agent
  switchAgent(conversationId: string, agentId: string): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || !agents[agentId]) {
      return false;
    }

    const previousAgent = agents[conversation.activeAgentId];
    const newAgent = agents[agentId];

    // Add transition message
    const transitionMessage: AgentMessage = {
      role: 'assistant',
      content: `${previousAgent.name} has handed over to ${newAgent.name}. ${newAgent.greeting}`,
      agentId: agentId,
      timestamp: new Date(),
      metadata: {
        mood: 'welcoming'
      }
    };

    conversation.messages.push(transitionMessage);
    conversation.activeAgentId = agentId;
    conversation.updatedAt = new Date();

    return true;
  }

  // Send message with agent personality
  async sendMessage(
    conversationId: string,
    message: string,
    agentId?: string
  ): Promise<AgentMessage> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Determine agent if not specified
    if (!agentId) {
      agentId = conversation.activeAgentId;
      
      // Check if we should switch agents based on context
      const suggestedAgent = findBestAgentForContext(message);
      if (suggestedAgent.id !== agentId) {
        // Suggest agent switch but don't force it
        console.log(`Suggested agent switch from ${agentId} to ${suggestedAgent.id}`);
      }
    }

    const agent = agents[agentId];
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Add user message to conversation
    const userMessage: AgentMessage = {
      role: 'user',
      content: message,
      agentId: 'user',
      timestamp: new Date()
    };
    conversation.messages.push(userMessage);

    // Prepare messages for Claude with agent personality
    // const claudeMessages: ClaudeMessage[] = [
    //   { role: 'user', content: agent.systemPrompt },
    //   ...conversation.messages.map(msg => ({
    //     role: msg.role,
    //     content: msg.content
    //   }))
    // ];

    // Get the appropriate agent instance
    const agentInstance = this.agentInstances.get(agentId);
    if (!agentInstance) {
      throw new Error(`Agent instance not found: ${agentId}`);
    }

    // Set conversation context
    agentInstance.setConversationId(conversationId);

    // Send message through the agent with its tools
    const response = await agentInstance.sendMessage(
      message,
      conversationId,
      true // Include tools
    );

    // Extract response content
    const responseContent = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    // Analyze response for metadata
    const metadata = this.analyzeResponse(responseContent, agent);

    // Create agent message
    const agentMessage: AgentMessage = {
      role: 'assistant',
      content: responseContent,
      agentId: agent.id,
      timestamp: new Date(),
      metadata
    };

    // Add to conversation
    conversation.messages.push(agentMessage);
    conversation.updatedAt = new Date();

    // Check for collaboration opportunities
    if (metadata?.suggestedNextAgent && metadata?.suggestedNextAgent !== agent.id) {
      this.queueCollaboration({
        fromAgent: agent.id,
        toAgent: metadata.suggestedNextAgent,
        reason: 'Context suggests expertise needed',
        context: { lastMessage: message } as Record<string, unknown>
      });
    }

    return agentMessage;
  }

  // Stream message with agent personality
  async sendMessageStream(
    conversationId: string,
    message: string,
    agentId?: string,
    onChunk?: (chunk: string) => void
  ): Promise<AgentMessage> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    agentId = agentId || conversation.activeAgentId;
    const agent = agents[agentId];
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Add user message
    const userMessage: AgentMessage = {
      role: 'user',
      content: message,
      agentId: 'user',
      timestamp: new Date()
    };
    conversation.messages.push(userMessage);

    // Get the appropriate agent instance
    const agentInstance = this.agentInstances.get(agentId);
    if (!agentInstance) {
      throw new Error(`Agent instance not found: ${agentId}`);
    }

    // Set conversation context
    agentInstance.setConversationId(conversationId);

    // Stream from agent with its tools
    const fullResponse = await agentInstance.sendMessageStream(
      message,
      conversationId,
      onChunk,
      true // Include tools
    );

    // fullResponse is already populated by agentInstance.sendMessageStream

    // Create agent message
    const agentMessage: AgentMessage = {
      role: 'assistant',
      content: fullResponse,
      agentId: agent.id,
      timestamp: new Date(),
      metadata: this.analyzeResponse(fullResponse, agent)
    };

    conversation.messages.push(agentMessage);
    conversation.updatedAt = new Date();

    return agentMessage;
  }

  // Get agent collaboration suggestions
  getCollaborationSuggestions(conversationId: string): AgentCollaboration[] {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return [];
    }

    return this.collaborationQueue.filter(
      collab => collab.fromAgent === conversation.activeAgentId
    );
  }

  // Queue collaboration between agents
  private queueCollaboration(collaboration: AgentCollaboration): void {
    this.collaborationQueue.push(collaboration);
    
    // Keep queue size manageable
    if (this.collaborationQueue.length > 10) {
      this.collaborationQueue.shift();
    }
  }

  // Analyze response for metadata
  private analyzeResponse(response: string, agent: Agent): AgentMessage['metadata'] {
    const metadata: AgentMessage['metadata'] = {
      mood: 'neutral',
      confidence: 0.8,
      toolsUsed: [],
      memoryAccessed: false
    };

    // Simple mood detection based on response patterns
    if (response.includes('!') || response.includes('great') || response.includes('excellent')) {
      metadata.mood = 'excited';
    } else if (response.includes('?') && response.includes('help')) {
      metadata.mood = 'helpful';
    } else if (response.includes('sorry') || response.includes('apologize')) {
      metadata.mood = 'apologetic';
    }

    // Detect if another agent might be better suited
    const lowerResponse = response.toLowerCase();
    if (agent.id !== 'dev' && (lowerResponse.includes('code') || lowerResponse.includes('programming'))) {
      metadata.suggestedNextAgent = 'dev';
    } else if (agent.id !== 'designer' && (lowerResponse.includes('design') || lowerResponse.includes('ui'))) {
      metadata.suggestedNextAgent = 'designer';
    } else if (agent.id !== 'debugger' && (lowerResponse.includes('error') || lowerResponse.includes('bug'))) {
      metadata.suggestedNextAgent = 'debugger';
    }

    return metadata;
  }

  // Get conversation history
  getConversationHistory(conversationId: string): AgentMessage[] {
    const conversation = this.conversations.get(conversationId);
    return conversation ? conversation.messages : [];
  }

  // Clear conversation
  clearConversation(conversationId: string): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return false;
    }

    conversation.messages = [];
    conversation.context.clear();
    conversation.updatedAt = new Date();
    
    // Also clear Claude conversation
    this.claudeClient.updateConversation(conversationId, []);
    
    return true;
  }

  // Get active agent for conversation
  getActiveAgent(conversationId: string): Agent | undefined {
    const conversation = this.conversations.get(conversationId);
    return conversation ? agents[conversation.activeAgentId] : undefined;
  }

  // Set context data
  setContext(conversationId: string, key: string, value: unknown): void {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.context.set(key, value);
      conversation.updatedAt = new Date();
    }
  }

  // Get context data
  getContext(conversationId: string, key: string): unknown {
    const conversation = this.conversations.get(conversationId);
    return conversation ? conversation.context.get(key) : undefined;
  }

  private generateId(): string {
    return `agent_conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
let managerInstance: AgentManager | null = null;

export function getAgentManager(claudeClient: ClaudeClient): AgentManager {
  if (!managerInstance) {
    managerInstance = new AgentManager(claudeClient);
  }
  return managerInstance;
}