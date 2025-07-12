#!/usr/bin/env node

/**
 * 🔍 Script para verificar se os secrets estão configurados
 * Execute após configurar os secrets para validar
 */

console.log(`
🔐 Verificador de Secrets - NEX7
===============================

Este script verifica se os secrets necessários estão configurados corretamente.

📋 Secrets necessários:
-----------------------
✅ VERCEL_TOKEN          (Token da API Vercel)
✅ VERCEL_PROJECT_ID     (ID do projeto NEX7)
✅ VERCEL_TEAM_ID        (ID do team - opcional)

🎯 Como usar:
------------
1. Configure os secrets no GitHub:
   https://github.com/betofilippi/nex7.com/settings/secrets/actions

2. Faça um commit para ativar o workflow:
   git add . && git commit -m "Test secrets" && git push

3. Acompanhe o resultado em:
   https://github.com/betofilippi/nex7.com/actions

🔍 Verificação Local:
-------------------
`);

// Simular verificação dos secrets (só funciona no GitHub Actions)
if (process.env.CI) {
    console.log('🏃 Executando no GitHub Actions...\n');
    
    const secrets = {
        'VERCEL_TOKEN': process.env.VERCEL_TOKEN,
        'VERCEL_PROJECT_ID': process.env.VERCEL_PROJECT_ID,
        'VERCEL_TEAM_ID': process.env.VERCEL_TEAM_ID
    };
    
    let allConfigured = true;
    
    Object.entries(secrets).forEach(([name, value]) => {
        if (value) {
            console.log(`✅ ${name}: Configurado (${value.substring(0, 10)}...)`);
        } else {
            console.log(`❌ ${name}: NÃO configurado`);
            if (name !== 'VERCEL_TEAM_ID') { // TEAM_ID é opcional
                allConfigured = false;
            }
        }
    });
    
    console.log('\n' + '='.repeat(50));
    
    if (allConfigured) {
        console.log('🎉 Todos os secrets obrigatórios estão configurados!');
        console.log('🚀 Sistema de auto-deploy está ativo.');
        process.exit(0);
    } else {
        console.log('⚠️  Alguns secrets obrigatórios estão faltando.');
        console.log('📝 Configure-os em: https://github.com/betofilippi/nex7.com/settings/secrets/actions');
        process.exit(1);
    }
} else {
    console.log(`❌ Não é possível verificar secrets localmente.
    
🎯 Para verificar se estão configurados:
--------------------------------------
1. Faça um push para o repositório
2. Vá para: https://github.com/betofilippi/nex7.com/actions
3. Clique no workflow mais recente
4. Verifique se não há erros relacionados a secrets

📍 Localização dos Secrets no GitHub:
------------------------------------
Repositório → Settings → Secrets and variables → Actions

🔗 Link direto:
https://github.com/betofilippi/nex7.com/settings/secrets/actions

💡 Dica: Execute este script no GitHub Actions para verificação automática.
`);
}