# Environment Setup

Complete guide for configuring your NEX7 development environment with all integrations and optional services.

## 🔧 System Requirements

### Minimum Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher  
- **Git**: 2.30.0 or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space

### Recommended Development Tools
- **VS Code** with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - Prisma
  - ESLint
  - Prettier
- **Git GUI**: GitHub Desktop, SourceTree, or GitKraken
- **API Testing**: Postman, Insomnia, or Thunder Client
- **Database**: DB Browser for SQLite (development)

## 📝 Environment Variables Reference

### Required Variables

```env
# Claude AI Integration (Required)
ANTHROPIC_API_KEY=sk-ant-api03-...
# Get from: https://console.anthropic.com/

# JWT Authentication (Required)
JWT_SECRET=your_256_bit_secret_key_here
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Database (Required)
DATABASE_URL="file:./dev.db"
# For development: SQLite file
# For production: PostgreSQL connection string

# Base URL (Required)
NEXTAUTH_URL=http://localhost:3000
# For production: your domain URL
```

### OAuth Integration (Optional)

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
# Setup at: https://console.cloud.google.com/

# GitHub OAuth  
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
# Setup at: https://github.com/settings/developers

# OAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret
# Same as JWT_SECRET or generate separately
```

### Vercel Integration (Optional)

```env
# Vercel API Integration
VERCEL_TOKEN=your_vercel_token
VERCEL_PROJECT_ID=your_project_id  
VERCEL_TEAM_ID=your_team_id
# Get from: https://vercel.com/account/tokens

# Vercel Webhook Secret
VERCEL_WEBHOOK_SECRET=your_webhook_secret
# Configure in Vercel project settings
```

### Additional Services (Optional)

```env
# Email Service (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Analytics (optional)
ANALYTICS_ID=your_analytics_id
MIXPANEL_TOKEN=your_mixpanel_token

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

## 🔐 API Keys & Secrets Setup

### 1. Claude AI API Key

**Step-by-step setup:**

1. **Create Account**: Visit [Anthropic Console](https://console.anthropic.com/)
2. **Verify Email**: Check your email and verify your account
3. **Generate Key**: Go to API Keys section
4. **Copy Key**: Save the key starting with `sk-ant-api03-`
5. **Add to Environment**: Set `ANTHROPIC_API_KEY=sk-ant-api03-...`

**Usage Limits:**
- Free tier: $5 credit
- Pay-as-you-go: $0.25 per 1M input tokens
- Monitor usage in the Anthropic Console

### 2. JWT Secret Generation

**Secure secret generation:**

```bash
# Method 1: Node.js (Recommended)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 2: OpenSSL
openssl rand -hex 32

# Method 3: Online Generator (less secure)
# Use a trusted generator like https://generate-secret.vercel.app/32
```

**Security Notes:**
- Use a unique secret for each environment
- Store secrets securely (never commit to version control)
- Rotate secrets regularly in production

### 3. OAuth Configuration

#### Google OAuth Setup

1. **Google Cloud Console**: Visit [console.cloud.google.com](https://console.cloud.google.com/)
2. **Create Project**: Create a new project or select existing
3. **Enable APIs**: Enable Google+ API and OAuth consent screen
4. **Create Credentials**: 
   - Go to Credentials > Create Credentials > OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. **Copy Credentials**: Save Client ID and Client Secret

#### GitHub OAuth Setup

1. **GitHub Settings**: Go to [github.com/settings/developers](https://github.com/settings/developers)
2. **New OAuth App**: Click "New OAuth App"
3. **Configure App**:
   - Application name: "NEX7 Development"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. **Generate Secret**: Click "Generate a new client secret"
5. **Copy Credentials**: Save Client ID and Client Secret

### 4. Vercel Integration

#### Get Vercel Token

1. **Vercel Dashboard**: Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Account Settings**: Go to Settings > Tokens
3. **Create Token**: Name it "NEX7 Integration"
4. **Set Scope**: Full account access
5. **Copy Token**: Save the token

#### Find Project Information

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# List projects to find Project ID
vercel projects list

# Get project info
vercel project info [project-name]
```

## 🗄️ Database Configuration

### Development (SQLite)

Default configuration for local development:

```env
DATABASE_URL="file:./dev.db"
```

**Setup commands:**
```bash
# Generate Prisma client
npm run db:generate

# Create database and run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed

# Open database browser
npm run db:studio
```

### Production (PostgreSQL)

For production environments:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/nex7_production?schema=public"
```

**Supported databases:**
- PostgreSQL (recommended for production)
- MySQL (supported)
- SQLite (development only)
- MongoDB (with Prisma Atlas)

## 🏗️ Development Environment

### 1. IDE Configuration

**VS Code Settings** (`.vscode/settings.json`):

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  }
}
```

**Recommended VS Code Extensions:**
```bash
# Install via VS Code Extensions marketplace
code --install-extension bradlc.vscode-tailwindcss
code --install-extension Prisma.prisma
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
```

### 2. Git Configuration

**Configure Git hooks:**

```bash
# Install husky for git hooks
npm install --save-dev husky

# Setup pre-commit hooks
npx husky install
npx husky add .husky/pre-commit "npm run lint"
npx husky add .husky/pre-push "npm run type-check"
```

**Git ignore patterns** (already configured in `.gitignore`):
- Environment files (`.env.local`, `.env.production`)
- Database files (`*.db`, `*.db-journal`)
- Build outputs (`.next/`, `dist/`)
- Dependencies (`node_modules/`)

### 3. Development Scripts

**Available npm scripts:**

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # TypeScript type checking

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio

# Testing
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Analysis
npm run analyze      # Analyze code quality
npm run analyze:fix  # Auto-fix code issues

# Documentation
npm run storybook    # Start Storybook
npm run build-storybook # Build Storybook
```

## 🔧 Troubleshooting Setup

### Common Issues

**Port Already in Use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

**Permission Errors:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

**Database Connection Issues:**
```bash
# Reset database
rm -f prisma/dev.db
npm run db:migrate

# Check database file permissions
ls -la prisma/
```

**Environment Variable Issues:**
```bash
# Verify environment variables are loaded
node -e "console.log(process.env.ANTHROPIC_API_KEY ? 'API key loaded' : 'API key missing')"

# Check .env.local file
cat .env.local | grep ANTHROPIC_API_KEY
```

### Validation Script

Create a setup validation script:

```bash
# Create validation script
cat > scripts/validate-setup.js << 'EOF'
const fs = require('fs');
const path = require('path');

console.log('🔍 Validating NEX7 setup...\n');

// Check Node.js version
const nodeVersion = process.version;
console.log(`✅ Node.js version: ${nodeVersion}`);

// Check environment file
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file exists');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasApiKey = envContent.includes('ANTHROPIC_API_KEY');
  const hasJwtSecret = envContent.includes('JWT_SECRET');
  
  console.log(`${hasApiKey ? '✅' : '❌'} Claude API key configured`);
  console.log(`${hasJwtSecret ? '✅' : '❌'} JWT secret configured`);
} else {
  console.log('❌ .env.local file missing');
}

// Check database
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
if (fs.existsSync(dbPath)) {
  console.log('✅ Database file exists');
} else {
  console.log('⚠️  Database not initialized (run: npm run db:migrate)');
}

console.log('\n🎉 Setup validation complete!');
EOF

# Run validation
node scripts/validate-setup.js
```

## 🚀 Next Steps

With your environment configured:

1. **[Quick Start Tutorial](./quick-start.md)**: Build your first workflow
2. **[Canvas Guide](../user-guide/canvas-workflow.md)**: Master visual programming  
3. **[Agent System](../user-guide/agent-system.md)**: Work with AI assistants
4. **[Deployment](../deployment/README.md)**: Deploy to production

---

**Environment setup complete! Ready to build amazing things with NEX7!** ⚡