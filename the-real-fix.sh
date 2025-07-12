#!/bin/bash

echo "🔧 CORREÇÃO REAL DO PROBLEMA DO TAILWIND"
echo "========================================"

# 1. Remove node_modules e package-lock.json para instalação limpa
echo "🧹 Limpeza completa..."
rm -rf node_modules
rm -f package-lock.json

# 2. Força instalação com tailwindcss versão 3.x (mais estável)
echo "📦 Instalando Tailwind CSS versão 3.x..."
npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0

# 3. Instala todas as outras dependências
echo "📦 Instalando demais dependências..."
npm install

# 4. Verifica se tailwindcss foi instalado
echo "✅ Verificando instalação..."
if [ -d "node_modules/tailwindcss" ]; then
    echo "✅ Tailwind CSS instalado com sucesso!"
else
    echo "❌ Falha na instalação do Tailwind CSS"
    exit 1
fi

# 5. Executa o build
echo "🚀 Executando build..."
npm run build

echo ""
echo "========================================"
if [ $? -eq 0 ]; then
    echo "✅ SUCESSO TOTAL!"
    echo "✅ Build concluído sem erros!"
    echo ""
    echo "🎉 Projeto pronto para uso!"
    echo ""
    echo "Use:"
    echo "  npm run dev  - Desenvolvimento"
    echo "  npm start    - Produção"
else
    echo "❌ Ainda há erros no build"
fi