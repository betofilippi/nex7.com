import { cookies } from 'next/headers';

export interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  latestDeployments: VercelDeployment[];
  createdAt: number;
  framework?: string;
  gitRepository?: {
    repo: string;
    type: string;
  };
}

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  type: 'LAMBDAS' | 'DOCKER' | 'STATIC';
  creator: {
    uid: string;
    email: string;
    username: string;
  };
  inspectorUrl: string;
  createdAt: number;
  buildingAt?: number;
  ready?: number;
  aliasError?: {
    code: string;
    message: string;
  };
  meta?: Record<string, unknown>;
}

export interface VercelDomain {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string | null;
  redirectStatusCode?: number | null;
  gitBranch?: string | null;
  updatedAt: number;
  createdAt: number;
  verified: boolean;
  verification?: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
}

export interface VercelEnv {
  type: 'plain' | 'secret' | 'encrypted' | 'sensitive';
  id: string;
  key: string;
  value: string;
  target: ('production' | 'preview' | 'development')[];
  configurationId?: string | null;
  createdAt: number;
  updatedAt: number;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface VercelBuildLog {
  type: 'command' | 'stdout' | 'stderr' | 'exit' | 'error';
  created: number;
  payload: string;
}

export interface DeploymentBuildLogs {
  deployment: VercelDeployment;
  logs: VercelBuildLog[];
}

export class VercelClient {
  private baseURL = 'https://api.vercel.com';
  private apiVersion = 'v9';

  constructor(private accessToken: string) {}

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(error.error?.message || `Vercel API error: ${response.status}`);
    }

    return response.json();
  }

  // OAuth Authentication Flow
  static getAuthorizationUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope: 'read-write',
    });
    return `https://vercel.com/oauth/authorize?${params.toString()}`;
  }

  static async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<{ access_token: string; token_type: string }> {
    const response = await fetch('https://api.vercel.com/v2/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    return response.json();
  }

  // Project Management
  async createProject(params: {
    name: string;
    framework?: string;
    gitRepository?: {
      repo: string;
      type: 'github' | 'gitlab' | 'bitbucket';
    };
    environmentVariables?: Array<{
      key: string;
      value: string;
      target?: ('production' | 'preview' | 'development')[];
    }>;
  }): Promise<VercelProject> {
    return this.request('v10/projects', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async listProjects(limit = 20): Promise<{ projects: VercelProject[] }> {
    return this.request(`v9/projects?limit=${limit}`);
  }

  async getProject(projectId: string): Promise<VercelProject> {
    return this.request(`v9/projects/${projectId}`);
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.request(`v9/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // Deployment Operations
  async createDeployment(params: {
    name: string;
    project?: string;
    files: Array<{
      file: string;
      sha?: string;
      size?: number;
    }>;
    projectSettings?: {
      framework?: string;
      buildCommand?: string;
      outputDirectory?: string;
      installCommand?: string;
      devCommand?: string;
    };
    target?: 'production' | 'staging';
    meta?: Record<string, string>;
  }): Promise<{ id: string; url: string; readyState: string }> {
    // First, upload files
    const { files, ...deploymentParams } = params;
    
    return this.request('v13/deployments', {
      method: 'POST',
      body: JSON.stringify({
        ...deploymentParams,
        files,
      }),
    });
  }

  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    return this.request(`v13/deployments/${deploymentId}`);
  }

  async listDeployments(projectId?: string, limit = 20): Promise<{ deployments: VercelDeployment[] }> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (projectId) params.append('projectId', projectId);
    
    return this.request(`v6/deployments?${params.toString()}`);
  }

  async cancelDeployment(deploymentId: string): Promise<{ state: 'CANCELED' }> {
    return this.request(`v12/deployments/${deploymentId}/cancel`, {
      method: 'PATCH',
    });
  }

  async redeployDeployment(deploymentId: string, params?: {
    name?: string;
    target?: 'production' | 'staging';
  }): Promise<{ id: string; url: string }> {
    return this.request(`v13/deployments/${deploymentId}/redeploy`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  // Domain Management
  async addDomain(projectId: string, domain: string): Promise<VercelDomain> {
    return this.request(`v10/projects/${projectId}/domains`, {
      method: 'POST',
      body: JSON.stringify({ name: domain }),
    });
  }

  async listDomains(projectId: string): Promise<{ domains: VercelDomain[] }> {
    return this.request(`v9/projects/${projectId}/domains`);
  }

  async removeDomain(projectId: string, domain: string): Promise<void> {
    await this.request(`v9/projects/${projectId}/domains/${domain}`, {
      method: 'DELETE',
    });
  }

  async verifyDomain(projectId: string, domain: string): Promise<VercelDomain> {
    return this.request(`v9/projects/${projectId}/domains/${domain}/verify`, {
      method: 'POST',
    });
  }

  // Environment Variables Management
  async createEnvVariable(
    projectId: string,
    params: {
      key: string;
      value: string;
      type?: 'plain' | 'secret' | 'encrypted' | 'sensitive';
      target?: ('production' | 'preview' | 'development')[];
    }
  ): Promise<VercelEnv> {
    return this.request(`v10/projects/${projectId}/env`, {
      method: 'POST',
      body: JSON.stringify({
        ...params,
        type: params.type || 'encrypted',
        target: params.target || ['production', 'preview', 'development'],
      }),
    });
  }

  async listEnvVariables(projectId: string): Promise<{ envs: VercelEnv[] }> {
    return this.request(`v9/projects/${projectId}/env`);
  }

  async updateEnvVariable(
    projectId: string,
    envId: string,
    params: {
      value?: string;
      target?: ('production' | 'preview' | 'development')[];
    }
  ): Promise<VercelEnv> {
    return this.request(`v9/projects/${projectId}/env/${envId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  async deleteEnvVariable(projectId: string, envId: string): Promise<void> {
    await this.request(`v9/projects/${projectId}/env/${envId}`, {
      method: 'DELETE',
    });
  }

  // Build Logs Streaming
  async *streamBuildLogs(deploymentId: string): AsyncGenerator<VercelBuildLog> {
    const response = await fetch(
      `${this.baseURL}/v2/deployments/${deploymentId}/events`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to stream logs: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const log = JSON.parse(line);
            yield log;
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    }
  }

  async getBuildLogs(deploymentId: string): Promise<DeploymentBuildLogs> {
    const [deployment, logsResponse] = await Promise.all([
      this.getDeployment(deploymentId),
      fetch(`${this.baseURL}/v2/deployments/${deploymentId}/events`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }),
    ]);

    if (!logsResponse.ok) {
      throw new Error(`Failed to get logs: ${logsResponse.statusText}`);
    }

    const text = await logsResponse.text();
    const logs: VercelBuildLog[] = text
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as VercelBuildLog[];

    return { deployment, logs };
  }
}

// Helper function to get Vercel client from stored token
export async function getVercelClient(): Promise<VercelClient | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('vercel_token')?.value;
  
  if (!token) {
    return null;
  }

  return new VercelClient(token);
}

export default VercelClient;