// Simplified agent memory implementation
export interface AgentMemory {
  id: string;
  agentId: string;
  type: 'conversation' | 'knowledge' | 'experience';
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

export class AgentMemoryService {
  private memories: Map<string, AgentMemory[]> = new Map();

  async store(agentId: string, memory: Omit<AgentMemory, 'id' | 'agentId' | 'createdAt'>) {
    const id = Math.random().toString(36).substr(2, 9);
    const newMemory: AgentMemory = {
      ...memory,
      id,
      agentId,
      createdAt: new Date(),
    };

    const agentMemories = this.memories.get(agentId) || [];
    agentMemories.push(newMemory);
    this.memories.set(agentId, agentMemories);

    return newMemory;
  }

  async retrieve(agentId: string, type?: AgentMemory['type']) {
    const memories = this.memories.get(agentId) || [];
    if (type) {
      return memories.filter(m => m.type === type);
    }
    return memories;
  }

  async search(agentId: string, query: string) {
    const memories = this.memories.get(agentId) || [];
    return memories.filter(m => 
      m.content.toLowerCase().includes(query.toLowerCase())
    );
  }

  async update(memoryId: string, updates: Partial<AgentMemory>) {
    for (const [agentId, memories] of this.memories.entries()) {
      const index = memories.findIndex(m => m.id === memoryId);
      if (index !== -1) {
        memories[index] = {
          ...memories[index],
          ...updates,
          updatedAt: new Date(),
        };
        this.memories.set(agentId, memories);
        return memories[index];
      }
    }
    return null;
  }

  async delete(memoryId: string) {
    for (const [agentId, memories] of this.memories.entries()) {
      const filtered = memories.filter(m => m.id !== memoryId);
      if (filtered.length !== memories.length) {
        this.memories.set(agentId, filtered);
        return true;
      }
    }
    return false;
  }

  async clear(agentId: string) {
    this.memories.delete(agentId);
  }
}

export const agentMemory = new AgentMemoryService();

// Export convenience functions
export const setAgentMemory = (agentId: string, memory: Omit<AgentMemory, 'id' | 'agentId' | 'createdAt'>) => 
  agentMemory.store(agentId, memory);

export const getAgentMemory = (agentId: string, type?: AgentMemory['type']) => 
  agentMemory.retrieve(agentId, type);

export const searchAgentMemory = (agentId: string, query: string) => 
  agentMemory.search(agentId, query);

export const getAllAgentMemory = (agentId: string) => 
  agentMemory.retrieve(agentId);

export const clearAgentMemory = (agentId: string) => 
  agentMemory.clear(agentId);
export const cleanupExpiredMemories = async () => {
  // Placeholder for cleanup logic
  console.log('Cleaning up expired memories...');
};
