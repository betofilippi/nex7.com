import { NextRequest, NextResponse } from 'next/server';
import { VercelService } from '../../../../../lib/vercel/services';

export async function POST(request: NextRequest) {
  try {
    const service = await VercelService.getInstance();
    if (!service) {
      return NextResponse.json(
        { error: 'Not authenticated with Vercel' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { operation } = body;

    switch (operation) {
      case 'create-from-template': {
        const { name, template, gitRepository } = body;
        
        if (!name || !template) {
          return NextResponse.json(
            { error: 'Name and template are required' },
            { status: 400 }
          );
        }

        const project = await service.createProjectFromTemplate(
          name,
          template,
          gitRepository
        );

        return NextResponse.json(project);
      }

      case 'clone': {
        const { sourceProjectId, newName } = body;
        
        if (!sourceProjectId || !newName) {
          return NextResponse.json(
            { error: 'Source project ID and new name are required' },
            { status: 400 }
          );
        }

        const project = await service.cloneProject(sourceProjectId, newName);
        return NextResponse.json(project);
      }

      case 'batch-delete': {
        const { projectIds } = body;
        
        if (!Array.isArray(projectIds) || projectIds.length === 0) {
          return NextResponse.json(
            { error: 'Project IDs array is required' },
            { status: 400 }
          );
        }

        const results = await service.batchDeleteProjects(projectIds);
        return NextResponse.json(results);
      }

      case 'setup-branch-preview': {
        const { projectId, branch, autoDeploy, target, domains } = body;
        
        if (!projectId || !branch) {
          return NextResponse.json(
            { error: 'Project ID and branch are required' },
            { status: 400 }
          );
        }

        await service.setupBranchPreview({
          projectId,
          branch,
          autoDeploy: autoDeploy ?? true,
          target: target || 'preview',
          domains,
        });

        return NextResponse.json({ success: true });
      }

      case 'promote-deployment': {
        const { deploymentId } = body;
        
        if (!deploymentId) {
          return NextResponse.json(
            { error: 'Deployment ID is required' },
            { status: 400 }
          );
        }

        const deployment = await service.promoteDeployment(deploymentId);
        return NextResponse.json(deployment);
      }

      case 'rollback': {
        const { projectId } = body;
        
        if (!projectId) {
          return NextResponse.json(
            { error: 'Project ID is required' },
            { status: 400 }
          );
        }

        const deployment = await service.rollbackDeployment(projectId);
        return NextResponse.json(deployment);
      }

      case 'get-metrics': {
        const { deploymentId } = body;
        
        if (!deploymentId) {
          return NextResponse.json(
            { error: 'Deployment ID is required' },
            { status: 400 }
          );
        }

        const metrics = await service.getDeploymentMetrics(deploymentId);
        return NextResponse.json(metrics);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in project operation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    );
  }
}