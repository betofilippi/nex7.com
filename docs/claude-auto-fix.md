# Claude AI Auto-Fix System

## Overview

The Claude AI Auto-Fix system automatically detects and fixes deployment errors using AI-powered analysis. When a deployment fails, the system receives error notifications, analyzes them with Claude AI, and applies fixes automatically.

## Architecture

### Components

1. **Deployment Notification Endpoint** (`/api/claude/deployment-notify`)
   - Receives webhook notifications from Vercel or GitHub Actions
   - Stores error context for analysis
   - Triggers Claude AI analysis

2. **Fix Execution Endpoint** (`/api/claude/execute-fix`)
   - Executes fixes with security constraints
   - Supports file edits, commands, git operations, and npm commands
   - Returns execution results

3. **Claude Auto-Fix Script** (`scripts/claude-auto-fix.js`)
   - Analyzes errors using Claude AI
   - Falls back to pattern-based fixes if AI is unavailable
   - Generates and executes fixes

4. **GitHub Actions Integration**
   - Monitors deployments
   - Sends error contexts to Claude
   - Commits fixes automatically

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# Claude AI Integration
ANTHROPIC_API_KEY="your-anthropic-api-key"
CLAUDE_WEBHOOK_SECRET="generate-a-secure-webhook-secret"
INTERNAL_API_KEY="generate-a-secure-internal-api-key"
CLAUDE_AUTO_FIX_ENABLED="true"
CLAUDE_ALLOWED_IPS="" # Optional: comma-separated list of allowed IPs
```

### 2. Vercel Webhook Configuration

1. Go to your Vercel project settings
2. Navigate to Webhooks
3. Add a new webhook:
   - URL: `https://your-app.vercel.app/api/claude/deployment-notify`
   - Events: `deployment.failed`, `deployment.error`
   - Add header: `x-webhook-signature` with HMAC-SHA256 signature

### 3. GitHub Secrets

Add these secrets to your GitHub repository:

- `CLAUDE_WEBHOOK_SECRET`: Same as in .env
- `INTERNAL_API_KEY`: Same as in .env
- `APP_URL`: Your deployed application URL

## Security Features

### Rate Limiting

- **Webhook endpoint**: 100 requests per hour
- **Execute endpoint**: 50 executions per hour
- Configurable limits for authenticated services

### Request Validation

- Content-type validation
- Request size limits (10MB)
- Webhook signature verification
- Internal API key authentication

### Command Execution Safety

- Whitelist of allowed commands
- Path traversal prevention
- Command sanitization
- No pipes, redirects, or command chaining

### Security Headers

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Content Security Policy
- Request ID tracking

## Error Types and Fixes

### TypeScript Errors
- Property does not exist: Adds type definitions
- Cannot find name: Adds imports or definitions
- Type mismatches: Fixes type assignments

### Module Errors
- Missing modules: Runs npm install
- Import errors: Fixes import paths

### ESLint Errors
- Runs `npm run lint:fix`
- Applies auto-fixable rules

### Build Errors
- Analyzes error patterns
- Applies context-aware fixes

## Monitoring

### Logs

The system logs all operations:

```
[Claude Security] POST /api/claude/deployment-notify - Request ID: xxx
🔧 Executing fix for error: xxx
⚡ Executing file-edit: xxx
✅ Fixes applied successfully!
```

### Error Tracking

Errors are stored with:
- Error ID
- Timestamp
- Error type and details
- Build logs
- Git commit/branch
- Fix attempts
- Resolution status

## API Reference

### POST /api/claude/deployment-notify

Receives deployment error notifications.

**Headers:**
- `Content-Type: application/json`
- `x-webhook-signature: sha256=...` (optional)

**Body:**
```json
{
  "type": "deployment.error",
  "payload": {
    "deployment": { "id": "...", "url": "..." },
    "error": { "message": "..." },
    "logs": ["..."],
    "project": { "name": "..." }
  }
}
```

### POST /api/claude/execute-fix

Executes fixes for deployment errors.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {INTERNAL_API_KEY}`

**Body:**
```json
{
  "errorId": "xxx",
  "commands": [
    {
      "type": "file-edit",
      "action": "edit",
      "target": "src/file.ts",
      "content": "new content"
    }
  ],
  "description": "Fix TypeScript errors",
  "reasoning": "Add missing type definitions"
}
```

### GET /api/claude/execute-fix?errorId=xxx

Retrieves fix execution results.

## Troubleshooting

### Common Issues

1. **Rate limit exceeded**
   - Wait for the rate limit window to reset
   - Check if someone is abusing the endpoints

2. **Webhook signature validation failed**
   - Verify CLAUDE_WEBHOOK_SECRET matches
   - Check webhook configuration in Vercel

3. **Command execution blocked**
   - Check if command is in allowed list
   - Verify no dangerous patterns

4. **Claude API errors**
   - Check ANTHROPIC_API_KEY is valid
   - Monitor API rate limits
   - System falls back to pattern-based fixes

### Debug Mode

Enable debug logging:

```env
DEBUG=claude:*
```

## Best Practices

1. **Testing**
   - Test fixes locally before enabling auto-fix
   - Start with CLAUDE_AUTO_FIX_ENABLED=false
   - Monitor initial deployments closely

2. **Security**
   - Rotate API keys regularly
   - Use IP allowlisting for production
   - Monitor logs for suspicious activity

3. **Performance**
   - Claude analysis adds 30-60s to recovery time
   - Pattern-based fixes are faster but less accurate
   - Balance between automation and manual review

## Limitations

- Cannot fix logic errors
- Limited to file system and git operations
- No database migrations
- No external API calls
- Maximum 3 fix attempts per error