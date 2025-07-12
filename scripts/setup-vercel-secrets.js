#!/usr/bin/env node

/**
 * 🔐 Setup Script for Vercel Secrets
 * Helps configure the required secrets for GitHub Actions integration
 */

const fs = require('fs');

console.log(`
🚀 NEX7 - Vercel Integration Setup Guide
==========================================

To enable automatic deployment monitoring and error fixing, you need to configure the following secrets in your GitHub repository:

📋 Required GitHub Secrets:
---------------------------

1. VERCEL_TOKEN
   - Go to: https://vercel.com/account/tokens
   - Create a new token with scope: "Full Access"
   - Copy the token

2. VERCEL_PROJECT_ID
   - Go to your project settings in Vercel
   - Copy the Project ID from the General tab

3. VERCEL_TEAM_ID (Optional - only if using a team)
   - Go to your team settings in Vercel
   - Copy the Team ID

🔧 How to add secrets to GitHub:
-------------------------------

1. Go to your repository: https://github.com/betofilippi/nex7.com
2. Click "Settings" tab
3. Click "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add each secret with the exact names above

⚡ Auto-Deploy Monitor Features:
------------------------------

✅ Monitors every deployment in real-time
✅ Detects common errors automatically
✅ Applies fixes for TypeScript, ESLint, and import issues
✅ Creates GitHub issues for complex problems
✅ Auto-commits successful fixes
✅ Closes issues when deployments succeed

🔄 How it works:
---------------

1. You push code to main/develop branch
2. GitHub Actions waits 30s for Vercel deployment to start
3. Monitors deployment status every 30s (max 20 minutes)
4. If deployment fails:
   - Analyzes error logs
   - Applies automatic fixes
   - Commits fixes and triggers new deployment
   - Creates GitHub issue if unable to fix
5. If deployment succeeds:
   - Closes any related failure issues
   - Reports success

🛠️ Supported Auto-Fixes:
------------------------

• TypeScript errors → @ts-ignore comments
• ESLint errors → eslint --fix
• Import path issues → Convert to relative paths
• Missing dependencies → npm install
• Unescaped entities → Proper HTML entities
• Next.js warnings → Convert to proper components

🎯 Next Steps:
-------------

1. Add the three secrets to your GitHub repository
2. Push any change to trigger the workflow
3. Watch the magic happen in the Actions tab!

📝 Files created:
----------------

• .github/workflows/auto-deploy-monitor.yml - Main workflow
• scripts/auto-fix-errors.sh - Auto-fix script
• scripts/monitor-vercel-deployment.js - Deployment monitor
• scripts/setup-vercel-secrets.js - This setup guide

Happy deploying! 🚀
`);

// Check if we're in a git repository
if (fs.existsSync('.git')) {
    console.log(`
🔍 Repository detected: ${process.cwd()}

Run this to test the workflow:
git add . && git commit -m "🤖 Add auto-deploy monitoring" && git push
    `);
} else {
    console.log(`
⚠️  No git repository detected. Make sure you're in the correct directory.
    `);
}

// Create a sample environment file if it doesn't exist
if (!fs.existsSync('.env.github.example')) {
    fs.writeFileSync('.env.github.example', `# GitHub Actions Environment Variables
# Copy these to your GitHub repository secrets

VERCEL_TOKEN=your_vercel_token_here
VERCEL_PROJECT_ID=your_project_id_here
VERCEL_TEAM_ID=your_team_id_here_optional

# How to get these values:
# 1. VERCEL_TOKEN: https://vercel.com/account/tokens
# 2. VERCEL_PROJECT_ID: Project Settings → General → Project ID
# 3. VERCEL_TEAM_ID: Team Settings → General → Team ID (only for teams)
`);
    
    console.log(`
📄 Created .env.github.example with secret template
    `);
}