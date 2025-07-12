# 🚀 NEX7 - Sistema Completo de Deploy Automatizado

## 📋 **Visão Geral**

Sistema completo de deploy automatizado para o projeto NEX7, com validação automática, retry inteligente, monitoramento e notificações.

## ⚡ **Quick Start**

```bash
# 1. Setup inicial (apenas uma vez)
npm run deploy:setup

# 2. Deploy manual
npm run deploy

# 3. Auto-deploy durante desenvolvimento
npm run deploy:watch
```

## 🔄 **Comandos Disponíveis**

### **Principais**
| Comando | Descrição |
|---------|-----------|
| `npm run deploy` | Deploy completo com validação |
| `npm run deploy:watch` | Monitora arquivos e faz deploy automático |
| `npm run deploy:setup` | Configura toda a infraestrutura |
| `npm run deploy:validate` | Apenas validação (sem deploy) |

### **Diretos**
| Comando | Descrição |
|---------|-----------|
| `./deploy.sh` | Deploy completo |
| `./deploy.sh --watch` | Modo watch |
| `./deploy.sh --setup` | Setup completo |
| `./deploy.sh --help` | Ajuda completa |

## 🔄 **Automação Configurada**

### **Git Hooks**
- **Pre-push**: Validação automática antes de push
- **Post-merge**: Deploy automático após merge na main

### **GitHub Actions**
- Deploy automático em push para main
- Deploy em merge de Pull Request
- Comentários automáticos em PRs

### **File Watcher**
- Deploy automático ao detectar mudanças
- Debounce de 30 segundos
- Notificações desktop

## 📊 **Monitoramento**

### **Logs**
- Logs detalhados em `/tmp/nex7-deploy-{timestamp}.log`
- Níveis: ERROR, SUCCESS, INFO, WARN, DEBUG, DEPLOY
- Cores diferenciadas para cada nível

### **Notificações**
- Desktop (Linux/macOS/Windows)
- Comentários automáticos em PRs
- Webhooks configuráveis

### **Status**
- URL do último deploy: `/tmp/nex7-last-deploy-url.txt`
- Exit codes padronizados
- Retry automático (3 tentativas)

## ⚙️ **Configuração**

### **Arquivo de Configuração**
Edite `deploy.config.json` para personalizar:

```json
{
  "deployment": {
    "retryAttempts": 3,
    "timeout": 300,
    "regions": ["iad1"]
  },
  "automation": {
    "watchFiles": ["src/**/*", "app/**/*"],
    "debounceDelay": 30000
  },
  "validation": {
    "typeCheck": true,
    "lint": true,
    "build": true
  }
}
```

### **Variáveis de Ambiente**
```bash
# Vercel
VERCEL_TOKEN=your_token_here
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# GitHub Actions (configurar nos secrets)
VERCEL_TOKEN
VERCEL_ORG_ID  
VERCEL_PROJECT_ID
```

## 🛡️ **Validações Automáticas**

1. **Environment Check**
   - Node.js version
   - npm disponível
   - Vercel CLI instalado
   - Arquivos essenciais

2. **Code Validation**
   - TypeScript type check
   - ESLint com auto-fix
   - Build verification

3. **Deploy Validation**
   - Retry automático
   - Timeout protection
   - URL verification

## 🔧 **Troubleshooting**

### **Problemas Comuns**

| Problema | Solução |
|----------|---------|
| Build timeout | Aumentar `timeout` no config |
| Type errors | Executar `npm run deploy:validate` |
| Vercel auth | Executar `vercel login` |
| File watcher não funciona | Instalar `inotify-tools` (Linux) ou `fswatch` (macOS) |

### **Debug**
```bash
# Modo verbose
./deploy.sh --verbose

# Apenas validação
./deploy.sh --validate-only

# Ver logs
tail -f /tmp/nex7-deploy-*.log
```

## 🎯 **Fluxos de Trabalho**

### **Desenvolvimento Local**
```bash
# Inicia auto-deploy
npm run deploy:watch

# Edita arquivos...
# → Deploy automático após 30s
```

### **Git Workflow**
```bash
git add .
git commit -m "feat: nova funcionalidade"
git push  # → Validação automática + GitHub Actions deploy
```

### **Pull Request**
```bash
# Criar PR
gh pr create

# Merge PR → Deploy automático + comentário no PR
```

## 📈 **Estatísticas**

- ⚡ **Deploy em ~2 minutos** (média)
- 🔄 **3 tentativas automáticas** em falha
- 📊 **Logs detalhados** para debug
- 🛡️ **Validação pré-deploy** sempre
- 🔔 **Notificações automáticas**

## 🤝 **Contribuindo**

1. Faça fork do repositório
2. Use `npm run deploy:watch` durante desenvolvimento
3. Push automaticamente testa e faz deploy
4. PRs são automaticamente deployados

## 📞 **Suporte**

- **Logs**: `/tmp/nex7-deploy-*.log`
- **Config**: `deploy.config.json`
- **Help**: `./deploy.sh --help`
- **Validation**: `npm run deploy:validate`

---

**Status**: ✅ **Sistema totalmente automatizado e operacional**