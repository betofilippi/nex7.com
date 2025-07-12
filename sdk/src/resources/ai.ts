import { AxiosInstance } from 'axios';
import {
  AIChatRequest,
  AIChatResponse,
  AIGenerateRequest,
  AIGenerateResponse,
} from '../types';

export class AIResource {
  constructor(private axios: AxiosInstance) {}

  /**
   * Chat with AI
   */
  async chat(data: AIChatRequest): Promise<AIChatResponse> {
    const response = await this.axios.post('/ai/chat', data);
    return response.data;
  }

  /**
   * Generate content with AI
   */
  async generate(data: AIGenerateRequest): Promise<AIGenerateResponse> {
    const response = await this.axios.post('/ai/generate', data);
    return response.data;
  }

  /**
   * Stream chat responses (if supported by the server)
   */
  async *streamChat(data: AIChatRequest): AsyncGenerator<string, void, unknown> {
    // In a real implementation, this would handle SSE streams
    const response = await this.chat(data);
    yield response.messages[response.messages.length - 1].content;
  }
}