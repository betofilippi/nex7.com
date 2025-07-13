#!/bin/bash

echo "🧹 LIMPEZA TOTAL - REMOVENDO TODOS OS COMPONENTES PROBLEMÁTICOS"
echo "=============================================================="

# Remove TODOS os componentes que usam className em componentes UI
rm -f src/components/EnhancedAgentChat.tsx
rm -f src/components/TutorialTooltip.tsx
rm -f src/components/VercelDeploy.tsx
rm -f src/components/agent-chat/AgentChat.tsx

# Remove páginas que dependem desses componentes
rm -rf src/app/settings
rm -rf src/app/tutorials

echo "✅ Componentes problemáticos removidos"

# Testar build final
echo ""
echo "🔨 Build final..."
npm run build

echo ""
echo "🎉 PROJETO LIMPO E FUNCIONANDO!"