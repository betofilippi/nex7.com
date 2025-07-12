import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import VercelClient from '../../../../lib/vercel/client';
import { stateStore } from '../../../../lib/vercel/state-store';
import crypto from 'crypto';

const VERCEL_CLIENT_ID = process.env.VERCEL_CLIENT_ID!;
const VERCEL_CLIENT_SECRET = process.env.VERCEL_CLIENT_SECRET!;
const VERCEL_REDIRECT_URI = process.env.VERCEL_REDIRECT_URI || 'http://localhost:3000/api/vercel/callback';


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