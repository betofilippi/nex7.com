export interface NeX7Config {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  settings?: Record<string, any>;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface ListProjectsResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIChatRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface AIChatResponse {
  id: string;
  model: string;
  messages: AIMessage[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIGenerateRequest {
  prompt: string;
  type: 'text' | 'code' | 'image';
  model?: string;
  options?: Record<string, any>;
}

export interface AIGenerateResponse {
  content: string;
  type: string;
  metadata?: Record<string, any>;
}

export interface APIKey {
  id: string;
  name: string;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  permissions: string[];
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export interface CreateAPIKeyRequest {
  name: string;
  tier?: 'free' | 'basic' | 'pro' | 'enterprise';
  permissions?: string[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}