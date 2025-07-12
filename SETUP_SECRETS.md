# 🔐 Guia Visual: Configurar Secrets no GitHub

## 📍 **Onde Adicionar os Secrets**

### Passo 1: Acesse o Repositório
```
🌐 https://github.com/betofilippi/nex7.com
```

### Passo 2: Navegue até Settings
```
Repositório nex7.com → [Settings] (aba superior direita)
```

### Passo 3: Encontre Secrets
```
Menu lateral esquerdo:
📁 Security
  └── 🔐 Secrets and variables
      └── ⚡ Actions  ← CLIQUE AQUI
```

### Passo 4: Adicionar Secrets
```
Botão verde: [New repository secret]
```

---

## 🎯 **3 Secrets Necessários**

### 🔑 Secret 1: VERCEL_TOKEN
- **Name:** `VERCEL_TOKEN`
- **Value:** Obtido em https://vercel.com/account/tokens

**Como obter:**
1. Ir para: https://vercel.com/account/tokens
2. Clicar **"Create Token"**
3. Nome: "NEX7 GitHub Actions"
4. Scope: **"Full Access"**
5. Copiar o token gerado

---

### 🆔 Secret 2: VERCEL_PROJECT_ID
- **Name:** `VERCEL_PROJECT_ID`
- **Value:** ID do projeto NEX7 no Vercel

**Como obter:**
1. Dashboard Vercel → Projeto NEX7
2. Settings → General
3. Procurar "Project ID"
4. Copiar valor (começa com `prj_`)

---

### 👥 Secret 3: VERCEL_TEAM_ID (Opcional)
- **Name:** `VERCEL_TEAM_ID`
- **Value:** ID do team (só se usar equipe)

**Como obter:**
1. Vercel → Dropdown do team
2. Team Settings → General
3. Procurar "Team ID"
4. Copiar valor (começa com `team_`)

---

## ✅ **Verificação**

Após adicionar, você deve ver na lista:
- ✅ `VERCEL_TOKEN`
- ✅ `VERCEL_PROJECT_ID`
- ✅ `VERCEL_TEAM_ID` (se adicionou)

---

## 🚀 **Ativação**

Para ativar o sistema de auto-deploy:
```bash
# Qualquer commit irá disparar o monitoramento
git add .
git commit -m "Activate auto-deploy system"
git push
```

Acompanhe em: **GitHub → Actions** (aba superior)

---

## 🎯 **Links Diretos**

- **Repositório:** https://github.com/betofilippi/nex7.com
- **Settings:** https://github.com/betofilippi/nex7.com/settings
- **Secrets:** https://github.com/betofilippi/nex7.com/settings/secrets/actions
- **Vercel Tokens:** https://vercel.com/account/tokens
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## 🆘 **Suporte**

Se tiver dúvidas:
1. Verifique se está logado como dono do repositório
2. Certifique-se de que o repositório está conectado ao Vercel
3. Teste com um commit simples após adicionar os secrets

**Sistema pronto para funcionar automaticamente!** 🎉