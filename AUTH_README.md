# JWT Authentication System

This project includes a complete JWT-based authentication system with the following features:

## Features

- **JWT Authentication**: Secure token-based authentication with access and refresh tokens
- **Local Authentication**: Email/password signup and login
- **OAuth Integration**: Google and GitHub OAuth support
- **Protected Routes**: Middleware-based route protection
- **Session Management**: Automatic token refresh and session persistence
- **Modern UI**: Responsive login/signup pages with Tailwind CSS
- **TypeScript**: Full type safety throughout the authentication system

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### 2. OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

#### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env.local`

### 3. Install Dependencies

The authentication system uses minimal dependencies. Additional packages needed:

```bash
npm install react-hook-form @hookform/resolvers zod axios react-hot-toast lucide-react bcryptjs
```

## Project Structure

```
src/
├── app/
│   ├── api/auth/
│   │   ├── login/          # Login endpoint
│   │   ├── signup/         # Signup endpoint
│   │   ├── logout/         # Logout endpoint
│   │   ├── me/            # Get current user
│   │   ├── refresh/       # Refresh token endpoint
│   │   ├── oauth/[provider]/  # OAuth initiation
│   │   └── callback/      # OAuth callbacks
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   └── dashboard/         # Protected dashboard
├── components/auth/       # Auth UI components
├── contexts/             # Auth context provider
├── hooks/                # Custom auth hooks
├── lib/                  # Auth utilities
│   ├── jwt.ts           # JWT token management
│   ├── users.ts         # User management (in-memory)
│   ├── password.ts      # Password hashing
│   └── oauth.ts         # OAuth configuration
└── middleware.ts         # Route protection middleware
```

## Usage

### Auth Context

The `AuthProvider` wraps your application and provides authentication state:

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading, login, logout } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;
  
  return <div>Welcome {user.name}!</div>;
}
```

### Protected Routes

Use the `useRequireAuth` hook to protect client components:

```tsx
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function ProtectedPage() {
  const { user, loading } = useRequireAuth('/login');
  
  if (loading) return <div>Loading...</div>;
  
  return <div>Protected content for {user.name}</div>;
}
```

### API Routes

Protected API routes can verify JWT tokens:

```tsx
import { verifyJWT } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  try {
    const payload = await verifyJWT(token);
    // User is authenticated
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

## Security Considerations

1. **Change default secrets**: Update `JWT_SECRET` and `JWT_REFRESH_SECRET` in production
2. **Use HTTPS**: OAuth and cookies require secure connections in production
3. **Database integration**: Replace in-memory user store with a real database
4. **Password hashing**: Currently uses Node.js crypto; consider bcrypt or argon2 for production
5. **Rate limiting**: Add rate limiting to auth endpoints
6. **CSRF protection**: OAuth state parameter provides CSRF protection

## Token Management

- **Access Token**: 15-minute expiry, stored in httpOnly cookie
- **Refresh Token**: 7-day expiry, stored in httpOnly cookie
- **Automatic Refresh**: Tokens are refreshed automatically when expired

## Customization

### Adding New OAuth Providers

1. Add provider configuration to `src/lib/oauth.ts`
2. Create callback route in `src/app/api/auth/callback/[provider]/`
3. Update `OAuthButtons` component
4. Add environment variables for client ID/secret

### Modifying Token Expiry

Update expiry times in:
- `src/lib/jwt.ts` - Token generation functions
- `src/app/api/auth/login/route.ts` - Cookie max age
- `src/app/api/auth/signup/route.ts` - Cookie max age

## Production Checklist

- [ ] Set strong JWT secrets
- [ ] Configure production OAuth redirect URLs
- [ ] Implement proper password hashing (bcrypt/argon2)
- [ ] Add database for user storage
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Implement password reset functionality
- [ ] Add email verification
- [ ] Set up monitoring and logging
- [ ] Configure CORS if needed