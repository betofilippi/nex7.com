#!/bin/bash
# scripts/setup-git-hooks.sh - Setup automático dos Git Hooks

echo "🔧 Setting up Git Hooks for automatic deployment..."

# Cria diretório .git/hooks se não existir
mkdir -p .git/hooks

# Copia hooks customizados
if [ -f ".githooks/pre-push" ]; then
    cp .githooks/pre-push .git/hooks/pre-push
    chmod +x .git/hooks/pre-push
    echo "✅ Pre-push hook installed"
fi

if [ -f ".githooks/post-merge" ]; then
    cp .githooks/post-merge .git/hooks/post-merge
    chmod +x .git/hooks/post-merge
    echo "✅ Post-merge hook installed"
fi

# Torna os hooks executáveis
chmod +x .githooks/*

echo "🎉 Git Hooks setup complete!"
echo ""
echo "📋 Configured hooks:"
echo "   - pre-push: Validates code before push"
echo "   - post-merge: Auto-deploys after merge to main"
echo ""
echo "🚀 Next steps:"
echo "   - Push to main branch: Automatic validation + deployment"
echo "   - Merge PR to main: Automatic deployment"
echo "   - Manual deploy: npm run deploy:auto"