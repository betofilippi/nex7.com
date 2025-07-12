import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  
  // Clear auth cookies
  response.cookies.delete('auth-token');
  response.cookies.delete('refresh-token');
  
  return response;
}