import { NextRequest, NextResponse } from 'next/server';
import { getVercelClient } from '../../../../lib/vercel/client';

export async function GET(request: NextRequest) {
  try {
    const client = await getVercelClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Not authenticated with Vercel' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const deploymentId = searchParams.get('deploymentId');
    const projectId = searchParams.get('projectId');
    const limit = searchParams.get('limit');

    if (deploymentId) {
      // Get specific deployment
      const deployment = await client.getDeployment(deploymentId);
      return NextResponse.json(deployment);
    } else {
      // List deployments
      const deployments = await client.listDeployments(
        projectId || undefined,
        limit ? parseInt(limit) : 20
      );
      return NextResponse.json(deployments);
    }
  } catch (error) {
    console.error('Error fetching Vercel deployments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await getVercelClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Not authenticated with Vercel' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, deploymentId, ...params } = body;

    if (action === 'cancel' && deploymentId) {
      // Cancel deployment
      const result = await client.cancelDeployment(deploymentId);
      return NextResponse.json(result);
    }

    if (action === 'redeploy' && deploymentId) {
      // Redeploy
      const result = await client.redeployDeployment(deploymentId, params);
      return NextResponse.json(result);
    }

    // Handle GitHub deployment
    if (action === 'deploy-from-github') {
      const { projectId, gitBranch = 'main', gitCommit } = params;
      
      if (!projectId) {
        return NextResponse.json(
          { error: 'Project ID is required for GitHub deployment' },
          { status: 400 }
        );
      }

      // Get project details
      const project = await client.getProject(projectId);
      
      if (!project.gitRepository) {
        return NextResponse.json(
          { error: 'Project is not connected to a Git repository' },
          { status: 400 }
        );
      }

      // Trigger deployment from GitHub
      const deployment = await client.createDeployment({
        name: project.name,
        project: projectId,
        target: params.target || 'production',
        gitSource: {
          type: project.gitRepository.type,
          ref: gitBranch,
          sha: gitCommit,
        },
        meta: {
          githubCommitRef: gitBranch,
          githubCommitSha: gitCommit,
          githubDeployment: '1',
        },
        files: [], // Empty for Git deployments
      } as any);

      return NextResponse.json(deployment);
    }

    // Create new deployment from files
    if (!params.name || !params.files) {
      return NextResponse.json(
        { error: 'Name and files are required for deployment' },
        { status: 400 }
      );
    }

    const deployment = await client.createDeployment(params);
    return NextResponse.json(deployment);
  } catch (error) {
    console.error('Error managing Vercel deployment:', error);
    return NextResponse.json(
      { error: 'Failed to manage deployment' },
      { status: 500 }
    );
  }
}