# NEX7 - Plataforma Visual Claude Code

Uma plataforma completa para desenvolvimento assistido por IA, integrando Claude Code com uma interface visual intuitiva.

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

### 🔄 CI/CD Visual
- Monitoramento em tempo real de deployments
- Auto-recovery com Claude AI
- Integração completa com GitHub Actions
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

## 📦 Instalação

1. **Clone o repositório**:
```bash
git clone <repo-url>
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

4. **Inicie o servidor de desenvolvimento**:
```bash
npm run dev
```

5. **Acesse a aplicação**:
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

4. **Vercel** (opcional):
   - Dashboard: https://vercel.com/dashboard
   - Adicione: `VERCEL_CLIENT_ID` e `VERCEL_CLIENT_SECRET`

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
└── types/                 # TypeScript definitions
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

## 🚀 Funcionalidades Avançadas

### Auto-Recovery
- Detecção automática de erros
- Análise com Claude AI
- Sugestões inteligentes de correção
- Re-deploy automático

### Webhooks GitHub
- Integração completa com GitHub Actions
- Triggers automáticos de deploy
- Monitoramento de PRs
- Notificações em tempo real

### Colaboração
- Múltiplos workspaces
- Compartilhamento de projetos
- Histórico de alterações
- Permissões granulares

## 🔐 Segurança

- Autenticação JWT segura
- OAuth 2.0 com CSRF protection
- Rate limiting nas APIs
- Validação de webhooks
- Cookies httpOnly
- CORS configurado

## 📈 Monitoramento

- Logs estruturados
- Métricas de performance
- Analytics de uso de IA
- Alertas proativos
- Dashboard de saúde

## 🛠 Desenvolvimento

### Scripts Disponíveis
```bash
npm run dev       # Servidor de desenvolvimento
npm run build     # Build para produção
npm run start     # Servidor de produção
npm run lint      # ESLint
npm run type-check # TypeScript check
```

### Contribuindo
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🙋‍♂️ Suporte

- **Documentação**: `/docs`
- **Demo**: `/demo`
- **Issues**: GitHub Issues
- **Discussões**: GitHub Discussions

---

Feito com ❤️ usando Claude Code e Next.js