import { NextRequest, NextResponse } from 'next/server';
import { APIKeyManager } from '@/lib/api/auth';

const apiKeyManager = new APIKeyManager();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tier = 'free', permissions = [] } = body;

    // In production, you would verify the user's identity here
    const userId = 'demo-user'; // Replace with actual user ID from session

    if (!name) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    const apiKey = await apiKeyManager.createAPIKey(
      userId,
      name,
      tier,
      permissions
    );

    // Return only safe fields
    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key,
      tier: apiKey.tier,
      permissions: apiKey.permissions,
      createdAt: apiKey.createdAt,
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // In production, verify user identity
    const userId = 'demo-user';

    const keys = await apiKeyManager.getUserAPIKeys(userId);

    // Return safe fields only
    const safeKeys = keys.map(k => ({
      id: k.id,
      name: k.name,
      tier: k.tier,
      permissions: k.permissions,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
    }));

    return NextResponse.json({ keys: safeKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    // In production, verify ownership
    const userId = 'demo-user';
    const keys = await apiKeyManager.getUserAPIKeys(userId);
    const key = keys.find(k => k.id === keyId);

    if (!key) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    await apiKeyManager.revokeAPIKey(key.key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}