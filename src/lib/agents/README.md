# Intelligent Multi-Agent System

This directory contains the implementation of an intelligent multi-agent system that provides users with specialized AI assistants, each with unique personalities and capabilities.

## Overview

The agent system consists of five specialized agents:

1. **Nexy** - Main Guide
   - Friendly, patient, and encouraging
   - Helps with onboarding and navigation
   - Primary point of contact for users

2. **Dev** - Code Assistant
   - Technical but didactic
   - Assists with code review, debugging, and implementation
   - Provides clear explanations with examples

3. **Designer** - Visual Assistant
   - Creative and detail-oriented
   - Helps with UI/UX design decisions
   - Provides feedback on visual elements

4. **Teacher** - Educational Assistant
   - Patient and instructive
   - Breaks down complex concepts
   - Creates learning paths and quizzes

5. **Debugger** - Problem Solver
   - Analytical and methodical
   - Systematic problem diagnosis
   - Performance optimization

## Architecture

### Core Components

- **definitions.ts** - Agent definitions with personalities and capabilities
- **manager.ts** - Agent conversation management and coordination

### Features

1. **Context-Aware Agent Selection**
   - Automatically suggests the best agent for the current context
   - Smooth transitions between agents

2. **Personality-Based Responses**
   - Each agent has unique traits and speaking styles
   - Emotional states that affect responses

3. **Collaborative Interactions**
   - Agents can suggest handoffs to specialized colleagues
   - Maintains conversation continuity

4. **Conversation Management**
   - Full conversation history
   - Context preservation across agent switches
   - Metadata tracking (mood, confidence)

## Usage

### Basic Implementation

```typescript
import { getClaudeClient } from '@/lib/claude-client';
import { getAgentManager } from '@/lib/agents/manager';

// Initialize
const claudeClient = getClaudeClient(apiKey);
const agentManager = getAgentManager(claudeClient);

// Create conversation
const conversationId = agentManager.createConversation('nexy');

// Send message
const response = await agentManager.sendMessage(
  conversationId,
  'Hello, I need help with my code',
  'dev' // Optional: specify agent
);

// Switch agents
agentManager.switchAgent(conversationId, 'debugger');
```

### Using the React Hook

```typescript
import { useAgentManager } from '@/hooks/useAgentManager';

function MyComponent() {
  const {
    activeAgent,
    messages,
    sendMessage,
    switchAgent
  } = useAgentManager({
    apiKey: 'your-api-key',
    initialAgentId: 'nexy'
  });

  // Use in your component
}
```

## API Endpoints

- `POST /api/agents/chat` - Send message to agent
- `GET /api/agents/chat` - Get conversation history
- `POST /api/agents/conversations` - Create new conversation
- `DELETE /api/agents/conversations` - Clear conversation
- `POST /api/agents/switch` - Switch active agent

## Components

- **AgentAvatar** - Animated avatar with mood indicators
- **AgentChat** - Full chat interface with typing indicators
- **AgentSelector** - UI for choosing agents
- **AgentPersonality** - Display agent traits and state

## Customization

### Adding New Agents

1. Define the agent in `definitions.ts`:

```typescript
export const agents: Record<string, Agent> = {
  // ... existing agents
  myAgent: {
    id: 'myAgent',
    name: 'My Agent',
    role: 'Custom Role',
    avatar: '🤖',
    color: '#COLOR',
    personality: {
      traits: ['trait1', 'trait2'],
      speakingStyle: 'description',
      emotionalRange: ['emotion1', 'emotion2'],
      primaryGoal: 'goal description'
    },
    capabilities: [
      {
        name: 'capability',
        description: 'What it does',
        triggers: ['keyword1', 'keyword2']
      }
    ],
    systemPrompt: 'Agent instructions',
    greeting: 'Initial greeting'
  }
};
```

### Modifying Personalities

Edit the personality traits, speaking styles, and emotional ranges in the agent definitions to customize behavior.

### Custom Behaviors

Extend the `AgentManager` class to add custom logic for agent interactions, context analysis, or special behaviors.