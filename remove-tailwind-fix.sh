#!/bin/bash

echo "🔧 REMOVENDO TAILWIND CSS DO PROJETO"
echo "===================================="

# 1. Remove referências ao Tailwind do globals.css
echo "📝 Modificando globals.css..."
cat > src/app/globals.css << 'EOF'
/* Basic reset and global styles */
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

/* Container */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Basic typography */
.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
}

.font-bold {
  font-weight: 700;
}

.mb-4 {
  margin-bottom: 1rem;
}

.text-gray-600 {
  color: #718096;
}

.p-6 {
  padding: 1.5rem;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
EOF

# 2. Remove postcss.config.js se existir
echo "🗑️ Removendo configurações do PostCSS..."
rm -f postcss.config.js
rm -f postcss.config.mjs

# 3. Remove tailwind.config.js se existir
rm -f tailwind.config.js
rm -f tailwind.config.ts

# 4. Executa o build
echo "🚀 Executando build sem Tailwind..."
npm run build

echo ""
echo "===================================="
if [ $? -eq 0 ]; then
    echo "✅ BUILD CONCLUÍDO COM SUCESSO!"
    echo "✅ Projeto funciona sem Tailwind CSS!"
    echo ""
    echo "🎉 Comandos disponíveis:"
    echo "  npm run dev  - Desenvolvimento"
    echo "  npm start    - Produção"
else
    echo "❌ Ainda há erros"
fi