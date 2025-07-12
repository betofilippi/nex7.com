import { NextRequest, NextResponse } from 'next/server';
import { authenticateAPIRequest, APIKeyManager, APIPermissions } from '@/lib/api/auth';
import { checkRateLimit, setRateLimitHeaders } from '@/lib/api/rate-limiter';

const apiKeyManager = new APIKeyManager();

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // Authenticate request
  const auth = await authenticateAPIRequest(request, apiKeyManager);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // Check permissions
  if (!apiKeyManager.hasPermission(auth.apiKey!, APIPermissions.PROJECT_READ)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(request, auth.apiKey!.key, auth.apiKey!.tier);
  const headers = new Headers();
  setRateLimitHeaders(headers, rateLimit);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers }
    );
  }

  try {
    // In production, fetch from database
    const project = {
      id: params.projectId,
      name: 'Sample Project',
      description: 'A sample project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {},
    };

    return NextResponse.json(project, { headers });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500, headers }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // Authenticate request
  const auth = await authenticateAPIRequest(request, apiKeyManager);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // Check permissions
  if (!apiKeyManager.hasPermission(auth.apiKey!, APIPermissions.PROJECT_WRITE)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(request, auth.apiKey!.key, auth.apiKey!.tier);
  const headers = new Headers();
  setRateLimitHeaders(headers, rateLimit);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers }
    );
  }

  try {
    const body = await request.json();
    const { name, description, settings } = body;

    // In production, update in database
    const project = {
      id: params.projectId,
      name: name || 'Sample Project',
      description: description || 'A sample project',
      settings: settings || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(project, { headers });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500, headers }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // Authenticate request
  const auth = await authenticateAPIRequest(request, apiKeyManager);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // Check permissions
  if (!apiKeyManager.hasPermission(auth.apiKey!, APIPermissions.PROJECT_DELETE)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(request, auth.apiKey!.key, auth.apiKey!.tier);
  const headers = new Headers();
  setRateLimitHeaders(headers, rateLimit);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers }
    );
  }

  try {
    // In production, delete from database
    return new NextResponse(null, { status: 204, headers });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500, headers }
    );
  }
}