import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, getTokenFromCookies } from '../../../../lib/jwt';
import { findUserById } from '../../../../lib/users';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies or Authorization header
    let token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = await verifyJWT(token);
    
    // Get user data
    const user = await findUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }
}