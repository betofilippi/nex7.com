import { http, HttpResponse } from 'msw'

export const handlers = [
  // Auth API handlers
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
      token: 'mock-jwt-token',
    })
  }),

  http.post('/api/auth/signup', () => {
    return HttpResponse.json({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
      token: 'mock-jwt-token',
    })
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    })
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true })
  }),

  // Agents API handlers
  http.get('/api/agents/conversations', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Test Conversation',
        agent: 'nexy',
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: '1',
            content: 'Hello, how can I help you?',
            role: 'assistant',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    ])
  }),

  http.post('/api/agents/chat', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: '2',
      content: `Mock response to: ${body.message}`,
      role: 'assistant',
      timestamp: new Date().toISOString(),
    })
  }),

  http.post('/api/agents/switch', () => {
    return HttpResponse.json({
      success: true,
      agent: 'designer',
      message: 'Switched to Designer Agent',
    })
  }),

  // Claude API handlers
  http.post('/api/claude/conversation', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      response: `Claude mock response to: ${body.message}`,
      usage: {
        input_tokens: 10,
        output_tokens: 20,
      },
    })
  }),

  // Vercel API handlers
  http.get('/api/vercel/projects', () => {
    return HttpResponse.json([
      {
        id: 'proj_123',
        name: 'test-project',
        framework: 'nextjs',
        createdAt: new Date().toISOString(),
      },
    ])
  }),

  http.post('/api/vercel/deployments', () => {
    return HttpResponse.json({
      id: 'dpl_123',
      url: 'https://test-project-123.vercel.app',
      state: 'BUILDING',
      createdAt: new Date().toISOString(),
    })
  }),

  http.get('/api/vercel/deployments/:deploymentId/status', ({ params }) => {
    return HttpResponse.json({
      id: params.deploymentId,
      state: 'READY',
      url: 'https://test-project-123.vercel.app',
    })
  }),

  // Marketplace API handlers
  http.get('/api/marketplace/workflows', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Sample Workflow',
        description: 'A sample workflow for testing',
        category: 'automation',
        rating: 4.5,
        downloads: 100,
      },
    ])
  }),

  // Keys API handlers
  http.get('/api/keys', () => {
    return HttpResponse.json({
      hasAnthropicKey: true,
      hasVercelToken: true,
      hasGitHubToken: false,
    })
  }),

  // Webhooks handlers
  http.post('/api/webhooks/github', () => {
    return HttpResponse.json({ received: true })
  }),

  http.post('/api/webhooks/vercel', () => {
    return HttpResponse.json({ received: true })
  }),

  // External API mocks
  http.get('https://api.anthropic.com/*', () => {
    return HttpResponse.json({
      content: [
        {
          type: 'text',
          text: 'Mock Claude API response',
        },
      ],
      usage: {
        input_tokens: 10,
        output_tokens: 20,
      },
    })
  }),

  http.get('https://api.vercel.com/*', () => {
    return HttpResponse.json({
      projects: [],
      deployments: [],
    })
  }),

  // Error handlers for testing error states
  http.get('/api/error/500', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }),

  http.get('/api/error/401', () => {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }),

  http.get('/api/error/404', () => {
    return HttpResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    )
  }),
]