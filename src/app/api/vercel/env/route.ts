import { NextRequest, NextResponse } from 'next/server';
import { getVercelClient } from '../../../../lib/vercel/client';
import { VercelService } from '../../../../lib/vercel/services';

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

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const envs = await client.listEnvVariables(projectId);
    return NextResponse.json(envs);
  } catch (error) {
    console.error('Error fetching environment variables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch environment variables' },
      { status: 500 }
    );
  }
}

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
    const { projectId, action } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const client = await getVercelClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Not authenticated with Vercel' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'sync':
        // Sync multiple environment variables
        const { variables, target } = body;
        if (!variables || typeof variables !== 'object') {
          return NextResponse.json(
            { error: 'Variables object is required for sync' },
            { status: 400 }
          );
        }

        await service.syncEnvironmentVariables(projectId, variables, target);
        return NextResponse.json({ success: true });

      case 'create':
        // Create single variable
        const { key, value, type, target: createTarget } = body;
        if (!key || !value) {
          return NextResponse.json(
            { error: 'Key and value are required' },
            { status: 400 }
          );
        }

        const newEnv = await client.createEnvVariable(projectId, {
          key,
          value,
          type: type || 'encrypted',
          target: createTarget || ['production', 'preview', 'development'],
        });
        return NextResponse.json(newEnv);

      case 'update':
        // Update existing variable
        const { envId, ...updateParams } = body;
        if (!envId) {
          return NextResponse.json(
            { error: 'Environment variable ID is required' },
            { status: 400 }
          );
        }

        const updatedEnv = await client.updateEnvVariable(
          projectId,
          envId,
          updateParams
        );
        return NextResponse.json(updatedEnv);

      case 'bulk-create':
        // Create multiple variables
        const { variables: bulkVars } = body;
        if (!Array.isArray(bulkVars)) {
          return NextResponse.json(
            { error: 'Variables array is required' },
            { status: 400 }
          );
        }

        const results = await Promise.allSettled(
          bulkVars.map(async (variable) => {
            return client.createEnvVariable(projectId, {
              key: variable.key,
              value: variable.value,
              type: variable.type || 'encrypted',
              target: variable.target || ['production', 'preview', 'development'],
            });
          })
        );

        const created = (results as PromiseSettledResult<any>[])
          .filter((r) => r.status === 'fulfilled')
          .map((r) => (r as PromiseFulfilledResult<any>).value);
        
        const failed = (results as PromiseSettledResult<any>[])
          .filter((r) => r.status === 'rejected')
          .map((r, i) => ({
            variable: bulkVars[i],
            error: (r as PromiseRejectedResult).reason.message,
          }));

        return NextResponse.json({ created, failed });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing environment variables:', error);
    return NextResponse.json(
      { error: 'Failed to manage environment variables' },
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
    const envId = searchParams.get('envId');

    if (!projectId || !envId) {
      return NextResponse.json(
        { error: 'Project ID and environment variable ID are required' },
        { status: 400 }
      );
    }

    await client.deleteEnvVariable(projectId, envId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting environment variable:', error);
    return NextResponse.json(
      { error: 'Failed to delete environment variable' },
      { status: 500 }
    );
  }
}