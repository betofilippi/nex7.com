#!/bin/bash

echo "🔧 CORRIGINDO BASE AGENT"
echo "======================="

# Substituir implementações problemáticas no base-agent.ts
cat > src/lib/agents/base-agent.ts << 'EOF'
import { Agent, AgentPersonality, AgentCapability } from '../types/agent';
import { setAgentMemory, getAgentMemory, AgentMemory } from '../agent-memory';

export abstract class BaseAgent {
  protected agent: Agent;
  protected userId?: string;
  protected conversationId?: string;

  constructor(agent: Agent, userId?: string) {
    this.agent = agent;
    this.userId = userId;
    this.conversationId = Math.random().toString(36).substr(2, 9);
  }

  async processMessage(message: string, context?: any): Promise<string> {
    if (this.userId) {
      await this.storeInteraction('user', message);
    }

    const response = await this.generateResponse(message, context);
    
    if (this.userId) {
      await this.storeInteraction('assistant', response);
    }

    return response;
  }

  protected abstract generateResponse(message: string, context?: any): Promise<string>;

  protected async storeInteraction(role: 'user' | 'assistant', content: string) {
    if (!this.userId) return;

    await setAgentMemory(this.agent.id, {
      type: 'conversation',
      content: `${role}: ${content}`,
      metadata: {
        role,
        timestamp: new Date(),
        conversationId: this.conversationId,
        userId: this.userId
      }
    });
  }

  protected async getRecentInteractions(limit: number = 10): Promise<AgentMemory[]> {
    if (!this.userId) return [];

    const interactions = await getAgentMemory(this.agent.id, 'conversation');
    return interactions.slice(-limit);
  }

  protected async getUserPreferences(): Promise<any> {
    return {};
  }

  protected formatPersonality(): string {
    const { traits, communicationStyle, expertise } = this.agent.personality;
    return `Personality: ${traits.join(', ')}. Communication: ${communicationStyle}. Expertise: ${expertise.join(', ')}.`;
  }

  protected formatCapabilities(): string {
    return this.agent.capabilities
      .map(cap => `${cap.name}: ${cap.description}`)
      .join('\n');
  }

  getAgent(): Agent {
    return this.agent;
  }

  getId(): string {
    return this.agent.id;
  }

  getName(): string {
    return this.agent.name;
  }
}
EOF

echo "✅ Base agent corrigido"

# Testar build
echo ""
echo "🔨 Testando build..."
npm run build