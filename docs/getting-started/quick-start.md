# Quick Start Tutorial - 5 Minutes to NEX7

Get NEX7 running in just 5 minutes with this streamlined setup guide.

## ⚡ Prerequisites (1 minute)

You'll need:
- Node.js 18+ installed
- A Claude API key from [Anthropic Console](https://console.anthropic.com/)

## 🚀 Installation (2 minutes)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/betofilippi/nex7.com.git
cd nex7.com

# Install dependencies
npm install
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.local.example .env.local

# Add your Claude API key
echo "ANTHROPIC_API_KEY=your_claude_api_key_here" >> .env.local
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env.local
```

## 🎯 Launch (1 minute)

### Step 3: Start the Application

```bash
# Setup database and start development server
npm run db:setup && npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) - NEX7 is now running! 🎉

## 🎨 First Workflow (1 minute)

### Step 4: Create Your First Visual Workflow

1. **Complete Onboarding**: Follow the guided setup with Nexy
2. **Visit Canvas**: Navigate to [http://localhost:3000/canvas](http://localhost:3000/canvas)
3. **Drag & Drop**: 
   - Drag a "Claude" node from the left palette
   - Drag a "GitHub" node
   - Connect them together
4. **Configure**: Click nodes to set properties
5. **Test**: Run your first automated workflow!

## 🤖 Chat with AI Agents

### Step 5: Meet Your AI Team

Visit [http://localhost:3000/agents](http://localhost:3000/agents) and try:

```
Ask Nexy: "Help me create a simple website"
Ask Dev: "Show me how to add a new API endpoint"
Ask Designer: "What colors work well for a modern dashboard?"
```

## 🚀 What's Next?

You're now ready to:

- **Build Visual Workflows**: Use the canvas to automate development tasks
- **Deploy Projects**: Set up auto-deploy with error recovery
- **Customize Agents**: Modify AI personalities for your needs
- **Integrate Services**: Connect GitHub, Vercel, and more

## 📚 Continue Learning

- [Canvas Workflow Tutorial](../user-guide/canvas-workflow.md) - Master visual programming
- [Agent System Guide](../user-guide/agent-system.md) - Collaborate with AI assistants
- [Deployment Guide](../deployment/README.md) - Deploy to production
- [API Reference](../api-reference/README.md) - Explore the complete API

---

**Congratulations! You're now ready to build with NEX7!** 🎊

*Need help? Check the [Troubleshooting Guide](../user-guide/troubleshooting.md) or [FAQ](../user-guide/faq.md)*