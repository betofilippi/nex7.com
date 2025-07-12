#!/bin/bash

# NEX7 Pre-Deploy Check Script
# Runs comprehensive code analysis before deployment

set -e

echo "🚀 NEX7 Pre-Deploy Check Starting..."
echo "============================================"

# 1. Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# 2. Run TypeScript check
echo "🔍 Running TypeScript check..."
npx tsc --noEmit --project tsconfig.json || {
    echo "❌ TypeScript check failed!"
    exit 1
}

# 3. Run ESLint
echo "🔍 Running ESLint..."
npx eslint src/ --ext .ts,.tsx --max-warnings 10 || {
    echo "⚠️ ESLint found issues, but continuing..."
}

# 4. Run our custom analysis
echo "🔍 Running custom code analysis..."
node scripts/analyze-code.js || {
    echo "❌ Custom analysis failed!"
    exit 1
}

# 5. Run build test
echo "🏗️ Testing build..."
npm run build || {
    echo "❌ Build failed!"
    exit 1
}

# 6. Clean up build files (optional)
if [ "$CLEAN_BUILD" = "true" ]; then
    echo "🧹 Cleaning build files..."
    rm -rf .next/
fi

echo "✅ Pre-deploy check completed successfully!"
echo "🚀 Ready for deployment to Vercel!"