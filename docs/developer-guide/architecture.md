# Architecture Overview

Comprehensive guide to NEX7's system architecture, design patterns, and technical implementation details.

## 🏗️ System Overview

NEX7 is built as a modern, scalable web application using a microservices-inspired architecture with the following core principles:

- **Modular Design**: Loosely coupled components for maintainability
- **AI-First**: Claude AI integration at the core of all features
- **Visual Programming**: Canvas-based workflow creation
- **Auto-Recovery**: Intelligent error detection and correction
- **Multi-Agent**: Specialized AI agents for different tasks

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  React 19 + Next.js 15  │  Tailwind CSS  │  Framer Motion │
│  TypeScript             │  shadcn/ui     │  React Flow     │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  Next.js API Routes     │  Rate Limiting  │  Authentication │
│  OpenAPI/Swagger        │  CORS           │  JWT Validation │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Agent Manager     │  Workflow Engine   │  Project Manager  │
│  Claude Client     │  Canvas Executor   │  Deploy Monitor   │
│  Auth Service      │  Notification Hub  │  Plugin System    │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      INTEGRATION LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  Anthropic Claude  │  Vercel API     │  GitHub API         │
│  OpenAI (fallback) │  Docker         │  Email Services     │
│  Database (Prisma) │  Redis Cache    │  Analytics          │
└─────────────────────────────────────────────────────────────┘
```

## 🧠 AI Agent Architecture

### Agent System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT MANAGER                            │
├─────────────────────────────────────────────────────────────┤
│  • Agent Registration & Discovery                           │
│  • Conversation Routing                                     │
│  • Multi-Agent Collaboration                               │
│  • Memory Management                                        │
│  • Context Switching                                        │
└─────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    NEXY     │     │     DEV     │     │  DESIGNER   │
│  (Guide)    │     │ (Technical) │     │ (Creative)  │
└─────────────┘     └─────────────┘     └─────────────┘
        ▼                       ▼                       ▼
┌─────────────┐     ┌─────────────┐
│   TEACHER   │     │  DEBUGGER   │
│ (Educator)  │     │ (Problem    │
│             │     │  Solver)    │
└─────────────┘     └─────────────┘
```

### Agent Implementation

```typescript
// Base Agent Architecture
abstract class BaseAgent {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly personality: AgentPersonality,
    public readonly tools: AgentTool[]
  ) {}

  abstract async processMessage(
    message: string,
    context: ConversationContext
  ): Promise<AgentResponse>;

  abstract async collaborate(
    otherAgent: BaseAgent,
    task: CollaborationTask
  ): Promise<CollaborationResult>;
}

// Specialized Agent Example
class DevAgent extends BaseAgent {
  private readonly codeAnalyzer: CodeAnalyzer;
  private readonly performanceProfiler: PerformanceProfiler;

  async processMessage(message: string, context: ConversationContext) {
    const intent = await this.analyzeIntent(message);
    
    switch (intent.type) {
      case 'code_review':
        return this.performCodeReview(intent.code, context);
      case 'performance_analysis':
        return this.analyzePerformance(intent.code, context);
      case 'architecture_advice':
        return this.provideArchitectureAdvice(intent.requirements, context);
      default:
        return this.generateResponse(message, context);
    }
  }
}
```

## 🎨 Canvas Workflow Architecture

### Visual Workflow Engine

```
┌─────────────────────────────────────────────────────────────┐
│                   CANVAS RENDERER                           │
├─────────────────────────────────────────────────────────────┤
│  React Flow + Custom Nodes                                  │
│  • Drag & Drop Interface                                    │
│  • Real-time Collaboration                                  │
│  • Visual Node Editor                                       │
│  • Connection Validation                                    │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 WORKFLOW EXECUTOR                           │
├─────────────────────────────────────────────────────────────┤
│  • Node Execution Engine                                    │
│  • Data Flow Management                                     │
│  • Error Handling & Recovery                               │
│  • Performance Monitoring                                   │
│  • Parallel Execution                                       │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    NODE REGISTRY                            │
├─────────────────────────────────────────────────────────────┤
│  Built-in Nodes      │  Custom Nodes      │  Plugin Nodes   │
│  • Claude AI         │  • User-Defined    │  • Third-Party  │
│  • GitHub            │  • Team Shared     │  • Marketplace  │
│  • Vercel            │  • Project Specific│  • Community    │
│  • API Calls         │                    │                 │
│  • Databases         │                    │                 │
└─────────────────────────────────────────────────────────────┘
```

### Node Architecture

```typescript
// Node Interface
interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
  inputs: NodeInput[];
  outputs: NodeOutput[];
}

// Node Execution
abstract class ExecutableNode {
  abstract async execute(
    inputs: Record<string, any>,
    context: ExecutionContext
  ): Promise<NodeExecutionResult>;

  protected validateInputs(inputs: Record<string, any>): ValidationResult {
    // Input validation logic
  }

  protected handleError(error: Error): NodeExecutionResult {
    // Error handling and recovery
  }
}

// Example: Claude Node Implementation
class ClaudeNode extends ExecutableNode {
  async execute(inputs: Record<string, any>, context: ExecutionContext) {
    const { message, agent, temperature } = inputs;
    
    try {
      const response = await this.claudeClient.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4000,
        temperature: temperature || 0.7,
        messages: [{ role: "user", content: message }]
      });

      return {
        success: true,
        outputs: {
          response: response.content[0].text,
          usage: response.usage
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}
```

## 🔄 Auto-Deploy and Recovery System

### Deployment Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  GITHUB WEBHOOK                             │
├─────────────────────────────────────────────────────────────┤
│  • Push Events                                              │
│  • PR Events                                                │
│  • Release Events                                           │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                DEPLOYMENT MONITOR                           │
├─────────────────────────────────────────────────────────────┤
│  • Vercel API Polling                                       │
│  • Build Status Tracking                                    │
│  • Error Log Analysis                                       │
│  • Performance Metrics                                      │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 AUTO-RECOVERY ENGINE                        │
├─────────────────────────────────────────────────────────────┤
│  Error Detection      │  Fix Generation    │  Validation    │
│  • TypeScript         │  • Code Fixes      │  • Test Build  │
│  • ESLint             │  • Dependency      │  • Rollback    │
│  • Build Errors       │    Installation    │  • Notify      │
│  • Runtime Issues     │  • Config Updates  │               │
└─────────────────────────────────────────────────────────────┘
```

### Recovery Strategy Implementation

```typescript
class AutoRecoveryEngine {
  private readonly errorDetectors: ErrorDetector[] = [
    new TypeScriptErrorDetector(),
    new ESLintErrorDetector(),
    new DependencyErrorDetector(),
    new BuildErrorDetector()
  ];

  private readonly fixGenerators: FixGenerator[] = [
    new TypeScriptFixGenerator(),
    new ESLintFixGenerator(),
    new DependencyFixGenerator(),
    new ConfigFixGenerator()
  ];

  async analyzeFailure(deploymentId: string): Promise<RecoveryPlan> {
    const logs = await this.getDeploymentLogs(deploymentId);
    const errors = await this.detectErrors(logs);
    
    const fixes = await Promise.all(
      errors.map(error => this.generateFix(error))
    );

    return {
      errors,
      fixes: fixes.filter(fix => fix.confidence > 0.8),
      estimatedSuccess: this.calculateSuccessRate(fixes)
    };
  }

  async executeFixes(plan: RecoveryPlan): Promise<RecoveryResult> {
    const results = [];
    
    for (const fix of plan.fixes) {
      try {
        await this.applyFix(fix);
        const testResult = await this.testFix();
        
        if (testResult.success) {
          results.push({ fix, success: true });
        } else {
          await this.revertFix(fix);
          results.push({ fix, success: false, error: testResult.error });
        }
      } catch (error) {
        results.push({ fix, success: false, error });
      }
    }

    return { results, overallSuccess: results.every(r => r.success) };
  }
}
```

## 🗄️ Data Architecture

### Database Schema Design

```sql
-- Core Entities
Users
├── id (uuid, primary key)
├── email (varchar, unique)
├── name (varchar)
├── avatar_url (varchar)
├── role (enum: user, admin)
├── created_at (timestamp)
└── last_login_at (timestamp)

Projects
├── id (uuid, primary key)
├── user_id (uuid, foreign key)
├── name (varchar)
├── description (text)
├── type (enum: web, mobile, api, desktop)
├── status (enum: active, archived, draft)
├── github_url (varchar)
├── vercel_url (varchar)
├── created_at (timestamp)
└── updated_at (timestamp)

Conversations
├── id (uuid, primary key)
├── user_id (uuid, foreign key)
├── agent_id (varchar)
├── title (varchar)
├── context (jsonb)
├── created_at (timestamp)
└── updated_at (timestamp)

Messages
├── id (uuid, primary key)
├── conversation_id (uuid, foreign key)
├── content (text)
├── role (enum: user, assistant, system)
├── metadata (jsonb)
└── timestamp (timestamp)

Workflows
├── id (uuid, primary key)
├── user_id (uuid, foreign key)
├── project_id (uuid, foreign key)
├── name (varchar)
├── description (text)
├── definition (jsonb)
├── status (enum: draft, active, paused)
├── created_at (timestamp)
└── updated_at (timestamp)

Deployments
├── id (uuid, primary key)
├── project_id (uuid, foreign key)
├── vercel_deployment_id (varchar)
├── status (enum: building, ready, error, canceled)
├── url (varchar)
├── commit_sha (varchar)
├── commit_message (text)
├── build_logs (jsonb)
├── created_at (timestamp)
└── ready_at (timestamp)
```

### Data Access Layer

```typescript
// Repository Pattern Implementation
interface Repository<T> {
  create(data: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findMany(where: Partial<T>): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

class PrismaRepository<T> implements Repository<T> {
  constructor(private model: any) {}

  async create(data: Partial<T>): Promise<T> {
    return this.model.create({ data });
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  // ... other methods
}

// Service Layer
class ProjectService {
  constructor(
    private projectRepo: Repository<Project>,
    private deploymentRepo: Repository<Deployment>,
    private workflowRepo: Repository<Workflow>
  ) {}

  async createProject(userId: string, data: CreateProjectData): Promise<Project> {
    const project = await this.projectRepo.create({
      ...data,
      userId,
      status: 'draft'
    });

    // Initialize default workflows
    await this.initializeDefaultWorkflows(project.id);

    return project;
  }
}
```

## 🔐 Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  JWT Strategy         │  OAuth Providers    │  Session Mgmt │
│  • Access Tokens      │  • Google          │  • Redis Store │
│  • Refresh Tokens     │  • GitHub          │  • CSRF Token  │
│  • Token Validation   │  • Custom Login    │  • Secure Cookies│
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  AUTHORIZATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  RBAC System          │  Resource ACL       │  API Rate Limiting│
│  • User Roles         │  • Project Access   │  • User Limits   │
│  • Permissions        │  • Workflow Sharing │  • IP Filtering  │
│  • Role Inheritance   │  • Agent Access     │  • DDoS Protection│
└─────────────────────────────────────────────────────────────┘
```

### Security Implementation

```typescript
// JWT Implementation
class JWTService {
  private readonly secret: string;
  private readonly accessTokenTTL = '15m';
  private readonly refreshTokenTTL = '7d';

  async generateTokens(userId: string): Promise<TokenPair> {
    const payload = { userId, type: 'access' };
    
    const accessToken = jwt.sign(payload, this.secret, {
      expiresIn: this.accessTokenTTL
    });

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      this.secret,
      { expiresIn: this.refreshTokenTTL }
    );

    // Store refresh token in Redis
    await this.storeRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }

  async validateToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, this.secret) as JWTPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }
}

// Authorization Middleware
class AuthorizationMiddleware {
  async checkPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const user = await this.userService.findById(userId);
    const permissions = await this.getPermissions(user.role);
    
    return permissions.some(p => 
      p.resource === resource && p.actions.includes(action)
    );
  }

  async checkResourceAccess(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    // Check if user owns the resource or has shared access
    switch (resourceType) {
      case 'project':
        return this.checkProjectAccess(userId, resourceId);
      case 'workflow':
        return this.checkWorkflowAccess(userId, resourceId);
      default:
        return false;
    }
  }
}
```

## 🚀 Performance Architecture

### Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHING LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│  Browser Cache       │  CDN Cache         │  Application Cache│
│  • Static Assets     │  • Images          │  • Redis Cache    │
│  • API Responses     │  • CSS/JS          │  • Memory Cache   │
│  • User Preferences  │  • API Responses   │  • Query Cache    │
└─────────────────────────────────────────────────────────────┘
```

### Performance Optimization

```typescript
// Cache Implementation
class CacheService {
  private redis: Redis;
  private memoryCache: LRUCache<string, any>;

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    let value = this.memoryCache.get(key);
    if (value) return value;

    // Try Redis cache
    const redisValue = await this.redis.get(key);
    if (redisValue) {
      value = JSON.parse(redisValue);
      this.memoryCache.set(key, value);
      return value;
    }

    return null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    // Set in both caches
    this.memoryCache.set(key, value);
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}

// Database Query Optimization
class OptimizedRepository {
  @Cacheable(300) // 5 minutes
  async findPopularProjects(): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { status: 'active' },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true, avatar: true } },
        _count: { select: { workflows: true } }
      }
    });
  }

  @CacheInvalidate(['user:*', 'project:*'])
  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data
    });
  }
}
```

## 🔌 Plugin Architecture

### Plugin System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    PLUGIN MANAGER                           │
├─────────────────────────────────────────────────────────────┤
│  • Plugin Discovery                                         │
│  • Lifecycle Management                                     │
│  • Dependency Resolution                                    │
│  • Security Sandbox                                         │
│  • API Registration                                         │
└─────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   AGENT     │     │    NODE     │     │   THEME     │
│  PLUGINS    │     │  PLUGINS    │     │  PLUGINS    │
└─────────────┘     └─────────────┘     └─────────────┘
        ▼                       ▼                       ▼
┌─────────────┐     ┌─────────────┐
│ INTEGRATION │     │ MIDDLEWARE  │
│  PLUGINS    │     │  PLUGINS    │
└─────────────┘     └─────────────┘
```

### Plugin Implementation

```typescript
// Plugin Interface
interface Plugin {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly dependencies: string[];
  
  initialize(context: PluginContext): Promise<void>;
  destroy(): Promise<void>;
}

// Example: Custom Agent Plugin
class CustomAgentPlugin implements Plugin {
  readonly id = 'custom-marketing-agent';
  readonly name = 'Marketing Agent';
  readonly version = '1.0.0';
  readonly dependencies = ['@nex7/agent-sdk'];

  async initialize(context: PluginContext): Promise<void> {
    const agent = new MarketingAgent({
      personality: 'creative, persuasive, data-driven',
      tools: ['analytics', 'social-media', 'content-generation']
    });

    context.registerAgent(agent);
  }
}

// Plugin Manager
class PluginManager {
  private plugins = new Map<string, Plugin>();
  private dependencyGraph = new Map<string, string[]>();

  async loadPlugin(pluginPath: string): Promise<void> {
    const plugin = await import(pluginPath);
    
    // Validate plugin
    this.validatePlugin(plugin);
    
    // Resolve dependencies
    await this.resolveDependencies(plugin);
    
    // Initialize plugin in sandbox
    await this.initializePlugin(plugin);
    
    this.plugins.set(plugin.id, plugin);
  }

  private async initializePlugin(plugin: Plugin): Promise<void> {
    const sandbox = new PluginSandbox(plugin.id);
    const context = new PluginContext(sandbox);
    
    await plugin.initialize(context);
  }
}
```

## 📊 Monitoring and Observability

### Observability Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    METRICS & LOGS                           │
├─────────────────────────────────────────────────────────────┤
│  Application Metrics  │  System Metrics    │  Business Metrics│
│  • Request Rate       │  • CPU Usage       │  • User Activity │
│  • Response Time      │  • Memory Usage    │  • AI Usage      │
│  • Error Rate         │  • Disk I/O        │  • Feature Usage │
│  • Queue Depth        │  • Network I/O     │  • Revenue       │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   TRACING & DEBUGGING                       │
├─────────────────────────────────────────────────────────────┤
│  Distributed Tracing  │  Error Tracking    │  Performance    │
│  • Request Flow       │  • Error Reports   │  • Core Vitals  │
│  • Service Deps       │  • Stack Traces    │  • Load Times   │
│  • Bottlenecks        │  • User Impact     │  • Bundle Size  │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// Metrics Collection
class MetricsCollector {
  private prometheus: PrometheusRegistry;
  
  constructor() {
    this.setupMetrics();
  }

  private setupMetrics(): void {
    // HTTP request metrics
    this.httpRequestDuration = new prometheus.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code']
    });

    // Agent usage metrics
    this.agentRequestCount = new prometheus.Counter({
      name: 'agent_requests_total',
      help: 'Total number of agent requests',
      labelNames: ['agent_type', 'user_id']
    });

    // Workflow execution metrics
    this.workflowExecutionDuration = new prometheus.Histogram({
      name: 'workflow_execution_duration_seconds',
      help: 'Workflow execution duration in seconds',
      labelNames: ['workflow_type', 'status']
    });
  }

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);
  }
}

// Distributed Tracing
class TracingService {
  private tracer: Tracer;

  async traceWorkflowExecution(workflowId: string, execution: () => Promise<any>): Promise<any> {
    const span = this.tracer.startSpan('workflow_execution', {
      tags: {
        'workflow.id': workflowId,
        'operation.name': 'execute_workflow'
      }
    });

    try {
      const result = await execution();
      span.setTag('success', true);
      return result;
    } catch (error) {
      span.setTag('success', false);
      span.setTag('error', true);
      span.log({ event: 'error', message: error.message });
      throw error;
    } finally {
      span.finish();
    }
  }
}
```

## 🔄 Event-Driven Architecture

### Event System

```typescript
// Event Bus Implementation
class EventBus {
  private handlers = new Map<string, EventHandler[]>();

  on<T>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  async emit<T>(eventType: string, payload: T): Promise<void> {
    const handlers = this.handlers.get(eventType) || [];
    
    await Promise.all(
      handlers.map(handler => 
        this.executeHandler(handler, payload)
      )
    );
  }

  private async executeHandler<T>(handler: EventHandler<T>, payload: T): Promise<void> {
    try {
      await handler(payload);
    } catch (error) {
      console.error(`Error in event handler:`, error);
      // Could emit error event here
    }
  }
}

// Event-driven workflow
class WorkflowExecutor {
  constructor(private eventBus: EventBus) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.eventBus.on('workflow.started', this.handleWorkflowStarted.bind(this));
    this.eventBus.on('node.completed', this.handleNodeCompleted.bind(this));
    this.eventBus.on('workflow.completed', this.handleWorkflowCompleted.bind(this));
    this.eventBus.on('workflow.failed', this.handleWorkflowFailed.bind(this));
  }

  async executeWorkflow(workflow: Workflow): Promise<ExecutionResult> {
    await this.eventBus.emit('workflow.started', { workflowId: workflow.id });

    try {
      const result = await this.processNodes(workflow.nodes);
      await this.eventBus.emit('workflow.completed', { workflowId: workflow.id, result });
      return result;
    } catch (error) {
      await this.eventBus.emit('workflow.failed', { workflowId: workflow.id, error });
      throw error;
    }
  }
}
```

## 📋 Summary

NEX7's architecture is designed for:

1. **Scalability**: Microservices-inspired design with clear separation of concerns
2. **Maintainability**: Modular components with well-defined interfaces
3. **Extensibility**: Plugin system for custom functionality
4. **Reliability**: Auto-recovery, error handling, and monitoring
5. **Performance**: Caching, optimization, and efficient data access
6. **Security**: Multi-layered security with authentication, authorization, and data protection

The architecture supports the core vision of NEX7 as an AI-first, visual development platform that makes complex automation accessible through an intuitive interface while maintaining enterprise-grade reliability and performance.

---

**Want to contribute to the architecture?** Check out our [Contributing Guidelines](./contributing.md) and [Development Setup](../getting-started/environment-setup.md).