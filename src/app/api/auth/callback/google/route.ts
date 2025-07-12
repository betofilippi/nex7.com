import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getOAuthUserInfo } from '../../../../../lib/oauth';
import { findOrCreateOAuthUser } from '../../../../../lib/users';
import { signJWT, signRefreshToken } from '../../../../../lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');
    const storedState = request.cookies.get('oauth-state')?.value;

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
    }

    // Verify state for CSRF protection
    if (!state || state !== storedState) {
      return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens('google', code);
    
    // Get user info
    const userInfo = await getOAuthUserInfo('google', tokens.access_token);
    
    // Find or create user
    const user = await findOrCreateOAuthUser(
      userInfo.email,
      userInfo.name,
      'google',
      userInfo.picture
    );

    // Generate JWT tokens
    const accessToken = await signJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });

    const refreshToken = await signRefreshToken({
      userId: user.id,
    });

    // Redirect to home with cookies
    const response = NextResponse.redirect(new URL('/', request.url));
    
    response.cookies.set('auth-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    });

    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Clear OAuth state
    response.cookies.delete('oauth-state');

    return response;
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
  }
}