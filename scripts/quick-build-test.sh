#!/bin/bash

# 🚀 Quick Build Test
# Tests only critical build issues that would fail on Vercel

set -e

echo "🚀 NEX7 - Quick Build Test"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test build without type checking (like Vercel does with skipLibCheck)
echo "Running Next.js build test..."
echo "(This simulates Vercel's build process)"
echo ""

# Set production environment
export NODE_ENV=production

# Run build
if npm run build; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo "Your code should deploy successfully to Vercel"
else
    echo -e "${RED}❌ Build failed!${NC}"
    echo "Fix the errors above before pushing"
    exit 1
fi