# Getting Started with NEX7

Welcome to NEX7 - the Visual Claude Code Development Platform! This guide will help you get up and running quickly.

## 🚀 What is NEX7?

NEX7 is a comprehensive development platform that combines the power of Claude AI with visual workflow building and intelligent automation. Key features include:

- **🤖 Multi-Agent AI System**: 5 specialized AI agents working together
- **🎨 Visual Canvas**: Drag-and-drop workflow builder
- **🔄 Auto-Deploy & Recovery**: Intelligent CI/CD with automatic error fixing
- **🎓 Beginner-Friendly**: Guided onboarding for all skill levels
- **⚡ Zero Configuration**: Works out of the box

## 📋 Prerequisites

Before getting started, ensure you have:

- **Node.js** 18+ and npm
- **Git** for version control
- **Claude API Key** from Anthropic
- **Vercel Account** (optional, for deployment)
- **GitHub Account** (optional, for OAuth and auto-deploy)

## ⚡ Quick Installation

### 1. Clone the Repository

```bash
git clone https://github.com/betofilippi/nex7.com.git
cd nex7.com
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create your environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Required: Claude AI API Key
ANTHROPIC_API_KEY=your_claude_api_key_here

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_jwt_secret_here

# Optional: OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Optional: Vercel Integration
VERCEL_TOKEN=your_vercel_token
VERCEL_PROJECT_ID=your_project_id
VERCEL_TEAM_ID=your_team_id

# Database (SQLite by default)
DATABASE_URL="file:./dev.db"

# Base URL
NEXTAUTH_URL=http://localhost:3000
```

### 4. Database Setup

Initialize the database:

```bash
npm run db:setup
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application!

## 🎯 First Steps

### 1. Complete Onboarding

When you first visit the application:

1. **Welcome Screen**: Meet Nexy, your AI guide
2. **Experience Level**: Choose your programming experience
3. **Project Type**: Select what you want to build
4. **Setup Complete**: Start using NEX7!

### 2. Explore the Dashboard

The main dashboard provides access to:

- **Canvas**: Visual workflow builder
- **Agents**: AI assistant chat interface
- **Deploy**: Deployment monitoring and management
- **Analytics**: Usage and performance metrics

### 3. Try the Canvas

Navigate to `/canvas` to explore the visual workflow builder:

1. **Drag Nodes**: From the palette on the left
2. **Connect Workflows**: Link nodes together
3. **Configure Properties**: Set up each node
4. **Execute Workflows**: Run your visual programs

### 4. Chat with Agents

Visit `/agents` to interact with specialized AI assistants:

- **Nexy**: Friendly guide for beginners
- **Dev**: Technical coding assistant
- **Designer**: UI/UX design helper
- **Teacher**: Patient programming instructor
- **Debugger**: Problem-solving specialist

## 🔧 Configuration

### API Keys Setup

#### 1. Claude API Key (Required)

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account and generate an API key
3. Add to `.env.local` as `ANTHROPIC_API_KEY`

#### 2. OAuth Setup (Optional)

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

**GitHub OAuth:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

#### 3. Vercel Integration (Optional)

1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to [Account Settings > Tokens](https://vercel.com/account/tokens)
3. Generate a new token
4. Find your Project ID in your Vercel project settings

### Auto-Deploy Setup

For automatic deployment monitoring and error recovery:

```bash
node scripts/setup-vercel-secrets.js
```

This script helps configure GitHub repository secrets for auto-deploy functionality.

## 🚦 Testing Your Setup

### 1. Health Check

Visit [http://localhost:3000/api/health](http://localhost:3000/api/health) to verify all services are running.

### 2. Claude Integration

Test the Claude integration by:
1. Going to `/agents`
2. Sending a message to any agent
3. Verifying you get a response

### 3. Database Connection

Check database connectivity:
```bash
npm run db:studio
```

### 4. Build Process

Test the build process:
```bash
npm run build
```

## 🎨 Customization

### Themes

NEX7 supports light and dark themes out of the box. You can:

1. Toggle themes using the theme switcher
2. Customize theme colors in `tailwind.config.ts`
3. Create custom theme presets

### Agents

Customize AI agent personalities by editing files in `src/lib/agents/`:

- `nexy-agent.ts` - Friendly guide
- `dev-agent.ts` - Technical assistant
- `designer-agent.ts` - Design helper
- `teacher-agent.ts` - Programming instructor
- `debugger-agent.ts` - Problem solver

### Canvas Nodes

Add custom workflow nodes by:

1. Creating new node components in `src/components/canvas/nodes/`
2. Registering them in `src/components/canvas/nodes/index.ts`
3. Adding node definitions to the palette

## 🔍 Debugging

### Common Issues

**Port Already in Use:**
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

**Database Issues:**
```bash
rm -f prisma/dev.db
npm run db:setup
```

**Build Errors:**
```bash
rm -rf .next
npm run build
```

### Logs and Monitoring

- **Development**: Check browser console and terminal
- **Production**: Monitor Vercel deployment logs
- **Database**: Use `npm run db:studio` for database inspection

## 📚 Next Steps

Now that you have NEX7 running:

1. **[Canvas Tutorial](../user-guide/canvas-workflow.md)**: Learn to build visual workflows
2. **[Agent System Guide](../user-guide/agent-system.md)**: Master AI agent collaboration
3. **[API Reference](../api-reference/README.md)**: Explore the complete API
4. **[Deployment Guide](../deployment/README.md)**: Deploy to production

## 🆘 Getting Help

- **Documentation**: Comprehensive guides in `/docs`
- **FAQ**: Common questions in [FAQ](../user-guide/faq.md)
- **Troubleshooting**: Step-by-step solutions in [Troubleshooting Guide](../user-guide/troubleshooting.md)
- **GitHub Issues**: Report bugs and request features
- **Discord Community**: Join our developer community (coming soon)

---

**Ready to build something amazing with NEX7? Let's get started!** 🚀