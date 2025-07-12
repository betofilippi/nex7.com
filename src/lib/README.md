# Claude Code SDK Integration

This directory contains the Claude Code SDK integration for the nex7.com application.

## Setup

1. Set your Anthropic API key in the environment:
   ```bash
   ANTHROPIC_API_KEY=your_api_key_here
   ```

2. The integration is ready to use!

## Features

### 1. Claude Client (`claude-client.ts`)
- Wrapper class for the Anthropic SDK
- Conversation context management
- Support for both streaming and non-streaming responses
- Tool execution support

### 2. Tool Implementations (`claude-tools.ts`)
- Read: Read files from the filesystem
- Write: Write files to the filesystem
- Edit: Edit files by replacing text
- Bash: Execute bash commands
- List: List files and directories
- Grep: Search for patterns in files

### 3. Rate Limiting (`rate-limiter.ts`)
- Configurable rate limiting per IP
- Default: 30 requests/minute for regular API calls
- Default: 10 requests/minute for streaming calls

### 4. SSE Utilities (`sse-utils.ts`)
- Server-Sent Events support for streaming responses
- React hook for easy integration in components

## API Endpoints

### `/api/claude/query`
Send a message to Claude with optional conversation context and tools.

**POST Request:**
```json
{
  "message": "Your message here",
  "conversationId": "optional_conversation_id",
  "tools": [], // Optional array of tools
  "stream": false // Set to true for streaming response
}
```

### `/api/claude/tools`
Execute messages with tool support enabled.

**POST Request:**
```json
{
  "message": "Your message here",
  "conversationId": "optional_conversation_id",
  "enableTools": true
}
```

**GET Request:**
Returns list of available tools.

### `/api/claude/conversation`
Manage conversation contexts.

**POST:** Create new conversation
```json
{
  "id": "optional_custom_id"
}
```

**GET:** Get conversation details
```
/api/claude/conversation?id=conversation_id
```

**PUT:** Update conversation
```json
{
  "conversationId": "conversation_id",
  "messages": [
    {
      "role": "user",
      "content": "Message content"
    }
  ]
}
```

**DELETE:** Delete conversation
```
/api/claude/conversation?id=conversation_id
```

## Usage Examples

### Basic Query
```typescript
const response = await fetch('/api/claude/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Hello, Claude!',
  }),
});

const data = await response.json();
console.log(data.content);
```

### Streaming Query with React Hook
```typescript
import { useSSEQuery } from '@/lib/sse-utils';

function MyComponent() {
  const { messages, isStreaming, error, startStream, cancelStream } = useSSEQuery();

  const handleQuery = () => {
    startStream('Tell me a story about coding');
  };

  return (
    <div>
      <button onClick={handleQuery} disabled={isStreaming}>
        {isStreaming ? 'Streaming...' : 'Start Query'}
      </button>
      {isStreaming && (
        <button onClick={cancelStream}>Cancel</button>
      )}
      {error && <p>Error: {error}</p>}
      <div>{messages}</div>
    </div>
  );
}
```

### Using Tools
```typescript
const response = await fetch('/api/claude/tools', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Read the package.json file and tell me what dependencies are installed',
    enableTools: true,
  }),
});

const data = await response.json();
console.log(data.content);
console.log(data.toolCalls); // Array of executed tools
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 400: Bad Request (missing parameters)
- 401: Unauthorized (invalid API key)
- 404: Not Found (conversation not found)
- 429: Rate Limit Exceeded
- 500: Internal Server Error

Error responses include a JSON body with an `error` field:
```json
{
  "error": "Error message",
  "retryAfter": 60 // For rate limit errors
}
```

## Security Considerations

1. **API Key**: Store your Anthropic API key securely in environment variables
2. **Rate Limiting**: Implement per-IP rate limiting to prevent abuse
3. **Input Validation**: All inputs are validated before processing
4. **Tool Execution**: Be careful with tool permissions, especially for bash commands
5. **CORS**: Configure CORS appropriately for your deployment

## Performance Tips

1. Use streaming for long responses to improve perceived performance
2. Implement conversation caching on the client side
3. Use the rate limiter to prevent API quota exhaustion
4. Consider implementing request queuing for better user experience