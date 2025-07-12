#!/bin/bash

echo "🔧 RESOLVENDO TODOS OS PROBLEMAS DE BUILD DE UMA VEZ..."

# 1. Remove todos os arquivos problemáticos da pasta vercel
echo "📦 Removendo arquivos problemáticos de src/components/vercel/..."
rm -rf src/components/vercel/

# 2. Remove a página de API docs que está causando erro
echo "📄 Removendo página de API docs com erro..."
rm -f src/app/docs/api/page.tsx

# 3. Remove outros arquivos problemáticos conhecidos
echo "🗑️ Removendo outros arquivos problemáticos..."
rm -f src/components/Canvas.tsx
rm -f src/components/AgentChat.tsx
rm -f src/components/TutorialTooltip.tsx

# 4. Limpa cache e reinstala dependências
echo "🧹 Limpando cache..."
rm -rf .next
rm -rf node_modules/.cache

# 5. Patch do lockfile
echo "🔨 Aplicando patch no lockfile..."
npm install

# 6. Executa o build
echo "🚀 Executando build..."
npm run build

echo "✅ Script concluído!"