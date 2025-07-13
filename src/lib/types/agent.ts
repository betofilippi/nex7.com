export interface AgentPersonality {
  traits: string[];
  communicationStyle: string;
  expertise: string[];
}

export interface AgentCapability {
  name: string;
  description: string;
  enabled: boolean;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  personality: AgentPersonality;
  capabilities: AgentCapability[];
  color: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'busy';
  createdAt: Date;
  updatedAt: Date;
}