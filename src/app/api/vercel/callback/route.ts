import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import VercelClient from '../../../../lib/vercel/client';
import { stateStore } from '../auth/route';

const VERCEL_CLIENT_ID = process.env.VERCEL_CLIENT_ID!;
const VERCEL_CLIENT_SECRET = process.env.VERCEL_CLIENT_SECRET!;
const VERCEL_REDIRECT_URI = process.env.VERCEL_REDIRECT_URI || 'http://localhost:3000/api/vercel/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('Vercel OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/dashboard?error=vercel_auth_failed&message=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard?error=vercel_auth_failed&message=Missing+required+parameters', request.url)
    );
  }

  // Verify state
  if (!stateStore.has(state)) {
    return NextResponse.redirect(
      new URL('/dashboard?error=vercel_auth_failed&message=Invalid+state+parameter', request.url)
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

    // Get user info to verify connection
    const client = new VercelClient(tokenData.access_token);
    
    // Log successful connection
    console.log('Vercel authentication successful');

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      new URL('/dashboard?vercel=connected&success=true', request.url)
    );
  } catch (error) {
    console.error('Vercel OAuth token exchange error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?error=vercel_auth_failed&message=Token+exchange+failed', request.url)
    );
  }
}