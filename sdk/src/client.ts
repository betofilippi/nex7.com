import axios, { AxiosInstance, AxiosError } from 'axios';
import { NeX7Config, RateLimitInfo } from './types';
import { NeX7APIError, NeX7RateLimitError } from './errors';
import { ProjectsResource } from './resources/projects';
import { AIResource } from './resources/ai';
import { AuthResource } from './resources/auth';

export class NeX7Client {
  private axios: AxiosInstance;
  private config: NeX7Config;
  
  public projects: ProjectsResource;
  public ai: AIResource;
  public auth: AuthResource;

  constructor(config: NeX7Config) {
    this.config = {
      baseURL: 'https://api.nex7.com/v1',
      timeout: 30000,
      maxRetries: 3,
      ...config,
    };

    this.axios = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': '@nex7/sdk/1.0.0',
      },
    });

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => {
        // Extract rate limit info from headers
        const rateLimitInfo = this.extractRateLimitInfo(response.headers);
        if (rateLimitInfo) {
          response.data._rateLimitInfo = rateLimitInfo;
        }
        return response;
      },
      async (error: AxiosError) => {
        if (error.response) {
          const { status, data, headers } = error.response as any;
          
          // Handle rate limit errors
          if (status === 429) {
            const rateLimitInfo = this.extractRateLimitInfo(headers);
            throw new NeX7RateLimitError(
              data.error || 'Rate limit exceeded',
              rateLimitInfo?.limit || 0,
              rateLimitInfo?.remaining || 0,
              rateLimitInfo?.reset || new Date()
            );
          }

          // Handle other API errors
          throw new NeX7APIError(
            data.error || 'API request failed',
            status,
            data.code,
            data.details
          );
        }

        // Handle network errors
        if (error.code === 'ECONNABORTED') {
          throw new NeX7APIError('Request timeout', 0, 'timeout');
        }

        throw new NeX7APIError(
          error.message || 'Network error',
          0,
          'network_error'
        );
      }
    );

    // Initialize resources
    this.projects = new ProjectsResource(this.axios);
    this.ai = new AIResource(this.axios);
    this.auth = new AuthResource(this.axios);
  }

  private extractRateLimitInfo(headers: any): RateLimitInfo | null {
    const limit = headers['x-ratelimit-limit'];
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: new Date(reset),
      };
    }

    return null;
  }

  /**
   * Update the API key
   */
  updateAPIKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.axios.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
  }

  /**
   * Get the OpenAPI specification
   */
  async getOpenAPISpec(): Promise<any> {
    const response = await this.axios.get('/openapi');
    return response.data;
  }
}