# NEX7 - Plataforma Visual Claude Code

Uma plataforma completa para desenvolvimento assistido por IA, integrando Claude Code com uma interface visual intuitiva e sistema automático de monitoramento de deploy.

## 🚀 Características Principais

### 🤖 Sistema de Agentes Inteligentes
- **Nexy** - Guia principal amigável
- **Dev** - Assistente técnico de código
- **Designer** - Assistente visual criativo
- **Teacher** - Professor virtual paciente
- **Debugger** - Solucionador de problemas

### 🎨 Canvas Visual Drag-and-Drop
- Criação visual de workflows de desenvolvimento
- Nodes especializados (GitHub, Claude, Vercel)
- Conexões animadas com fluxo de partículas
- Editor inline e context menus

### 🔄 CI/CD Visual com Auto-Recovery
- **Monitoramento automático** de deployments Vercel
- **Auto-correção** de erros TypeScript, ESLint e dependências
- **Issues automáticas** no GitHub para problemas complexos
- **Commits automáticos** das correções aplicadas
- Pipeline 3D visual com animações

### 🎓 Onboarding para Iniciantes
- Wizard guiado com mascote Nexy
- Seleção de nível de experiência
- Templates de projeto prontos
- Linguagem natural para descrição de projetos

### ⚡ Integrações
- **Vercel** - Deploy automático e monitoramento
- **GitHub** - Webhooks e automação CI/CD
- **Claude Code** - SDK completo integrado
- **OAuth** - Google e GitHub login

## 🛠 Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui, Framer Motion
- **Canvas**: React Flow, Three.js
- **AI**: Anthropic Claude, Claude Code SDK
- **Auth**: JWT, OAuth 2.0
- **Deploy**: Vercel API
- **Charts**: Chart.js, React Chart.js 2
- **CI/CD**: GitHub Actions

## 🤖 Sistema de Auto-Deploy

### Funcionalidades do Monitoramento Automático:
- ✅ **Monitoramento em tempo real** após cada push
- ✅ **Detecção automática** de falhas via API Vercel
- ✅ **Correções automáticas** para erros comuns
- ✅ **Issues no GitHub** quando não consegue corrigir
- ✅ **Commits automáticos** das correções aplicadas

### Correções Automáticas Suportadas:
- **TypeScript errors** → Adiciona @ts-ignore
- **ESLint errors** → Executa eslint --fix
- **Import path issues** → Converte para paths relativos
- **Missing dependencies** → Executa npm install
- **Unescaped entities** → Corrige HTML entities
- **Next.js warnings** → Converte para componentes adequados

### Configuração dos Secrets:
```bash
# GitHub Repository Secrets necessários:
VERCEL_TOKEN=your_vercel_token_here
VERCEL_PROJECT_ID=your_project_id_here
VERCEL_TEAM_ID=your_team_id_here_optional
```

## 📦 Instalação

1. **Clone o repositório**:
```bash
git clone https://github.com/betofilippi/nex7.com.git
cd nex7.com
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Configure as variáveis de ambiente**:
```bash
cp .env.local.example .env.local
# Edite .env.local com suas chaves
```

4. **Configure os secrets do GitHub** (para auto-deploy):
```bash
node scripts/setup-vercel-secrets.js
```

5. **Inicie o servidor de desenvolvimento**:
```bash
npm run dev
```

6. **Acesse a aplicação**:
```
http://localhost:3000
```

## 🔧 Configuração

### API Keys Necessárias

1. **Anthropic Claude**:
   - Obtenha em: https://console.anthropic.com/
   - Adicione em: `ANTHROPIC_API_KEY`

2. **Google OAuth** (opcional):
   - Console: https://console.cloud.google.com/
   - Adicione: `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`

3. **GitHub OAuth** (opcional):
   - Settings: https://github.com/settings/developers
   - Adicione: `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET`

4. **Vercel** (para auto-deploy):
   - Dashboard: https://vercel.com/dashboard
   - Tokens: https://vercel.com/account/tokens
   - Adicione: `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`

### Configuração de JWT
Gere chaves seguras para JWT:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── agents/            # Sistema de agentes IA
│   ├── canvas/            # Canvas visual drag-and-drop
│   ├── deploy/            # Monitoramento de deploy
│   ├── onboarding/        # Wizard de onboarding
│   ├── ui/                # Componentes UI (shadcn)
│   └── vercel/            # Componentes Vercel
├── contexts/              # React contexts
├── hooks/                 # Custom hooks
├── lib/
│   ├── agents/            # Sistema de agentes
│   ├── auth/              # Autenticação
│   ├── claude/            # Claude Code SDK
│   └── vercel/            # Vercel API
├── types/                 # TypeScript definitions
├── .github/workflows/     # GitHub Actions
└── scripts/               # Scripts de automação
```

## 🎯 Como Usar

### 1. Primeiro Acesso
- Faça login ou registre-se
- Complete o onboarding guiado
- Escolha seu nível de experiência
- Selecione um template de projeto

### 2. Canvas Visual
- Acesse `/canvas` para o editor visual
- Arraste nodes da paleta à esquerda
- Conecte nodes para criar workflows
- Configure cada node com propriedades específicas

### 3. Agentes IA
- Acesse `/agents` para testar agentes
- Cada agente tem personalidade única
- Use chat contextual para ajuda
- Agentes colaboram entre si

### 4. Deploy Visual
- Acesse `/deploy` para monitoramento
- Veja pipeline em tempo real
- Auto-recovery em caso de erros
- Histórico completo de deployments

## 🤖 Auto-Deploy em Ação

### Workflow Automático:
1. **Push para main/develop** → Trigger GitHub Actions
2. **Aguarda 30s** → Espera deployment Vercel iniciar
3. **Monitora a cada 30s** → Verifica status (máx 20min)
4. **Se falhar**:
   - Analisa logs de erro
   - Aplica correções automáticas
   - Faz commit das correções
   - Triggera novo deployment
   - Cria issue se não conseguir corrigir
5. **Se suceder**:
   - Fecha issues relacionadas
   - Reporta sucesso

### Arquivos do Sistema:
- `.github/workflows/auto-deploy-monitor.yml` - Workflow principal
- `.github/workflows/deploy-status.yml` - Status do deployment
- `scripts/auto-fix-errors.sh` - Script de correção automática
- `scripts/monitor-vercel-deployment.js` - Monitor de deployment
- `scripts/setup-vercel-secrets.js` - Guia de configuração

## 🔐 Segurança

- Autenticação JWT segura
- OAuth 2.0 com CSRF protection
- Rate limiting nas APIs
- Validação de webhooks
- Cookies httpOnly
- CORS configurado
- Secrets criptografados no GitHub

## 📈 Monitoramento

- Logs estruturados
- Métricas de performance
- Analytics de uso de IA
- Alertas proativos
- Dashboard de saúde
- Issues automáticas para falhas

## 🛠 Desenvolvimento

### Scripts Disponíveis
```bash
npm run dev         # Servidor de desenvolvimento
npm run build       # Build para produção
npm run start       # Servidor de produção
npm run lint        # ESLint
npm run lint:fix    # ESLint com correção automática
npm run type-check  # Verificação TypeScript
```

### Testando o Auto-Deploy
```bash
# Faça qualquer mudança e push
git add .
git commit -m "Test auto-deploy system"
git push

# Acompanhe no GitHub Actions
# Verá o monitoramento automático em ação
```

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente
3. Configure os secrets do GitHub para auto-monitoramento
4. Deploy automático a cada push

### Manual
```bash
npm run build
npm run start
```

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🙋‍♂️ Suporte

- **Documentação**: `/docs`
- **Demo**: `/demo`
- **Issues**: GitHub Issues (automáticas!)
- **Discussões**: GitHub Discussions

## 🎉 Recursos Únicos

### O que torna o NEX7 especial:
- **🤖 Auto-Recovery**: Primeiro sistema que corrige erros de deploy automaticamente
- **👥 Multi-Agentes**: 5 agentes especializados trabalhando juntos
- **🎨 Canvas Visual**: Interface drag-and-drop para workflows de desenvolvimento
- **🎓 Para Iniciantes**: Onboarding que torna programação acessível
- **🔄 CI/CD Inteligente**: Monitoramento com correção automática
- **⚡ Zero Config**: Deploy e monitoramento funcionam out-of-the-box

---

Feito com ❤️ usando Claude Code, Next.js e muita automação inteligente! 🚀