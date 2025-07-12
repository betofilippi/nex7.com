# API Reference

Complete API documentation for the NEX7 Platform with interactive examples and detailed endpoint information.

## 🚀 Quick Start

The NEX7 API provides programmatic access to all platform features including AI agents, visual workflows, project management, and deployment automation.

### Base URL

```
Production: https://nex7.com/api
Development: http://localhost:3000/api
```

### Authentication

Most endpoints require authentication using JWT bearer tokens:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://nex7.com/api/users/me
```

### Rate Limits

- **Authenticated Users**: 1,000 requests/hour
- **Anonymous Users**: 100 requests/hour  
- **AI Endpoints**: 50 requests/hour per user

## 📚 Interactive Documentation

Visit the [Interactive API Documentation](/docs/api) for a complete Swagger UI interface with:

- **Try It Out**: Test endpoints directly from the browser
- **Authentication**: Built-in auth token management
- **Examples**: Request/response examples for every endpoint
- **Schema Validation**: Real-time validation of request payloads

## 🏗️ API Categories

### [Authentication](/docs/api#tag/Authentication)
User authentication, registration, and session management.

**Key Endpoints:**
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration  
- `POST /api/auth/refresh` - Refresh JWT token
- `DELETE /api/auth/logout` - User logout

### [Agents](/docs/api#tag/Agents)
Interact with AI agents and manage conversations.

**Key Endpoints:**
- `GET /api/agents` - List available agents
- `POST /api/agents/chat` - Send message to agent
- `GET /api/agents/conversations` - Get conversation history
- `POST /api/agents/collaborate` - Multi-agent collaboration

### [Projects](/docs/api#tag/Projects)
Project management and configuration.

**Key Endpoints:**
- `GET /api/v1/projects` - List user projects
- `POST /api/v1/projects` - Create new project
- `GET /api/v1/projects/{id}` - Get project details
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

### [Canvas](/docs/api#tag/Canvas)
Visual workflow creation and execution.

**Key Endpoints:**
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `POST /api/workflows/{id}/execute` - Execute workflow
- `GET /api/workflows/{id}/status` - Get execution status

### [Deployments](/docs/api#tag/Deployments)
Deployment management and monitoring.

**Key Endpoints:**
- `GET /api/vercel/deployments` - List deployments
- `POST /api/vercel/deployments` - Create deployment
- `GET /api/vercel/deployments/{id}/status` - Get deployment status
- `GET /api/vercel/deployments/{id}/logs` - Get build logs

### [Webhooks](/docs/api#tag/Webhooks)
Webhook management for integrations.

**Key Endpoints:**
- `POST /api/webhooks/github` - GitHub webhook handler
- `POST /api/webhooks/vercel` - Vercel webhook handler
- `POST /api/webhooks/receive` - Generic webhook receiver

## 🔧 SDK Usage

### JavaScript/TypeScript SDK

Install the official NEX7 SDK:

```bash
npm install @nex7/sdk
```

Basic usage:

```typescript
import { NEX7Client } from '@nex7/sdk';

const client = new NEX7Client({
  apiKey: 'your-api-key',
  baseUrl: 'https://nex7.com/api'
});

// Chat with an agent
const response = await client.agents.chat({
  agentId: 'nexy',
  message: 'Help me create a React component'
});

// Create a project
const project = await client.projects.create({
  name: 'My Web App',
  type: 'web',
  description: 'A modern web application'
});

// Execute a workflow
const execution = await client.workflows.execute('workflow-id', {
  inputs: { message: 'Hello World' }
});
```

### Python SDK

```bash
pip install nex7-python
```

```python
from nex7 import NEX7Client

client = NEX7Client(api_key='your-api-key')

# Chat with agent
response = client.agents.chat(
    agent_id='dev',
    message='Show me how to optimize React performance'
)

# List projects
projects = client.projects.list()
```

### cURL Examples

**Authentication:**
```bash
curl -X POST https://nex7.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

**Chat with Agent:**
```bash
curl -X POST https://nex7.com/api/agents/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "nexy",
    "message": "Help me debug this React error"
  }'
```

**Create Project:**
```bash
curl -X POST https://nex7.com/api/v1/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "type": "web",
    "description": "A new web application"
  }'
```

## 📝 Request/Response Format

### Request Headers

```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
X-Request-ID: unique-request-id (optional)
```

### Response Format

All API responses follow a consistent structure:

**Success Response:**
```json
{
  "data": { /* response data */ },
  "meta": {
    "requestId": "req_123456",
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0"
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error context"
  },
  "meta": {
    "requestId": "req_123456",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## 🔐 Security

### API Keys

Generate API keys in your dashboard for service-to-service authentication:

```bash
curl -X POST https://nex7.com/api/keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "My Service Key", "scopes": ["read", "write"]}'
```

### CORS

CORS is configured for web applications:

```javascript
// Allowed origins in production
const allowedOrigins = [
  'https://nex7.com',
  'https://app.nex7.com',
  'http://localhost:3000'
];
```

### Rate Limiting

Rate limits are enforced per user and endpoint. Headers included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 🧪 Testing

### Postman Collection

Import our Postman collection for easy API testing:

[Download NEX7 Postman Collection](./postman/nex7-api.json)

### Test Environment

Use our test environment for development:

```
Base URL: https://api-test.nex7.com
Test API Key: test_key_123456789
```

## 📊 Monitoring

### Health Check

```bash
curl https://nex7.com/api/health
```

Response:
```json
{
  "status": "healthy",
  "services": {
    "database": "healthy",
    "claude": "healthy",
    "vercel": "healthy"
  },
  "version": "1.0.0",
  "uptime": 86400
}
```

### Status Page

Monitor API status and performance: [status.nex7.com](https://status.nex7.com)

## 🔄 Versioning

The API uses semantic versioning:

- **v1.x.x** - Current stable version
- **v2.x.x** - Next major version (in development)

Version is specified in the URL path: `/api/v1/...`

## 📞 Support

- **Documentation**: [nex7.com/docs](https://nex7.com/docs)
- **GitHub Issues**: [github.com/betofilippi/nex7.com/issues](https://github.com/betofilippi/nex7.com/issues)
- **Discord**: [Join our community](https://discord.gg/nex7) (coming soon)
- **Email**: [api-support@nex7.com](mailto:api-support@nex7.com)

## 🚀 What's Next?

- **GraphQL API** - Coming in v2.0
- **Webhooks v2** - Enhanced webhook system
- **Batch Operations** - Bulk API operations
- **Real-time Subscriptions** - WebSocket support

---

**Ready to build with the NEX7 API?** Start with our [Interactive Documentation](/docs/api) or [Quick Start Guide](../getting-started/quick-start.md).