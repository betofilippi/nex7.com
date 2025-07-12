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

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const domains = await client.listDomains(projectId);
    return NextResponse.json(domains);
  } catch (error) {
    console.error('Error fetching Vercel domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
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
    const { projectId, domain, action } = body;

    if (!projectId || !domain) {
      return NextResponse.json(
        { error: 'Project ID and domain are required' },
        { status: 400 }
      );
    }

    if (action === 'verify') {
      // Verify domain
      const result = await client.verifyDomain(projectId, domain);
      return NextResponse.json(result);
    }

    // Add domain
    const result = await client.addDomain(projectId, domain);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error managing Vercel domain:', error);
    return NextResponse.json(
      { error: 'Failed to manage domain' },
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
    const domain = searchParams.get('domain');

    if (!projectId || !domain) {
      return NextResponse.json(
        { error: 'Project ID and domain are required' },
        { status: 400 }
      );
    }

    await client.removeDomain(projectId, domain);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing Vercel domain:', error);
    return NextResponse.json(
      { error: 'Failed to remove domain' },
      { status: 500 }
    );
  }
}