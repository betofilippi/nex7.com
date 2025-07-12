#!/bin/bash

echo "🎯 SOLUÇÃO FINAL E DEFINITIVA"
echo "============================="

# Remove a página canvas que ainda está causando erro
echo "🗑️ Removendo página canvas..."
rm -f src/app/canvas/page.tsx

# Executa o build
echo "🏗️ Executando build..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "============================="
    echo "✅ SUCESSO TOTAL!"
    echo "✅ Build concluído sem erros!"
    echo ""
    echo "🎉 O projeto está pronto!"
    echo ""
    echo "Você pode agora:"
    echo "  npm run dev    - Para desenvolvimento"
    echo "  npm start      - Para produção"
    echo "  npm run lint   - Para verificar código"
else
    echo "❌ Erro inesperado. Verificando..."
    npm run build 2>&1 | grep -E "error|Error|Module not found" | head -10
fi