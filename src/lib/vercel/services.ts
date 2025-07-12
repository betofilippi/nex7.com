import { getVercelClient, VercelClient, VercelProject, VercelDeployment, VercelEnv } from './client';
import { projectTemplates, ProjectTemplate } from './templates';

export interface DeploymentOptions {
  projectId: string;
  branch?: string;
  commit?: string;
  target?: 'production' | 'preview';
  autoRollback?: boolean;
  environmentVariables?: Record<string, string>;
}

export interface BranchDeploymentConfig {
  projectId: string;
  branch: string;
  autoDeploy: boolean;
  target: 'production' | 'preview';
  domains?: string[];
}

export class VercelService {
  private client: VercelClient;

  constructor(client: VercelClient) {
    this.client = client;
  }

  // Static method to get service instance
  static async getInstance(): Promise<VercelService | null> {
    const client = await getVercelClient();
    if (!client) return null;
    return new VercelService(client);
  }

  // Project creation with templates
  async createProjectFromTemplate(
    name: string,
    templateKey: string,
    gitRepository?: {
      repo: string;
      type: 'github' | 'gitlab' | 'bitbucket';
    }
  ): Promise<VercelProject> {
    const template = projectTemplates[templateKey];
    if (!template) {
      throw new Error(`Template ${templateKey} not found`);
    }

    const project = await this.client.createProject({
      name,
      framework: template.framework,
      gitRepository,
      environmentVariables: template.environmentVariables,
    });

    // Set build settings if provided
    if (template.buildCommand || template.outputDirectory) {
      // Note: This might require additional API calls to update project settings
      // The Vercel API might handle this differently
    }

    return project;
  }

  // Environment variable management
  async syncEnvironmentVariables(
    projectId: string,
    variables: Record<string, string>,
    target: ('production' | 'preview' | 'development')[] = ['production', 'preview', 'development']
  ): Promise<void> {
    // Get existing variables
    const { envs } = await this.client.listEnvVariables(projectId);
    
    // Create a map of existing variables
    const existingVars = new Map(envs.map(env => [env.key, env]));
    
    // Update or create variables
    for (const [key, value] of Object.entries(variables)) {
      const existing = existingVars.get(key);
      
      if (existing) {
        // Update if value changed
        if (existing.value !== value) {
          await this.client.updateEnvVariable(projectId, existing.id, {
            value,
            target,
          });
        }
      } else {
        // Create new variable
        await this.client.createEnvVariable(projectId, {
          key,
          value,
          type: 'encrypted',
          target,
        });
      }
    }
    
    // Optionally remove variables not in the new set
    for (const [key, env] of existingVars) {
      if (!(key in variables)) {
        console.warn(`Variable ${key} exists but not in sync set`);
      }
    }
  }

  // Branch preview deployments
  async setupBranchPreview(config: BranchDeploymentConfig): Promise<void> {
    // This would typically involve:
    // 1. Setting up Git integration
    // 2. Configuring branch deployments
    // 3. Setting custom domains for branches
    
    // For now, we'll create a deployment for the branch
    const project = await this.client.getProject(config.projectId);
    
    if (!project.gitRepository) {
      throw new Error('Project must be connected to a Git repository');
    }

    // Add domains for the branch if specified
    if (config.domains && config.domains.length > 0) {
      for (const domain of config.domains) {
        await this.client.addDomain(config.projectId, domain);
      }
    }
  }

  // Deploy from GitHub with options
  async deployFromGitHub(options: DeploymentOptions): Promise<VercelDeployment> {
    const response = await fetch('/api/vercel/deployments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'deploy-from-github',
        projectId: options.projectId,
        gitBranch: options.branch || 'main',
        gitCommit: options.commit,
        target: options.target || 'production',
        meta: {
          autoRollback: options.autoRollback ? 'true' : 'false',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to deploy');
    }

    return response.json();
  }

  // Promote deployment from preview to production
  async promoteDeployment(deploymentId: string): Promise<VercelDeployment> {
    // Get deployment details
    const deployment = await this.client.getDeployment(deploymentId);
    
    // Redeploy with production target
    const result = await this.client.redeployDeployment(deploymentId, {
      target: 'production',
    });

    return this.client.getDeployment(result.id);
  }

  // Get deployment analytics
  async getDeploymentMetrics(deploymentId: string): Promise<{
    buildTime: number;
    totalSize: number;
    functionCount: number;
    status: string;
  }> {
    const deployment = await this.client.getDeployment(deploymentId);
    
    // Calculate metrics
    const buildTime = deployment.ready && deployment.buildingAt 
      ? deployment.ready - deployment.buildingAt 
      : 0;

    // These would come from more detailed API calls
    return {
      buildTime,
      totalSize: 0, // Would need additional API call
      functionCount: 0, // Would need additional API call
      status: deployment.state,
    };
  }

  // Rollback to previous deployment
  async rollbackDeployment(projectId: string): Promise<VercelDeployment> {
    // Get recent deployments
    const { deployments } = await this.client.listDeployments(projectId, 10);
    
    // Find the current production deployment
    const currentProd = deployments.find(d => 
      d.state === 'READY' && d.type === 'LAMBDAS'
    );
    
    if (!currentProd) {
      throw new Error('No current production deployment found');
    }

    // Find previous successful deployment
    const previousDeployment = deployments.find(d =>
      d.state === 'READY' && 
      d.uid !== currentProd.uid &&
      d.createdAt < currentProd.createdAt
    );

    if (!previousDeployment) {
      throw new Error('No previous deployment available for rollback');
    }

    // Redeploy the previous version
    const result = await this.client.redeployDeployment(previousDeployment.uid, {
      target: 'production',
    });

    return this.client.getDeployment(result.id);
  }

  // Clone project with settings
  async cloneProject(
    sourceProjectId: string,
    newName: string
  ): Promise<VercelProject> {
    // Get source project
    const sourceProject = await this.client.getProject(sourceProjectId);
    
    // Create new project with same settings
    const newProject = await this.client.createProject({
      name: newName,
      framework: sourceProject.framework,
      // Git repository would need to be set up separately
    });

    // Copy environment variables
    const { envs } = await this.client.listEnvVariables(sourceProjectId);
    
    for (const env of envs) {
      await this.client.createEnvVariable(newProject.id, {
        key: env.key,
        value: env.value,
        type: env.type,
        target: env.target,
      });
    }

    return newProject;
  }

  // Batch operations
  async batchDeleteProjects(projectIds: string[]): Promise<{
    succeeded: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const results = {
      succeeded: [] as string[],
      failed: [] as Array<{ id: string; error: string }>,
    };

    await Promise.all(
      projectIds.map(async (id) => {
        try {
          await this.client.deleteProject(id);
          results.succeeded.push(id);
        } catch (error) {
          results.failed.push({
            id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })
    );

    return results;
  }
}

// Utility functions for common operations
export async function quickDeploy(
  projectName: string,
  framework: string,
  gitRepo?: { repo: string; type: 'github' | 'gitlab' | 'bitbucket' }
): Promise<{ project: VercelProject; deployment?: VercelDeployment }> {
  const service = await VercelService.getInstance();
  if (!service) {
    throw new Error('Not authenticated with Vercel');
  }

  // Create project
  const project = await service.createProjectFromTemplate(
    projectName,
    framework,
    gitRepo
  );

  // If git repo is provided, trigger initial deployment
  if (gitRepo) {
    const deployment = await service.deployFromGitHub({
      projectId: project.id,
      branch: 'main',
      target: 'production',
    });

    return { project, deployment };
  }

  return { project };
}

// Export types
export type { ProjectTemplate };
export { projectTemplates };