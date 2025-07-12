#!/bin/bash
# scripts/setup-vercel-webhooks.sh - Configura webhooks do Vercel

echo "🔗 Setting up Vercel Webhooks for automatic notifications..."

# URL do seu endpoint de webhook (substitua pela sua URL)
WEBHOOK_URL="https://nex7-6hovt0atg-nxt-9032fd74.vercel.app/api/webhooks/vercel"

# Configura webhook para deployment.succeeded
vercel webhook add "$WEBHOOK_URL" \
  --events="deployment.succeeded,deployment.error,deployment.canceled" \
  --scope="nxt-9032fd74" \
  --confirm

echo "✅ Vercel webhooks configured!"
echo "📋 Events monitored:"
echo "   - deployment.succeeded: Notifica deploy bem-sucedido"
echo "   - deployment.error: Notifica erros de deploy"
echo "   - deployment.canceled: Notifica deploys cancelados"