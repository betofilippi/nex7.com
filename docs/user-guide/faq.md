# Frequently Asked Questions (FAQ)

Common questions and answers about NEX7, its features, and usage.

## 🚀 Getting Started

### What is NEX7?

NEX7 is a visual development platform that combines Claude AI with drag-and-drop workflow building. It features:

- **Multi-Agent AI System**: 5 specialized AI assistants
- **Visual Canvas**: Drag-and-drop workflow builder
- **Auto-Deploy & Recovery**: Intelligent CI/CD with automatic error fixing
- **Beginner-Friendly**: Guided onboarding for all skill levels

### Do I need programming experience to use NEX7?

Not necessarily! NEX7 is designed to be accessible to users of all skill levels:

- **Beginners**: Use the visual canvas and AI agents to learn programming concepts
- **Intermediate**: Combine visual workflows with code for rapid development
- **Advanced**: Leverage the full power of the platform for complex automation

### How much does NEX7 cost?

NEX7 is currently in development and will offer:

- **Open Source**: Core platform available on GitHub
- **Hosted Service**: Managed hosting with additional features (coming soon)
- **Enterprise**: Custom solutions for teams and organizations

### What do I need to get started?

**Minimum Requirements**:
- Node.js 18+ and npm
- A Claude API key from Anthropic
- Modern web browser (Chrome, Firefox, Safari, Edge)

**Optional Integrations**:
- GitHub account (for version control and OAuth)
- Vercel account (for deployment)
- Google account (for OAuth)

## 🤖 AI Agents

### How do the AI agents work?

NEX7's AI agents are specialized assistants powered by Claude AI:

- **Nexy**: Friendly guide for beginners and general questions
- **Dev**: Technical expert for code review and development
- **Designer**: Creative assistant for UI/UX and design
- **Teacher**: Patient instructor for learning and tutorials
- **Debugger**: Problem solver for errors and troubleshooting

Each agent has its own personality, knowledge base, and specialized tools.

### Can agents work together?

Yes! Agents can collaborate on complex tasks:

- **Sequential Collaboration**: One agent hands off to another
- **Parallel Processing**: Multiple agents work on different aspects
- **Consensus Building**: Agents discuss and agree on solutions
- **Peer Review**: Agents review each other's work

### How do I choose the right agent?

Use this quick guide:

| Need | Best Agent | Example |
|------|------------|---------|
| Learning programming | Teacher | "Teach me React hooks" |
| Code review | Dev | "Review this component" |
| Design help | Designer | "Improve this UI layout" |
| Bug fixing | Debugger | "Fix this error message" |
| General guidance | Nexy | "Help me plan my project" |

### Do agents remember our conversations?

Yes, agents maintain conversation context:

- **Session Memory**: Remember the current conversation
- **Project Context**: Understand your project structure
- **User Preferences**: Learn your coding style and preferences
- **Cross-Agent Memory**: Agents can reference previous conversations

## 🎨 Canvas and Workflows

### What is the Canvas?

The Canvas is NEX7's visual workflow builder where you:

- **Drag Nodes**: From the palette to create actions
- **Connect Workflows**: Link nodes to define data flow
- **Configure Properties**: Set up each node's behavior
- **Execute Workflows**: Run your visual programs

### What types of nodes are available?

**Core Nodes**:
- **Claude**: AI-powered content generation and analysis
- **GitHub**: Repository operations and automation
- **Vercel**: Deployment and hosting management
- **API**: HTTP requests to external services
- **Database**: Data storage and retrieval
- **Email**: Notifications and communications

**Control Nodes**:
- **Conditional**: If/then logic branching
- **Loop**: Iterate over data or repeat actions
- **Transform**: Data manipulation and formatting
- **Schedule**: Time-based triggers

### Can I create custom nodes?

Yes! NEX7 supports custom node development:

- **Simple Nodes**: Use the built-in node editor
- **Advanced Nodes**: Develop with TypeScript/JavaScript
- **Plugin System**: Package and share custom nodes
- **Marketplace**: Download community-created nodes

### How do I share workflows?

Workflows can be shared in multiple ways:

- **Export/Import**: Save workflows as JSON files
- **Templates**: Create reusable workflow templates
- **Team Sharing**: Share within your organization
- **Public Gallery**: Contribute to the community gallery

## 🚀 Deployment and Auto-Recovery

### What is auto-recovery?

Auto-recovery is NEX7's intelligent system that:

- **Monitors Deployments**: Watches for build failures
- **Detects Errors**: Identifies common issues automatically
- **Applies Fixes**: Attempts to fix errors automatically
- **Creates Issues**: Opens GitHub issues for complex problems
- **Notifies Teams**: Sends alerts about deployment status

### What types of errors can be auto-fixed?

Common auto-fixable errors:

- **TypeScript errors**: Missing types, import issues
- **ESLint errors**: Code style and quality issues
- **Dependency issues**: Missing or outdated packages
- **Build errors**: Configuration and compilation problems
- **Environment issues**: Missing variables or configurations

### How reliable is auto-recovery?

Auto-recovery success rates:

- **TypeScript issues**: ~85% success rate
- **ESLint problems**: ~95% success rate
- **Dependency issues**: ~90% success rate
- **Build configuration**: ~75% success rate
- **Complex errors**: Escalated to human review

### Can I disable auto-recovery?

Yes, auto-recovery can be configured:

- **Fully Enabled**: Automatic fixes for all supported errors
- **Notification Only**: Detect issues but don't auto-fix
- **Selective**: Choose which types of errors to auto-fix
- **Disabled**: Turn off auto-recovery completely

## 🔐 Security and Privacy

### Is my code safe with NEX7?

NEX7 takes security seriously:

- **Local Processing**: Code analysis happens locally when possible
- **Encrypted Transit**: All data encrypted in transit
- **No Code Storage**: We don't store your source code
- **API Key Security**: Secure storage of authentication tokens
- **Access Controls**: User-based permissions and access control

### What data does NEX7 collect?

**Collected Data**:
- Account information (email, name)
- Usage analytics (features used, performance metrics)
- Error reports (for debugging and improvement)
- Conversation history (for context and improvement)

**Not Collected**:
- Source code content
- API keys or secrets
- Personal files
- Private repository contents

### How do I delete my data?

You can manage your data:

- **Account Settings**: Delete conversations and preferences
- **Data Export**: Download your data before deletion
- **Account Deletion**: Completely remove your account
- **GDPR Compliance**: EU users have additional rights

### Can I use NEX7 offline?

Limited offline functionality:

- **Canvas Editor**: Works offline for workflow design
- **Documentation**: Local docs available offline
- **Code Analysis**: Some features work without internet
- **AI Features**: Require internet connection for Claude API
- **Deployment**: Requires internet for external services

## 💻 Technical Questions

### What technologies does NEX7 use?

**Frontend**:
- React 19 + Next.js 15
- TypeScript for type safety
- Tailwind CSS for styling
- React Flow for canvas functionality

**Backend**:
- Next.js API routes
- Prisma for database access
- JWT for authentication
- Claude AI for intelligence

**Deployment**:
- Vercel for hosting
- PostgreSQL for production database
- Redis for caching
- GitHub Actions for CI/CD

### Can I self-host NEX7?

Yes! NEX7 can be self-hosted:

- **Docker**: Container-based deployment
- **Traditional**: VPS or dedicated server deployment
- **Cloud**: AWS, GCP, Azure deployment options
- **On-Premises**: Complete control over data and infrastructure

### What are the system requirements?

**Development**:
- Node.js 18+ with npm
- 4GB RAM minimum, 8GB recommended
- Modern web browser
- Git for version control

**Production**:
- 2GB RAM minimum for small deployments
- PostgreSQL or compatible database
- Redis for caching (optional)
- SSL certificate for HTTPS

### How do I backup my data?

**Automatic Backups**:
- Database backups (if using hosted service)
- Workflow exports in your account
- GitHub repository backups

**Manual Backups**:
- Export workflows as JSON files
- Database dumps for self-hosted installations
- Configuration backups

## 🔧 Troubleshooting

### NEX7 won't start locally

**Common Solutions**:

1. **Check Node.js version**:
   ```bash
   node --version  # Should be 18+
   ```

2. **Install dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check environment variables**:
   ```bash
   # Ensure .env.local exists and has required variables
   cat .env.local | grep ANTHROPIC_API_KEY
   ```

4. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run build
   ```

### Agents not responding

**Troubleshooting Steps**:

1. **Check API key**: Verify your Claude API key is valid
2. **Check rate limits**: You might have exceeded API limits
3. **Check internet connection**: Agents require internet access
4. **Try different agent**: Test with a different agent
5. **Clear browser cache**: Refresh the page and try again

### Canvas workflows not executing

**Common Issues**:

1. **Disconnected nodes**: Ensure all nodes are properly connected
2. **Missing inputs**: Check that all required inputs are provided
3. **Invalid configuration**: Verify node configurations are correct
4. **Permission errors**: Check API keys and permissions
5. **Network issues**: Verify internet connectivity

### Deployment failures

**Auto-Recovery Steps**:

1. **Check build logs**: Review Vercel deployment logs
2. **Wait for auto-fix**: Auto-recovery system may fix automatically
3. **Manual fixes**: Apply suggested fixes from error analysis
4. **Contact support**: For persistent issues

## 📚 Learning and Resources

### Where can I learn more?

**Documentation**:
- [Getting Started Guide](../getting-started/README.md)
- [Canvas Tutorial](./canvas-workflow.md)
- [Agent System Guide](./agent-system.md)
- [API Reference](../api-reference/README.md)

**Community**:
- GitHub Discussions
- Discord Community (coming soon)
- Stack Overflow (tag: nex7)
- YouTube Tutorials (coming soon)

### Are there video tutorials?

Coming soon! We're working on:

- Getting started video series
- Canvas workflow tutorials
- Agent collaboration examples
- Advanced feature deep-dives
- Live coding sessions

### Can I contribute to NEX7?

Absolutely! NEX7 is open source:

- **Code Contributions**: Submit pull requests
- **Documentation**: Improve docs and tutorials
- **Bug Reports**: Report issues on GitHub
- **Feature Requests**: Suggest new features
- **Community**: Help other users in discussions

### How do I stay updated?

**Follow Updates**:
- GitHub repository for code changes
- Twitter/X for announcements
- Newsletter for major updates
- Discord for community discussions

## 💡 Tips and Best Practices

### Canvas Workflow Tips

- **Start Simple**: Begin with basic workflows before adding complexity
- **Use Templates**: Leverage existing templates as starting points
- **Document Workflows**: Add descriptions and comments
- **Test Frequently**: Run workflows regularly during development
- **Error Handling**: Always plan for failure scenarios

### Agent Interaction Tips

- **Be Specific**: Provide clear, detailed questions
- **Give Context**: Include relevant background information
- **Use Examples**: Show what you're trying to achieve
- **Ask Follow-ups**: Agents remember conversation context
- **Switch Agents**: Use the best agent for each task

### Performance Tips

- **Cache Results**: Use caching for expensive operations
- **Batch Operations**: Group similar tasks together
- **Optimize Queries**: Use efficient database queries
- **Monitor Usage**: Track API usage and costs
- **Profile Workflows**: Identify bottlenecks and optimize

## 🆘 Getting Help

### Free Support Options

- **Documentation**: Comprehensive guides and tutorials
- **Community Forum**: GitHub Discussions
- **FAQ**: This document
- **Troubleshooting Guide**: Step-by-step solutions

### Premium Support (Coming Soon)

- **Priority Support**: Faster response times
- **Direct Access**: Direct communication with developers
- **Custom Solutions**: Tailored implementations
- **Training**: Personalized training sessions

### Emergency Support

For critical production issues:

1. **Check Status Page**: Verify service status
2. **Review Logs**: Check application and deployment logs
3. **Follow Runbooks**: Use troubleshooting procedures
4. **Contact Support**: Use appropriate support channel

---

**Don't see your question here?** Check the [Troubleshooting Guide](./troubleshooting.md) or ask in our [GitHub Discussions](https://github.com/betofilippi/nex7.com/discussions).