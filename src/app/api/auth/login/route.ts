import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, validatePassword } from '../../../../lib/users';
import { signJWT, signRefreshToken } from '../../../../lib/jwt';
import { 
  createSecureApiHandler,
  z,
  requestSchemas,
  auditLogin,
  getClientIdentifier,
  authRateLimiter
} from '../../../../lib/security';

export const POST = createSecureApiHandler(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = requestSchemas.login.parse(body);
      const { email, password } = validatedData;
      
      // Get client info for audit
      const ipAddress = getClientIdentifier(request);
      const userAgent = request.headers.get('user-agent') || 'unknown';

    // Rate limit check specifically for auth endpoints
    const identifier = `auth:${ipAddress}:${email}`;
    const rateLimitResult = await authRateLimiter.checkLimit(identifier, false);
    
    if (!rateLimitResult.allowed) {
      await auditLogin('', email, ipAddress, userAgent, false, 'Rate limit exceeded');
      return NextResponse.json(
        {
          error: 'Too many login attempts',
          message: `Please try again after ${rateLimitResult.retryAfter} seconds`,
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
    }

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      await auditLogin('', email, ipAddress, userAgent, false, 'User not found');
      // Count failed attempt for rate limiting
      await authRateLimiter.checkLimit(identifier, false, false);
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Validate password
    const isValid = await validatePassword(user, password);
    if (!isValid) {
      await auditLogin(user.id, email, ipAddress, userAgent, false, 'Invalid password');
      // Count failed attempt for rate limiting
      await authRateLimiter.checkLimit(identifier, false, false);
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = await signJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });

    const refreshToken = await signRefreshToken({
      userId: user.id,
    });

    // Set cookies
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });

    // Set auth cookies
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
    
    // Audit successful login
    await auditLogin(user.id, email, ipAddress, userAgent, true);
    
    // Reset rate limit on successful login
    await authRateLimiter.reset(identifier);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
},
{
  rateLimit: false, // We handle rate limiting manually for auth
  csrf: false, // Login doesn't need CSRF
  validation: requestSchemas.login,
  audit: true,
  securityHeaders: true,
}
);