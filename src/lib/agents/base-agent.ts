import { ClaudeClient, ClaudeMessage, ClaudeTool } from '../claude-client';
import { Agent } from './definitions';
import { AgentMemory, getAgentMemory, setAgentMemory } from '../agent-memory';
import Anthropic from '@anthropic-ai/sdk';

export abstract class BaseAgent {
  protected agent: Agent;
  protected claudeClient: ClaudeClient;
  protected tools: ClaudeTool[];
  protected userId?: string;
  protected conversationId?: string;

  constructor(agent: Agent, claudeClient: ClaudeClient, tools: ClaudeTool[] = []) {
    this.agent = agent;
    this.claudeClient = claudeClient;
    this.tools = tools;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  setConversationId(conversationId: string) {
    this.conversationId = conversationId;
  }

  async sendMessage(
    message: string,
    conversationId: string,
    includeTools: boolean = true
  ): Promise<Anthropic.Message> {
    // Store user message in agent memory
    if (this.userId) {
      await this.storeInteraction('user', message);
    }

    // Add system prompt to enhance agent personality
    const enhancedMessage = this.enhanceWithPersonality(message);

    // Send message with or without tools
    const response = await this.claudeClient.sendMessage(
      enhancedMessage,
      conversationId,
      includeTools ? this.tools : undefined
    );

    // Process tool calls if any
    if (response.content.some(c => c.type === 'tool_use')) {
      return this.processToolCalls(response, conversationId);
    }

    // Store assistant response in memory
    if (this.userId && response.content[0].type === 'text') {
      await this.storeInteraction('assistant', response.content[0].text);
    }

    return response;
  }

  async sendMessageStream(
    message: string,
    conversationId: string,
    onChunk?: (chunk: string) => void,
    includeTools: boolean = true
  ): Promise<string> {
    // Store user message
    if (this.userId) {
      await this.storeInteraction('user', message);
    }

    const enhancedMessage = this.enhanceWithPersonality(message);
    const stream = await this.claudeClient.sendMessageStream(
      enhancedMessage,
      conversationId,
      includeTools ? this.tools : undefined
    );

    let fullResponse = '';
    
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullResponse += event.delta.text;
        if (onChunk) {
          onChunk(event.delta.text);
        }
      }
    }

    // Store full response
    if (this.userId) {
      await this.storeInteraction('assistant', fullResponse);
    }

    return fullResponse;
  }

  protected enhanceWithPersonality(message: string): string {
    // Build context from agent memory if available
    let context = '';
    if (this.userId) {
      // This would be async in real implementation
      context = '\n[Previous context and preferences are being considered]';
    }

    return `${this.agent.systemPrompt}${context}\n\nUser: ${message}`;
  }

  protected async processToolCalls(
    response: Anthropic.Message,
    conversationId: string
  ): Promise<Anthropic.Message> {
    const toolResults: any[] = [];

    for (const content of response.content) {
      if (content.type === 'tool_use') {
        const result = await this.executeToolCall(content.name, content.input);
        toolResults.push({
          tool_use_id: content.id,
          type: 'tool_result',
          content: JSON.stringify(result)
        });
      }
    }

    // Send tool results back to Claude
    const toolResponse = await this.claudeClient.sendMessage(
      JSON.stringify(toolResults),
      conversationId
    );

    return toolResponse;
  }

  protected abstract executeToolCall(toolName: string, toolInput: any): Promise<any>;

  protected async storeInteraction(role: 'user' | 'assistant', content: string) {
    if (!this.userId) return;

    const key = `interaction_${Date.now()}`;
    await setAgentMemory(
      this.userId,
      this.agent.id,
      key,
      {
        role,
        content,
        timestamp: new Date(),
        conversationId: this.conversationId
      },
      604800000, // 7 days
      {
        agentPersonality: this.agent.personality,
        capabilities: this.agent.capabilities.map(c => c.name)
      }
    );
  }

  protected async getRecentInteractions(limit: number = 10): Promise<AgentMemory[]> {
    if (!this.userId) return [];

    const interactions = await searchAgentMemory(
      this.userId,
      this.agent.id,
      'interaction_'
    );

    return interactions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  protected async getUserPreferences(): Promise<any> {
    if (!this.userId) return {};

    const prefs = await getAgentMemory(
      this.userId,
      this.agent.id,
      'user_preferences'
    );

    return prefs?.value || {};
  }

  protected async setUserPreference(key: string, value: any) {
    if (!this.userId) return;

    const currentPrefs = await this.getUserPreferences();
    currentPrefs[key] = value;

    await setAgentMemory(
      this.userId,
      this.agent.id,
      'user_preferences',
      currentPrefs,
      undefined, // No expiration for preferences
      { lastUpdated: new Date() }
    );
  }

  getAgent(): Agent {
    return this.agent;
  }

  getTools(): ClaudeTool[] {
    return this.tools;
  }
}