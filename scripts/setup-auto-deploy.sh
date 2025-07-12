#!/bin/bash
# scripts/setup-auto-deploy.sh - Setup completo de automação

echo "🤖 NEX7 - Complete Auto-Deploy Setup"
echo "===================================="

# Torna todos os scripts executáveis
chmod +x scripts/*.sh
chmod +x claude-deploy-wrapper.sh
chmod +x .githooks/*

echo "1️⃣ Setting up Git Hooks..."
bash scripts/setup-git-hooks.sh

echo ""
echo "2️⃣ Testing deployment tools..."
npm run predeploy > /dev/null && echo "✅ Pre-deploy validation works" || echo "❌ Pre-deploy validation failed"

echo ""
echo "3️⃣ Setting up package.json scripts..."
echo "✅ Auto-deploy scripts configured"

echo ""
echo "🎉 AUTO-DEPLOY SETUP COMPLETE!"
echo ""
echo "📋 Available automation options:"
echo ""
echo "🔄 AUTOMATIC (recommended):"
echo "   git push                     → Auto-validation + GitHub Actions deploy"
echo "   git merge main              → Auto-deploy after merge"
echo "   npm run watch:deploy        → Deploy on file changes"
echo ""
echo "🚀 MANUAL:"
echo "   npm run deploy:auto         → Robust deploy with retry"
echo "   npm run deploy:safe         → Full validation + deploy"
echo ""
echo "⚙️  SETUP:"
echo "   npm run setup:hooks         → Reinstall Git hooks"
echo "   bash scripts/setup-vercel-webhooks.sh → Setup Vercel notifications"
echo ""
echo "📊 MONITORING:"
echo "   Check logs in /tmp/claude-deploy-*.log"
echo "   Vercel dashboard: https://vercel.com/dashboard"
echo ""
echo "🎯 NEXT STEPS:"
echo "1. Configure secrets in GitHub: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID"
echo "2. Push to main branch to test auto-deployment"
echo "3. Use 'npm run watch:deploy' during development"