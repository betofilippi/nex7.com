export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'NEX7 API Documentation',
    version: '1.0.0',
    description: `
# NEX7 Platform API

A comprehensive API for the NEX7 Visual Claude Code Development Platform.

## Features

- **Multi-Agent AI System**: Interact with specialized AI agents
- **Visual Canvas Workflows**: Create and execute visual workflows
- **Auto-Deploy & Recovery**: Intelligent CI/CD with automatic error fixing
- **Project Management**: Manage development projects and deployments
- **Real-time Collaboration**: Work together with AI assistants

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting

API requests are rate-limited to ensure fair usage:
- **Authenticated users**: 1000 requests per hour
- **Anonymous users**: 100 requests per hour
- **AI endpoints**: 50 requests per hour per user

## Error Handling

All errors follow a consistent format:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details"
  }
}
\`\`\`
    `,
    contact: {
      name: 'NEX7 Support',
      email: 'support@nex7.com',
      url: 'https://github.com/betofilippi/nex7.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server'
    },
    {
      url: 'https://nex7.com/api',
      description: 'Production server'
    }
  ],
  paths: {},
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for service-to-service authentication'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: {
                type: 'string',
                description: 'Machine-readable error code'
              },
              message: {
                type: 'string',
                description: 'Human-readable error message'
              },
              details: {
                type: 'string',
                description: 'Additional error details'
              }
            }
          }
        }
      },
      User: {
        type: 'object',
        required: ['id', 'email', 'name'],
        properties: {
          id: {
            type: 'string',
            description: 'User unique identifier'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          name: {
            type: 'string',
            description: 'User display name'
          },
          avatar: {
            type: 'string',
            format: 'uri',
            description: 'User avatar URL'
          },
          role: {
            type: 'string',
            enum: ['user', 'admin'],
            description: 'User role'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp'
          },
          lastLoginAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last login timestamp'
          }
        }
      },
      Project: {
        type: 'object',
        required: ['id', 'name', 'userId'],
        properties: {
          id: {
            type: 'string',
            description: 'Project unique identifier'
          },
          name: {
            type: 'string',
            description: 'Project name'
          },
          description: {
            type: 'string',
            description: 'Project description'
          },
          userId: {
            type: 'string',
            description: 'Owner user ID'
          },
          type: {
            type: 'string',
            enum: ['web', 'mobile', 'api', 'desktop'],
            description: 'Project type'
          },
          status: {
            type: 'string',
            enum: ['active', 'archived', 'draft'],
            description: 'Project status'
          },
          githubUrl: {
            type: 'string',
            format: 'uri',
            description: 'GitHub repository URL'
          },
          vercelUrl: {
            type: 'string',
            format: 'uri',
            description: 'Vercel deployment URL'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Project creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },
      Agent: {
        type: 'object',
        required: ['id', 'name', 'type'],
        properties: {
          id: {
            type: 'string',
            description: 'Agent unique identifier'
          },
          name: {
            type: 'string',
            description: 'Agent display name'
          },
          type: {
            type: 'string',
            enum: ['nexy', 'dev', 'designer', 'teacher', 'debugger'],
            description: 'Agent specialization type'
          },
          description: {
            type: 'string',
            description: 'Agent description and capabilities'
          },
          personality: {
            type: 'string',
            description: 'Agent personality traits'
          },
          avatar: {
            type: 'string',
            format: 'uri',
            description: 'Agent avatar URL'
          },
          isOnline: {
            type: 'boolean',
            description: 'Agent availability status'
          }
        }
      },
      Conversation: {
        type: 'object',
        required: ['id', 'userId', 'agentId'],
        properties: {
          id: {
            type: 'string',
            description: 'Conversation unique identifier'
          },
          userId: {
            type: 'string',
            description: 'User ID'
          },
          agentId: {
            type: 'string',
            description: 'Agent ID'
          },
          title: {
            type: 'string',
            description: 'Conversation title'
          },
          messages: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Message'
            },
            description: 'Conversation messages'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Conversation start timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last message timestamp'
          }
        }
      },
      Message: {
        type: 'object',
        required: ['id', 'content', 'role'],
        properties: {
          id: {
            type: 'string',
            description: 'Message unique identifier'
          },
          content: {
            type: 'string',
            description: 'Message content'
          },
          role: {
            type: 'string',
            enum: ['user', 'assistant', 'system'],
            description: 'Message sender role'
          },
          metadata: {
            type: 'object',
            description: 'Additional message metadata'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Message timestamp'
          }
        }
      },
      Workflow: {
        type: 'object',
        required: ['id', 'name', 'nodes'],
        properties: {
          id: {
            type: 'string',
            description: 'Workflow unique identifier'
          },
          name: {
            type: 'string',
            description: 'Workflow name'
          },
          description: {
            type: 'string',
            description: 'Workflow description'
          },
          nodes: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/WorkflowNode'
            },
            description: 'Workflow nodes'
          },
          edges: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/WorkflowEdge'
            },
            description: 'Workflow connections'
          },
          status: {
            type: 'string',
            enum: ['draft', 'active', 'paused', 'completed', 'error'],
            description: 'Workflow execution status'
          }
        }
      },
      WorkflowNode: {
        type: 'object',
        required: ['id', 'type', 'position'],
        properties: {
          id: {
            type: 'string',
            description: 'Node unique identifier'
          },
          type: {
            type: 'string',
            enum: ['claude', 'github', 'vercel', 'api', 'database', 'email', 'webhook'],
            description: 'Node type'
          },
          position: {
            type: 'object',
            required: ['x', 'y'],
            properties: {
              x: { type: 'number' },
              y: { type: 'number' }
            }
          },
          data: {
            type: 'object',
            description: 'Node configuration data'
          }
        }
      },
      WorkflowEdge: {
        type: 'object',
        required: ['id', 'source', 'target'],
        properties: {
          id: {
            type: 'string',
            description: 'Edge unique identifier'
          },
          source: {
            type: 'string',
            description: 'Source node ID'
          },
          target: {
            type: 'string',
            description: 'Target node ID'
          },
          sourceHandle: {
            type: 'string',
            description: 'Source handle ID'
          },
          targetHandle: {
            type: 'string',
            description: 'Target handle ID'
          }
        }
      },
      Deployment: {
        type: 'object',
        required: ['id', 'projectId', 'status'],
        properties: {
          id: {
            type: 'string',
            description: 'Deployment unique identifier'
          },
          projectId: {
            type: 'string',
            description: 'Associated project ID'
          },
          url: {
            type: 'string',
            format: 'uri',
            description: 'Deployment URL'
          },
          status: {
            type: 'string',
            enum: ['building', 'ready', 'error', 'canceled'],
            description: 'Deployment status'
          },
          source: {
            type: 'string',
            enum: ['git', 'cli', 'api'],
            description: 'Deployment source'
          },
          commitSha: {
            type: 'string',
            description: 'Git commit SHA'
          },
          commitMessage: {
            type: 'string',
            description: 'Git commit message'
          },
          buildLogs: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Build log entries'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Deployment start timestamp'
          },
          readyAt: {
            type: 'string',
            format: 'date-time',
            description: 'Deployment completion timestamp'
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication information is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
              }
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Access forbidden - insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions'
              }
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: {
                code: 'NOT_FOUND',
                message: 'Resource not found'
              }
            }
          }
        }
      },
      ValidationError: {
        description: 'Request validation failed',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Request validation failed',
                details: 'Invalid email format'
              }
            }
          }
        }
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests'
              }
            }
          }
        }
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization'
    },
    {
      name: 'Users',
      description: 'User management operations'
    },
    {
      name: 'Projects',
      description: 'Project management operations'
    },
    {
      name: 'Agents',
      description: 'AI agent interactions'
    },
    {
      name: 'Conversations',
      description: 'Agent conversation management'
    },
    {
      name: 'Canvas',
      description: 'Visual workflow operations'
    },
    {
      name: 'Deployments',
      description: 'Deployment management and monitoring'
    },
    {
      name: 'Vercel',
      description: 'Vercel integration operations'
    },
    {
      name: 'GitHub',
      description: 'GitHub integration operations'
    },
    {
      name: 'Webhooks',
      description: 'Webhook management'
    }
  ]
};

export default swaggerConfig;