import { NextRequest, NextResponse } from 'next/server';
import { getOAuthAuthorizationUrl } from '../../../../../lib/oauth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  
  if (provider !== 'google' && provider !== 'github') {
    return NextResponse.json(
      { message: 'Invalid provider' },
      { status: 400 }
    );
  }

  const state = request.nextUrl.searchParams.get('state');
  if (!state) {
    return NextResponse.json(
      { message: 'State parameter is required' },
      { status: 400 }
    );
  }

  const authUrl = getOAuthAuthorizationUrl(provider as 'google' | 'github', state);
  return NextResponse.redirect(authUrl);
}