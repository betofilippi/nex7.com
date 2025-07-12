import { AxiosInstance } from 'axios';
import { APIKey, CreateAPIKeyRequest } from '../types';

export class AuthResource {
  constructor(private axios: AxiosInstance) {}

  /**
   * Create a new API key
   */
  async createAPIKey(data: CreateAPIKeyRequest): Promise<APIKey> {
    const response = await this.axios.post('/auth', data);
    return response.data;
  }

  /**
   * List all API keys for the user
   */
  async listAPIKeys(): Promise<{ keys: APIKey[] }> {
    const response = await this.axios.get('/auth');
    return response.data;
  }

  /**
   * Revoke an API key
   */
  async revokeAPIKey(keyId: string): Promise<void> {
    await this.axios.delete(`/auth?id=${keyId}`);
  }
}