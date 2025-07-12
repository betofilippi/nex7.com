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
    const projectId = searchParams.get('projectId');
    const limit = searchParams.get('limit');

    if (projectId) {
      // Get specific project
      const project = await client.getProject(projectId);
      return NextResponse.json(project);
    } else {
      // List projects
      const projects = await client.listProjects(limit ? parseInt(limit) : 20);
      return NextResponse.json(projects);
    }
  } catch (error) {
    console.error('Error fetching Vercel projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
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
    const { name, framework, gitRepository, environmentVariables } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const project = await client.createProject({
      name,
      framework,
      gitRepository,
      environmentVariables,
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating Vercel project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const client = await getVercelClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Not authenticated with Vercel' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    await client.deleteProject(projectId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Vercel project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}