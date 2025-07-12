export const OAUTH_PROVIDERS = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scope: 'openid email profile',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scope: 'user:email',
  },
};

export function getOAuthRedirectUrl(provider: 'google' | 'github'): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/callback/${provider}`;
}

export function getOAuthAuthorizationUrl(provider: 'google' | 'github', state: string): string {
  const config = OAUTH_PROVIDERS[provider];
  const redirectUri = getOAuthRedirectUrl(provider);
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scope,
    state,
  });

  if (provider === 'google') {
    params.append('access_type', 'offline');
    params.append('prompt', 'consent');
  }

  return `${config.authorizationUrl}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  provider: 'google' | 'github',
  code: string
): Promise<{ access_token: string; refresh_token?: string }> {
  const config = OAUTH_PROVIDERS[provider];
  const redirectUri = getOAuthRedirectUrl(provider);

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  return response.json();
}

export async function getOAuthUserInfo(
  provider: 'google' | 'github',
  accessToken: string
): Promise<{ email: string; name: string; picture?: string }> {
  const config = OAUTH_PROVIDERS[provider];

  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (provider === 'github') {
    headers.Accept = 'application/vnd.github.v3+json';
  }

  const response = await fetch(config.userInfoUrl, { headers });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  const data = await response.json();

  if (provider === 'google') {
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  } else {
    // GitHub
    // Get email if not public
    let email = data.email;
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', { headers });
      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary);
        email = primaryEmail?.email || emails[0]?.email;
      }
    }

    return {
      email: email || `${data.login}@github.local`,
      name: data.name || data.login,
      picture: data.avatar_url,
    };
  }
}