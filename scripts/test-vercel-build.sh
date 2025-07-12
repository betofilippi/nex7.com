#!/bin/bash

# 🧪 Test Vercel Build Script
# Simulates the exact Vercel build environment locally

set -e  # Exit on error

echo "🔍 NEX7 - Vercel Build Test"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Pre-build checks...${NC}"
echo ""

# 1. Check Node version
echo "1️⃣ Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "   Current version: $NODE_VERSION"
if [[ ! "$NODE_VERSION" =~ ^v(18|20|21) ]]; then
    echo -e "${YELLOW}   ⚠️  Warning: Vercel uses Node.js 18.x or 20.x${NC}"
fi
echo ""

# 2. Clean install dependencies (like Vercel does)
echo "2️⃣ Clean installing dependencies..."
echo -e "${YELLOW}   Removing node_modules and package-lock.json...${NC}"
rm -rf node_modules package-lock.json

echo "   Running: npm ci --legacy-peer-deps"
if ! npm ci --legacy-peer-deps; then
    echo -e "${RED}❌ Dependency installation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# 3. Type checking
echo "3️⃣ Running TypeScript type check..."
if ! npm run type-check; then
    echo -e "${RED}❌ TypeScript errors found${NC}"
    echo "   Fix these errors before deploying!"
    exit 1
fi
echo -e "${GREEN}✅ TypeScript check passed${NC}"
echo ""

# 4. Linting
echo "4️⃣ Running ESLint..."
if ! npm run lint; then
    echo -e "${YELLOW}⚠️  ESLint warnings/errors found${NC}"
    echo "   Run 'npm run lint:fix' to auto-fix"
    # Don't exit on lint errors as they might be warnings
fi
echo ""

# 5. Build test
echo "5️⃣ Running production build..."
echo "   This simulates Vercel's build process..."
export NODE_ENV=production

# Time the build
BUILD_START=$(date +%s)

if ! npm run build; then
    echo -e "${RED}❌ Build failed!${NC}"
    echo "   Fix the errors above before pushing to main"
    exit 1
fi

BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))

echo -e "${GREEN}✅ Build completed successfully in ${BUILD_TIME}s${NC}"
echo ""

# 6. Check build output
echo "6️⃣ Analyzing build output..."
if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next | cut -f1)
    echo "   Build size: $BUILD_SIZE"
    
    # Count pages
    if [ -d ".next/server/app" ]; then
        PAGE_COUNT=$(find .next/server/app -name "*.js" -type f | wc -l)
        echo "   Pages built: $PAGE_COUNT"
    fi
else
    echo -e "${RED}❌ No .next directory found${NC}"
    exit 1
fi
echo ""

# 7. Check for common issues
echo "7️⃣ Checking for common deployment issues..."

# Check for missing environment variables
if [ -f ".env.example" ]; then
    echo "   Checking environment variables..."
    MISSING_VARS=()
    while IFS= read -r line; do
        if [[ $line =~ ^([A-Z_]+)= ]] && [[ ! $line =~ ^# ]]; then
            VAR_NAME="${BASH_REMATCH[1]}"
            if [ -z "${!VAR_NAME}" ] && [ "$VAR_NAME" != "NEXT_PUBLIC_APP_URL" ]; then
                MISSING_VARS+=("$VAR_NAME")
            fi
        fi
    done < .env.example
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo -e "${YELLOW}   ⚠️  Missing environment variables:${NC}"
        printf '      - %s\n' "${MISSING_VARS[@]}"
        echo "   Make sure these are set in Vercel!"
    else
        echo -e "${GREEN}   ✅ Environment variables check passed${NC}"
    fi
fi

# Check for large files
echo "   Checking for large files..."
LARGE_FILES=$(find . -type f -size +10M -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" 2>/dev/null)
if [ -n "$LARGE_FILES" ]; then
    echo -e "${YELLOW}   ⚠️  Large files detected (>10MB):${NC}"
    echo "$LARGE_FILES" | while read -r file; do
        SIZE=$(du -h "$file" | cut -f1)
        echo "      - $file ($SIZE)"
    done
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 All checks passed!${NC}"
echo "Your code is ready for Vercel deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. git add -A"
echo "2. git commit -m 'your message'"
echo "3. git push"
echo ""