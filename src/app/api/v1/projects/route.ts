import { NextRequest, NextResponse } from 'next/server';
import { authenticateAPIRequest, APIKeyManager, APIPermissions } from '@/lib/api/auth';
import { checkRateLimit, setRateLimitHeaders } from '@/lib/api/rate-limiter';

const apiKeyManager = new APIKeyManager();

export async function GET(request: NextRequest) {
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
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // In production, fetch from database
    const projects = [
      {
        id: '1',
        name: 'Sample Project',
        description: 'A sample project',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {},
      },
    ];

    return NextResponse.json(
      {
        projects,
        total: projects.length,
        page,
        limit,
      },
      { headers }
    );
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500, headers }
    );
  }
}

export async function POST(request: NextRequest) {
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

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400, headers }
      );
    }

    // In production, save to database
    const project = {
      id: crypto.randomUUID(),
      name,
      description,
      settings: settings || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(project, { status: 201, headers });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500, headers }
    );
  }
}