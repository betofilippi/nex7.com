# Agent System Guide

Learn how to work with NEX7's multi-agent AI system - a team of specialized AI assistants designed to help with every aspect of development.

## 🤖 Meet Your AI Team

NEX7 features five specialized agents, each with unique personalities and expertise:

### Nexy - The Friendly Guide
**Personality**: Warm, encouraging, beginner-friendly  
**Specialization**: Onboarding, general guidance, project planning  
**Best for**: New users, project ideation, learning programming concepts

```typescript
// Example conversation with Nexy
"Help me understand what NEX7 can do for my project"
"I'm new to programming, where should I start?"
"Can you explain the canvas workflow system?"
```

### Dev - The Technical Expert  
**Personality**: Precise, analytical, detail-oriented  
**Specialization**: Code review, architecture, debugging, optimization  
**Best for**: Technical implementation, code quality, performance issues

```typescript
// Example conversation with Dev
"Review this React component for performance issues"
"How should I structure my Next.js API routes?"
"Explain the difference between these two implementations"
```

### Designer - The Creative Visionary
**Personality**: Artistic, user-focused, aesthetically-minded  
**Specialization**: UI/UX design, styling, user experience  
**Best for**: Design systems, color schemes, layout optimization

```typescript
// Example conversation with Designer  
"Create a color palette for a fintech dashboard"
"What's the best layout for this mobile interface?"
"How can I improve the user experience of this form?"
```

### Teacher - The Patient Instructor
**Personality**: Patient, educational, encouraging  
**Specialization**: Step-by-step tutorials, concept explanation  
**Best for**: Learning new technologies, understanding complex topics

```typescript
// Example conversation with Teacher
"Teach me React hooks step by step"
"Explain how database relationships work"
"Walk me through building a REST API"
```

### Debugger - The Problem Solver
**Personality**: Methodical, thorough, solution-focused  
**Specialization**: Error diagnosis, troubleshooting, bug fixes  
**Best for**: Fixing errors, optimizing performance, debugging issues

```typescript
// Example conversation with Debugger
"This API call is failing with a 500 error"
"My React component isn't re-rendering properly"
"Help me optimize this slow database query"
```

## 💬 How to Chat with Agents

### Starting a Conversation

1. **Navigate to Agents**: Go to [/agents](http://localhost:3000/agents)
2. **Select an Agent**: Click on the agent that best matches your need
3. **Start Chatting**: Type your message and press Enter

### Conversation Tips

**Be Specific**: Instead of "Help me with my code", try:
```
"Review this React component and suggest performance improvements"
```

**Provide Context**: Include relevant code, error messages, or background:
```
"I'm getting this TypeScript error in my Next.js app:
[paste error message]

Here's my component code:
[paste code]
```

**Ask Follow-up Questions**: Agents remember conversation context:
```
You: "How do I create a React hook?"
Agent: [explains hooks]
You: "Can you show an example with useState?"
Agent: [provides specific example]
```

## 🔄 Agent Collaboration

Agents can work together on complex problems:

### Multi-Agent Workflows

**Design + Development**:
1. Ask **Designer** for UI mockups
2. Share the design with **Dev** for implementation
3. Get **Teacher** to explain complex concepts
4. Use **Debugger** for any issues

**Example Collaboration**:
```
1. Designer: "Create a dashboard layout for user analytics"
   → Returns design specifications

2. Dev: "Implement this dashboard design in React"
   → Returns code implementation  

3. Debugger: "This component has performance issues"
   → Identifies and fixes problems
```

### Agent Switching

Switch between agents mid-conversation:
- Use the agent selector dropdown
- Previous context is maintained
- Agents can reference earlier conversations

## 🛠️ Advanced Agent Features

### Memory and Context

Each agent maintains:
- **Conversation History**: Remembers previous messages
- **User Preferences**: Learns your coding style and preferences  
- **Project Context**: Understands your current project setup
- **Code Awareness**: Knows about your codebase structure

### Tool Integration

Agents have access to powerful tools:

**Code Analysis**:
```typescript
"Analyze my codebase for potential security issues"
"Generate documentation for this API endpoint"
"Suggest refactoring opportunities"
```

**Project Management**:
```typescript
"Create a project plan for this feature"
"Estimate development time for these tasks"
"Break down this epic into smaller stories"
```

**Deployment & DevOps**:
```typescript
"Help me set up CI/CD for this project"
"Debug my Vercel deployment issues"
"Optimize my build configuration"
```

### Real-time Collaboration

**Live Code Review**: Share your screen and get real-time feedback
**Pair Programming**: Work together on complex problems
**Code Suggestions**: Get instant suggestions as you type

## 🎯 Best Practices

### Choosing the Right Agent

| Need | Recommended Agent | Why |
|------|------------------|-----|
| Learning new concept | Teacher | Patient, educational approach |
| Code review | Dev | Technical expertise, best practices |
| UI/UX problems | Designer | Visual design skills, user focus |
| Error debugging | Debugger | Systematic problem-solving |
| General guidance | Nexy | Friendly, comprehensive help |

### Effective Communication

**Do:**
- Be specific about your goals
- Provide relevant code and context
- Ask follow-up questions
- Share error messages completely
- Describe your experience level

**Don't:**
- Ask overly broad questions
- Skip important context
- Expect agents to guess your setup
- Share sensitive information (API keys, passwords)

### Managing Conversations

**Organization**:
- Use descriptive conversation titles
- Start new conversations for different topics
- Archive completed conversations
- Use tags to categorize discussions

**Context Switching**:
- Clearly state when changing topics
- Reference previous conversations when relevant
- Provide context when switching agents

## 🔧 Customization

### Agent Personalities

Customize agent behavior:

```typescript
// Adjust agent personalities in configuration
{
  "nexy": {
    "tone": "encouraging",
    "verbosity": "detailed",
    "examples": "always"
  },
  "dev": {
    "tone": "technical", 
    "verbosity": "concise",
    "codeStyle": "typescript"
  }
}
```

### Personal Preferences

Set your preferences:
- **Coding Style**: Preferred languages, frameworks
- **Communication Style**: Formal vs casual
- **Detail Level**: Brief vs comprehensive responses
- **Example Frequency**: How often to include code examples

### Custom Agents

Create specialized agents for your team:

```typescript
// Custom agent configuration
{
  "name": "DataExpert",
  "specialization": "Data analysis and machine learning",
  "personality": "analytical, data-driven",
  "tools": ["pandas", "numpy", "sklearn"],
  "knowledge": "data science, statistics, ML algorithms"
}
```

## 📊 Analytics and Insights

### Conversation Analytics

Track your agent interactions:
- **Most Used Agents**: Which agents you interact with most
- **Topic Distribution**: What you discuss most often
- **Problem Resolution**: How quickly issues are resolved
- **Learning Progress**: Track your skill development

### Agent Performance

Monitor agent effectiveness:
- **Response Quality**: Rate agent responses
- **Problem Resolution**: Success rate for different types of questions
- **User Satisfaction**: Overall satisfaction scores

## 🔐 Privacy and Security

### Data Handling

**What Agents Remember**:
- Conversation history within sessions
- User preferences and settings
- Project context (non-sensitive)
- Code patterns and style preferences

**What Agents Don't Store**:
- API keys or passwords
- Proprietary business logic
- Personal identifying information
- Sensitive configuration data

### Security Best Practices

**Safe to Share**:
- Code snippets (without secrets)
- Error messages
- Configuration files (sanitized)
- Architecture diagrams

**Never Share**:
- API keys or tokens
- Database credentials
- Personal information
- Proprietary algorithms

## 🚀 Advanced Use Cases

### Team Collaboration

**Code Review Workflows**:
1. **Dev** reviews code for technical quality
2. **Designer** checks UI/UX implementation
3. **Debugger** tests for potential issues
4. **Teacher** explains complex parts to team members

**Project Planning**:
1. **Nexy** helps define project scope
2. **Designer** creates wireframes and mockups
3. **Dev** estimates technical complexity
4. **Teacher** identifies learning requirements

### Learning Journeys

**Beginner Path**:
1. **Nexy**: "I want to learn web development"
2. **Teacher**: "Start with HTML, CSS, JavaScript basics"
3. **Dev**: "Here's a simple project to practice"
4. **Debugger**: "Let's fix any issues you encounter"

**Advanced Path**:
1. **Dev**: "How do I optimize React performance?"
2. **Debugger**: "Let's analyze your current code"
3. **Designer**: "Consider UX impact of optimizations"
4. **Teacher**: "Here are advanced patterns to learn"

## 📚 Related Documentation

- [API Reference - Agents](../api-reference/README.md#agents) - Agent API endpoints
- [Canvas Workflows](./canvas-workflow.md) - Using agents in visual workflows
- [Project Management](./project-management.md) - Agent-assisted project planning
- [Troubleshooting](./troubleshooting.md) - Common agent issues

## 💡 Tips and Tricks

### Power User Features

**Quick Commands**:
```
/analyze [code] - Quick code analysis
/review [file] - Code review
/explain [concept] - Concept explanation
/debug [error] - Error debugging
/design [component] - UI design help
```

**Context Shortcuts**:
```
@previous - Reference previous conversation
@project - Include current project context  
@error - Include latest error details
@code - Include current code context
```

### Workflow Integration

**IDE Integration**: Connect agents to your development environment
**Git Integration**: Agents can review commits and suggest improvements
**CI/CD Integration**: Agents monitor deployments and suggest fixes

---

**Ready to collaborate with your AI team?** Start chatting with [Nexy](http://localhost:3000/agents?agent=nexy) for a friendly introduction to the system!