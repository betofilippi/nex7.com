import Anthropic from '@anthropic-ai/sdk';
import { Stream } from '@anthropic-ai/sdk/streaming';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ClaudeClientConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ConversationContext {
  id: string;
  messages: ClaudeMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export class ClaudeClient {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private conversations: Map<string, ConversationContext>;

  constructor(config: ClaudeClientConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'claude-3-opus-20240229';
    this.maxTokens = config.maxTokens || 4096;
    this.temperature = config.temperature || 0;
    this.conversations = new Map();
  }

  // Create a new conversation context
  createConversation(id?: string): string {
    const conversationId = id || this.generateId();
    this.conversations.set(conversationId, {
      id: conversationId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return conversationId;
  }

  // Get conversation context
  getConversation(id: string): ConversationContext | undefined {
    return this.conversations.get(id);
  }

  // Update conversation context
  updateConversation(id: string, messages: ClaudeMessage[]): void {
    const conversation = this.conversations.get(id);
    if (conversation) {
      conversation.messages = messages;
      conversation.updatedAt = new Date();
    }
  }

  // Delete conversation context
  deleteConversation(id: string): boolean {
    return this.conversations.delete(id);
  }

  // Send a message without streaming
  async sendMessage(
    message: string,
    conversationId?: string,
    tools?: ClaudeTool[]
  ): Promise<Anthropic.Message> {
    const messages: ClaudeMessage[] = [];

    if (conversationId) {
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        messages.push(...conversation.messages);
      }
    }

    messages.push({ role: 'user', content: message });

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      ...(tools && { tools }),
    });

    // Update conversation if ID provided
    if (conversationId) {
      messages.push({
        role: 'assistant',
        content: response.content[0].type === 'text' ? response.content[0].text : '',
      });
      this.updateConversation(conversationId, messages);
    }

    return response;
  }

  // Send a message with streaming
  async sendMessageStream(
    message: string,
    conversationId?: string,
    tools?: ClaudeTool[]
  ): Promise<Stream<Anthropic.MessageStreamEvent>> {
    const messages: ClaudeMessage[] = [];

    if (conversationId) {
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        messages.push(...conversation.messages);
      }
    }

    messages.push({ role: 'user', content: message });

    const stream = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: true,
      ...(tools && { tools }),
    });

    // We'll update the conversation after the stream completes
    // This requires handling in the API route
    return stream;
  }

  // Tool execution wrapper
  async executeToolCall(
    toolName: string,
    toolInput: any,
    toolImplementations: Record<string, (input: any) => Promise<any>>
  ): Promise<any> {
    const implementation = toolImplementations[toolName];
    if (!implementation) {
      throw new Error(`Tool ${toolName} not implemented`);
    }

    try {
      return await implementation(toolInput);
    } catch (error) {
      throw new Error(`Tool execution failed: ${error}`);
    }
  }

  private generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export a singleton instance for easy use
let clientInstance: ClaudeClient | null = null;

export function getClaudeClient(apiKey?: string): ClaudeClient {
  if (!clientInstance) {
    if (!apiKey) {
      throw new Error('API key required for first initialization');
    }
    clientInstance = new ClaudeClient({ apiKey });
  }
  return clientInstance;
}