import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import VercelClient from '../../../../lib/vercel/client';
import crypto from 'crypto';

const VERCEL_CLIENT_ID = process.env.VERCEL_CLIENT_ID!;
const VERCEL_CLIENT_SECRET = process.env.VERCEL_CLIENT_SECRET!;
const VERCEL_REDIRECT_URI = process.env.VERCEL_REDIRECT_URI || 'http://localhost:3000/api/vercel/auth/callback';

// Store state temporarily (in production, use a proper store like Redis)
const stateStore = new Map<string, { timestamp: number }>();

// Clean up old states every hour
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.timestamp > 3600000) { // 1 hour
      stateStore.delete(state);
    }
  }
}, 3600000);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'login') {
    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    stateStore.set(state, { timestamp: Date.now() });

    // Get authorization URL
    const authUrl = VercelClient.getAuthorizationUrl(
      VERCEL_CLIENT_ID,
      VERCEL_REDIRECT_URI,
      state
    );

    return NextResponse.redirect(authUrl);
  }

  if (action === 'callback') {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      );
    }

    // Verify state
    if (!stateStore.has(state)) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }
    stateStore.delete(state);

    try {
      // Exchange code for token
      const tokenData = await VercelClient.exchangeCodeForToken(
        code,
        VERCEL_CLIENT_ID,
        VERCEL_CLIENT_SECRET,
        VERCEL_REDIRECT_URI
      );

      // Store token in secure HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set('vercel_token', tokenData.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });

      // Redirect to dashboard or success page
      return NextResponse.redirect(new URL('/dashboard?vercel=connected', request.url));
    } catch (error) {
      console.error('Vercel OAuth error:', error);
      return NextResponse.json(
        { error: 'Failed to authenticate with Vercel' },
        { status: 500 }
      );
    }
  }

  if (action === 'logout') {
    // Remove token cookie
    const cookieStore = await cookies();
    cookieStore.delete('vercel_token');
    
    return NextResponse.json({ success: true });
  }

  if (action === 'status') {
    // Check if user is authenticated
    const cookieStore = await cookies();
    const token = cookieStore.get('vercel_token')?.value;
    
    return NextResponse.json({ authenticated: !!token });
  }

  return NextResponse.json(
    { error: 'Invalid action' },
    { status: 400 }
  );
}