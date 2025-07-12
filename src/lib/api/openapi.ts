export const openAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'NeX7 API',
    version: '1.0.0',
    description: 'The NeX7 platform API for building AI-powered applications',
    contact: {
      name: 'NeX7 Support',
      email: 'support@nex7.com',
      url: 'https://nex7.com/support',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'https://api.nex7.com/v1',
      description: 'Production server',
    },
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key',
        description: 'Use your API key as the bearer token',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
          code: {
            type: 'string',
            description: 'Error code',
          },
          details: {
            type: 'object',
            description: 'Additional error details',
          },
        },
        required: ['error'],
      },
      Project: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
          settings: {
            type: 'object',
          },
        },
        required: ['id', 'name'],
      },
      AIMessage: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            enum: ['user', 'assistant', 'system'],
          },
          content: {
            type: 'string',
          },
        },
        required: ['role', 'content'],
      },
      AIResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          model: {
            type: 'string',
          },
          messages: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/AIMessage',
            },
          },
          usage: {
            type: 'object',
            properties: {
              prompt_tokens: {
                type: 'integer',
              },
              completion_tokens: {
                type: 'integer',
              },
              total_tokens: {
                type: 'integer',
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/projects': {
      get: {
        summary: 'List projects',
        operationId: 'listProjects',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: {
              type: 'integer',
              default: 1,
            },
          },
          {
            name: 'limit',
            in: 'query',
            schema: {
              type: 'integer',
              default: 20,
              maximum: 100,
            },
          },
        ],
        responses: {
          200: {
            description: 'List of projects',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    projects: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Project',
                      },
                    },
                    total: {
                      type: 'integer',
                    },
                    page: {
                      type: 'integer',
                    },
                    limit: {
                      type: 'integer',
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create project',
        operationId: 'createProject',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  description: {
                    type: 'string',
                  },
                  settings: {
                    type: 'object',
                  },
                },
                required: ['name'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Project created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Project',
                },
              },
            },
          },
        },
      },
    },
    '/projects/{projectId}': {
      get: {
        summary: 'Get project',
        operationId: 'getProject',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'projectId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          200: {
            description: 'Project details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Project',
                },
              },
            },
          },
          404: {
            description: 'Project not found',
          },
        },
      },
      put: {
        summary: 'Update project',
        operationId: 'updateProject',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'projectId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  description: {
                    type: 'string',
                  },
                  settings: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Project updated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Project',
                },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete project',
        operationId: 'deleteProject',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'projectId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          204: {
            description: 'Project deleted',
          },
        },
      },
    },
    '/ai/chat': {
      post: {
        summary: 'Chat with AI',
        operationId: 'aiChat',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  messages: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/AIMessage',
                    },
                  },
                  model: {
                    type: 'string',
                    default: 'gpt-4',
                  },
                  temperature: {
                    type: 'number',
                    minimum: 0,
                    maximum: 2,
                    default: 0.7,
                  },
                  max_tokens: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 4096,
                  },
                },
                required: ['messages'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'AI response',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AIResponse',
                },
              },
            },
          },
        },
      },
    },
    '/ai/generate': {
      post: {
        summary: 'Generate content with AI',
        operationId: 'aiGenerate',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  prompt: {
                    type: 'string',
                  },
                  type: {
                    type: 'string',
                    enum: ['text', 'code', 'image'],
                  },
                  model: {
                    type: 'string',
                  },
                  options: {
                    type: 'object',
                  },
                },
                required: ['prompt', 'type'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Generated content',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    content: {
                      type: 'string',
                    },
                    type: {
                      type: 'string',
                    },
                    metadata: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};