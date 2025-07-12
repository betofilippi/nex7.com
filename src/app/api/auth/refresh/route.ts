import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signJWT, signRefreshToken } from '../../../../lib/jwt';
import { findUserById } from '../../../../lib/users';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh-token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token not found' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const { userId } = await verifyRefreshToken(refreshToken);

    // Get user
    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new tokens
    const newAccessToken = await signJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });

    const newRefreshToken = await signRefreshToken({
      userId: user.id,
    });

    // Set new cookies
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });

    response.cookies.set('auth-token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    });

    response.cookies.set('refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { message: 'Invalid refresh token' },
      { status: 401 }
    );
  }
}