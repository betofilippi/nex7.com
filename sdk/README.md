# NeX7 TypeScript SDK

The official TypeScript/JavaScript SDK for the NeX7 API.

## Installation

```bash
npm install @nex7/sdk
```

## Usage

```typescript
import { NeX7Client } from '@nex7/sdk';

const client = new NeX7Client({
  apiKey: 'your-api-key',
});

// List projects
const projects = await client.projects.list();

// Create a project
const project = await client.projects.create({
  name: 'My Project',
  description: 'A sample project',
});

// Chat with AI
const response = await client.ai.chat({
  messages: [
    { role: 'user', content: 'Hello, how can you help me?' }
  ],
});

console.log(response.messages[response.messages.length - 1].content);
```

## API Reference

### Projects

- `list(params?)` - List projects
- `create(data)` - Create a new project
- `get(id)` - Get a project by ID
- `update(id, data)` - Update a project
- `delete(id)` - Delete a project

### AI

- `chat(data)` - Chat with AI
- `generate(data)` - Generate content with AI
- `streamChat(data)` - Stream chat responses

### Auth

- `createAPIKey(data)` - Create a new API key
- `listAPIKeys()` - List API keys
- `revokeAPIKey(id)` - Revoke an API key

## Error Handling

The SDK throws typed errors:

```typescript
import { NeX7APIError, NeX7RateLimitError } from '@nex7/sdk';

try {
  const projects = await client.projects.list();
} catch (error) {
  if (error instanceof NeX7RateLimitError) {
    console.log(`Rate limit exceeded. Reset at: ${error.reset}`);
  } else if (error instanceof NeX7APIError) {
    console.log(`API error: ${error.message} (${error.status})`);
  }
}
```

## Configuration

```typescript
const client = new NeX7Client({
  apiKey: 'your-api-key',
  baseURL: 'https://api.nex7.com/v1', // optional
  timeout: 30000, // optional, in milliseconds
  maxRetries: 3, // optional
});
```

## License

MIT