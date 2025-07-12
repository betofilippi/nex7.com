# Troubleshooting Guide

Comprehensive solutions for common issues in NEX7. Follow these step-by-step procedures to resolve problems quickly.

## 🚨 Quick Diagnostic Checklist

Before diving into specific issues, run through this quick checklist:

```bash
# 1. Check system requirements
node --version  # Should be 18+
npm --version   # Should be 9+

# 2. Verify environment setup
cat .env.local | grep -E "(ANTHROPIC_API_KEY|JWT_SECRET|DATABASE_URL)"

# 3. Test basic connectivity
curl -f http://localhost:3000/api/health || echo "API not responding"

# 4. Check recent logs
npm run dev 2>&1 | head -50
```

## 🔧 Installation and Setup Issues

### Issue: `npm install` fails

**Symptoms**:
- Dependency installation errors
- Permission denied errors
- Network timeouts

**Solutions**:

1. **Clear npm cache**:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Fix npm permissions** (macOS/Linux):
   ```bash
   sudo chown -R $(whoami) ~/.npm
   sudo chown -R $(whoami) /usr/local/lib/node_modules
   ```

3. **Use alternative registry**:
   ```bash
   npm install --registry https://registry.npmjs.org/
   ```

4. **Network issues**:
   ```bash
   npm config set proxy http://proxy.company.com:8080
   npm config set https-proxy http://proxy.company.com:8080
   ```

### Issue: Environment variables not working

**Symptoms**:
- "API key missing" errors
- Authentication failures
- Database connection issues

**Solutions**:

1. **Verify .env.local exists**:
   ```bash
   ls -la .env.local
   # Should show file with appropriate permissions
   ```

2. **Check file format**:
   ```bash
   # Correct format (no spaces around =)
   ANTHROPIC_API_KEY=sk-ant-api03-...
   
   # Incorrect format
   ANTHROPIC_API_KEY = sk-ant-api03-...
   ```

3. **Test environment loading**:
   ```bash
   node -e "console.log(process.env.ANTHROPIC_API_KEY ? 'Loaded' : 'Missing')"
   ```

4. **Check for hidden characters**:
   ```bash
   cat -A .env.local  # Should not show ^M or other control characters
   ```

### Issue: Database connection fails

**Symptoms**:
- "Can't reach database server" errors
- Prisma connection timeouts
- Migration failures

**Solutions**:

1. **Test database URL**:
   ```bash
   # For PostgreSQL
   psql "$DATABASE_URL" -c "SELECT version();"
   
   # For SQLite (development)
   sqlite3 prisma/dev.db ".tables"
   ```

2. **Reset database** (development):
   ```bash
   rm -f prisma/dev.db
   npx prisma migrate dev
   npx prisma db seed
   ```

3. **Check Prisma configuration**:
   ```bash
   npx prisma validate
   npx prisma generate
   ```

4. **Database permissions**:
   ```bash
   # Check file permissions for SQLite
   ls -la prisma/dev.db
   
   # Should be readable/writable by current user
   chmod 664 prisma/dev.db
   ```

## 🚀 Development Server Issues

### Issue: Server won't start

**Symptoms**:
- Port already in use
- Build compilation errors
- Module not found errors

**Solutions**:

1. **Port conflicts**:
   ```bash
   # Find process using port 3000
   lsof -ti:3000
   
   # Kill the process
   lsof -ti:3000 | xargs kill -9
   
   # Or use different port
   npm run dev -- -p 3001
   ```

2. **Clear build cache**:
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   npm run build
   ```

3. **TypeScript errors**:
   ```bash
   npm run type-check
   # Fix reported errors, then:
   npm run dev
   ```

4. **Missing dependencies**:
   ```bash
   npm install
   # Or for specific missing module:
   npm install missing-module-name
   ```

### Issue: Hot reload not working

**Symptoms**:
- Changes don't reflect automatically
- Browser doesn't refresh
- Console shows no updates

**Solutions**:

1. **Check file watcher limits** (Linux):
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Restart development server**:
   ```bash
   # Stop server (Ctrl+C)
   rm -rf .next
   npm run dev
   ```

3. **Browser cache issues**:
   ```bash
   # Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   # Or disable cache in browser dev tools
   ```

4. **WSL issues** (Windows):
   ```bash
   # Add to .env.local
   WATCHPACK_POLLING=true
   ```

### Issue: Build fails in production

**Symptoms**:
- `npm run build` errors
- TypeScript compilation issues
- Missing environment variables

**Solutions**:

1. **Check TypeScript errors**:
   ```bash
   npm run type-check
   # Fix all TypeScript errors before building
   ```

2. **Verify all environment variables**:
   ```bash
   # Create .env.production with all required variables
   cp .env.local .env.production
   ```

3. **Check for client-side code in server**:
   ```bash
   # Look for browser-only APIs in server-side code
   grep -r "window\|document\|localStorage" src/app/api/
   ```

4. **Memory issues**:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

## 🤖 AI Agent Issues

### Issue: Agents not responding

**Symptoms**:
- No response from any agent
- "API key invalid" errors
- Request timeouts

**Solutions**:

1. **Verify Claude API key**:
   ```bash
   curl -H "Authorization: Bearer $ANTHROPIC_API_KEY" \
        -H "Content-Type: application/json" \
        https://api.anthropic.com/v1/messages
   ```

2. **Check API key format**:
   ```bash
   # Should start with sk-ant-api03-
   echo $ANTHROPIC_API_KEY | grep "^sk-ant-api03-"
   ```

3. **Test with minimal request**:
   ```bash
   curl -X POST https://api.anthropic.com/v1/messages \
        -H "Content-Type: application/json" \
        -H "x-api-key: $ANTHROPIC_API_KEY" \
        -d '{
          "model": "claude-3-sonnet-20240229",
          "max_tokens": 100,
          "messages": [{"role": "user", "content": "Hello"}]
        }'
   ```

4. **Check rate limits**:
   ```bash
   # Wait a few minutes if you've made many requests
   # Check Anthropic Console for usage limits
   ```

### Issue: Agent responses are slow

**Symptoms**:
- Long delays before responses
- Timeout errors
- Inconsistent response times

**Solutions**:

1. **Optimize prompts**:
   ```typescript
   // Shorter, more focused prompts
   const prompt = "Review this React component for performance issues";
   // Instead of very long, detailed prompts
   ```

2. **Check network connectivity**:
   ```bash
   ping api.anthropic.com
   traceroute api.anthropic.com
   ```

3. **Use streaming responses**:
   ```typescript
   // Enable streaming in agent configuration
   const response = await claude.messages.create({
     stream: true,
     // ... other options
   });
   ```

4. **Implement caching**:
   ```typescript
   // Cache frequently used responses
   const cachedResponse = await redis.get(`agent:${hash(prompt)}`);
   if (cachedResponse) return cachedResponse;
   ```

### Issue: Agents give irrelevant responses

**Symptoms**:
- Responses don't match the question
- Generic or unhelpful answers
- Agent seems confused

**Solutions**:

1. **Provide more context**:
   ```typescript
   // Include relevant context
   const message = `
   I'm working on a React Next.js project using TypeScript.
   Current issue: Component won't re-render when state changes.
   
   Here's my component code:
   ${componentCode}
   
   What could be causing this issue?
   `;
   ```

2. **Use the right agent**:
   ```typescript
   // Use Dev agent for technical issues
   // Use Designer agent for UI/UX questions
   // Use Teacher agent for learning concepts
   ```

3. **Break down complex questions**:
   ```typescript
   // Instead of one complex question:
   "How do I build a full-stack app with authentication and real-time features?"
   
   // Ask step by step:
   "What's the best approach for user authentication in Next.js?"
   ```

4. **Clear conversation context**:
   ```typescript
   // Start a new conversation for unrelated topics
   // Use clear, specific language
   ```

## 🎨 Canvas and Workflow Issues

### Issue: Canvas nodes won't connect

**Symptoms**:
- Can't drag connections between nodes
- Connections disappear immediately
- "Invalid connection" errors

**Solutions**:

1. **Check node compatibility**:
   ```typescript
   // Verify output type matches input type
   // Example: String output → String input ✓
   //          String output → Number input ✗
   ```

2. **Validate node configuration**:
   ```bash
   # Ensure all required node properties are set
   # Check for missing mandatory inputs
   ```

3. **Clear canvas cache**:
   ```bash
   # Clear browser localStorage
   localStorage.removeItem('nex7-canvas-data');
   
   # Or refresh the page
   ```

4. **Check for circular dependencies**:
   ```typescript
   // Ensure nodes don't create loops
   // A → B → C → A (invalid)
   // A → B → C ✓ (valid)
   ```

### Issue: Workflows fail to execute

**Symptoms**:
- Execution stops at certain nodes
- Error messages in execution logs
- Partial workflow completion

**Solutions**:

1. **Check node inputs**:
   ```typescript
   // Verify all required inputs are connected
   // Check input data types and formats
   ```

2. **Validate API credentials**:
   ```bash
   # For GitHub nodes: check GitHub token
   # For Vercel nodes: check Vercel token
   # For Claude nodes: check Claude API key
   ```

3. **Test nodes individually**:
   ```typescript
   // Execute each node separately to isolate issues
   // Check node configuration and inputs
   ```

4. **Review execution logs**:
   ```bash
   # Check browser console for detailed error messages
   # Look for network errors, API errors, or validation errors
   ```

### Issue: Canvas performance is slow

**Symptoms**:
- Lag when dragging nodes
- Slow rendering with many nodes
- Browser becomes unresponsive

**Solutions**:

1. **Optimize workflow size**:
   ```typescript
   // Break large workflows into smaller sub-workflows
   // Use workflow templates for common patterns
   ```

2. **Browser performance**:
   ```bash
   # Close unnecessary browser tabs
   # Clear browser cache and cookies
   # Disable browser extensions temporarily
   ```

3. **Reduce visual complexity**:
   ```typescript
   // Simplify node designs
   // Reduce number of visible connections
   // Use grouping to organize nodes
   ```

4. **System resources**:
   ```bash
   # Check available RAM
   free -h
   
   # Check CPU usage
   top
   ```

## 🚀 Deployment Issues

### Issue: Vercel deployment fails

**Symptoms**:
- Build errors on Vercel
- Environment variable issues
- Function timeout errors

**Solutions**:

1. **Check build logs**:
   ```bash
   # Review Vercel deployment logs
   # Look for specific error messages
   ```

2. **Verify environment variables**:
   ```bash
   # Ensure all required variables are set in Vercel
   vercel env ls
   ```

3. **Test build locally**:
   ```bash
   npm run build
   npm run start
   ```

4. **Check function limits**:
   ```bash
   # Vercel has limits on function size and execution time
   # Consider optimizing large functions
   ```

### Issue: Auto-recovery not working

**Symptoms**:
- Errors not automatically fixed
- GitHub issues not created
- Recovery scripts failing

**Solutions**:

1. **Check GitHub secrets**:
   ```bash
   # Verify these secrets are set in GitHub repository:
   # VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID
   ```

2. **Verify webhook configuration**:
   ```bash
   # Check GitHub webhook settings
   # Ensure webhook URL is correct and active
   ```

3. **Test recovery scripts manually**:
   ```bash
   bash scripts/auto-fix-errors.sh
   node scripts/monitor-vercel-deployment.js
   ```

4. **Check GitHub Actions logs**:
   ```bash
   # Review workflow execution logs in GitHub Actions tab
   # Look for permission errors or API failures
   ```

### Issue: Database migration fails in production

**Symptoms**:
- Migration errors during deployment
- Schema mismatch errors
- Data loss concerns

**Solutions**:

1. **Test migrations locally**:
   ```bash
   # Create a copy of production data
   npx prisma migrate dev
   ```

2. **Use shadow database**:
   ```bash
   # Set SHADOW_DATABASE_URL for safe migrations
   export SHADOW_DATABASE_URL="postgresql://..."
   npx prisma migrate deploy
   ```

3. **Backup before migration**:
   ```bash
   # Create database backup
   pg_dump $DATABASE_URL > backup.sql
   ```

4. **Rollback if needed**:
   ```bash
   # Restore from backup if migration fails
   psql $DATABASE_URL < backup.sql
   ```

## 🔐 Authentication and Security Issues

### Issue: Login not working

**Symptoms**:
- OAuth login failures
- JWT token errors
- Session not persisting

**Solutions**:

1. **Check OAuth configuration**:
   ```bash
   # Verify OAuth app settings in Google/GitHub
   # Ensure callback URLs are correct
   ```

2. **Verify JWT secret**:
   ```bash
   # Ensure JWT_SECRET is set and secure
   echo $JWT_SECRET | wc -c  # Should be 64+ characters
   ```

3. **Check session configuration**:
   ```typescript
   // Verify session settings in NextAuth.js config
   // Check cookie domain and security settings
   ```

4. **Browser issues**:
   ```bash
   # Clear browser cookies and local storage
   # Disable ad blockers temporarily
   # Try incognito/private browsing mode
   ```

### Issue: API authentication errors

**Symptoms**:
- "Unauthorized" errors
- Token validation failures
- Permission denied messages

**Solutions**:

1. **Check token format**:
   ```bash
   # Token should be: Bearer <jwt-token>
   curl -H "Authorization: Bearer $TOKEN" /api/endpoint
   ```

2. **Verify token expiration**:
   ```bash
   # Decode JWT to check expiration
   node -e "console.log(JSON.parse(Buffer.from('$TOKEN'.split('.')[1], 'base64').toString()))"
   ```

3. **Test with fresh token**:
   ```bash
   # Log out and log back in to get new token
   # Or use refresh token endpoint
   ```

4. **Check API permissions**:
   ```typescript
   // Verify user has permission for the requested action
   // Check role-based access control settings
   ```

## 📊 Performance Issues

### Issue: Application is slow

**Symptoms**:
- Slow page loads
- Laggy interactions
- High memory usage

**Solutions**:

1. **Analyze bundle size**:
   ```bash
   npm run analyze
   # Review bundle analyzer output
   ```

2. **Optimize images**:
   ```bash
   # Use next/image for automatic optimization
   # Compress images before uploading
   ```

3. **Database query optimization**:
   ```typescript
   // Use Prisma query optimization
   // Add database indexes for frequent queries
   // Use database query explain plans
   ```

4. **Enable caching**:
   ```typescript
   // Implement Redis caching
   // Use Next.js static generation where possible
   // Cache API responses
   ```

### Issue: High API usage costs

**Symptoms**:
- Unexpected Claude API bills
- Rate limit warnings
- Excessive API calls

**Solutions**:

1. **Implement request caching**:
   ```typescript
   // Cache similar requests
   // Use shorter cache TTLs for dynamic content
   ```

2. **Optimize prompts**:
   ```typescript
   // Use shorter, more efficient prompts
   // Reduce max_tokens where appropriate
   ```

3. **Monitor usage**:
   ```bash
   # Track API usage in Anthropic Console
   # Set up usage alerts
   ```

4. **Implement rate limiting**:
   ```typescript
   // Add user-based rate limiting
   // Queue requests instead of failing
   ```

## 🆘 Emergency Procedures

### Critical Production Issues

1. **Immediate Response**:
   ```bash
   # Check service status
   curl -f https://your-domain.com/api/health
   
   # Review recent deployments
   vercel ls
   
   # Check error rates
   tail -f /var/log/application.log
   ```

2. **Rollback Procedure**:
   ```bash
   # Rollback to previous deployment
   vercel rollback
   
   # Or redeploy known-good version
   git checkout last-known-good-commit
   vercel --prod
   ```

3. **Communication**:
   ```bash
   # Update status page
   # Notify users via appropriate channels
   # Document incident for post-mortem
   ```

### Data Recovery

1. **Database Issues**:
   ```bash
   # Restore from latest backup
   psql $DATABASE_URL < latest-backup.sql
   
   # Verify data integrity
   npm run db:validate
   ```

2. **File Recovery**:
   ```bash
   # Restore from backup storage
   aws s3 sync s3://backup-bucket/latest ./restore/
   ```

## 📞 Getting Additional Help

### Self-Service Options

1. **Documentation Review**:
   - [Getting Started Guide](../getting-started/README.md)
   - [API Reference](../api-reference/README.md)
   - [FAQ](./faq.md)

2. **Community Support**:
   - GitHub Discussions
   - Discord Community
   - Stack Overflow (tag: nex7)

3. **Diagnostic Tools**:
   ```bash
   # Health check script
   node scripts/health-check.js
   
   # System diagnostic
   node scripts/system-diagnostic.js
   ```

### When to Contact Support

**Contact support for**:
- Security vulnerabilities
- Data loss or corruption
- Critical production outages
- Billing or account issues

**Before contacting support, prepare**:
- Detailed error messages
- Steps to reproduce the issue
- Environment information
- Recent changes or deployments

---

**Still having issues?** Create a detailed issue report in our [GitHub Issues](https://github.com/betofilippi/nex7.com/issues) with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, browser)
- Relevant error messages or logs