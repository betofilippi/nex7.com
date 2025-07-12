import { Node, Edge } from 'reactflow';

export type NodeType = 
  | 'github' 
  | 'claude' 
  | 'vercel' 
  | 'vercel-deploy' 
  | 'vercel-project' 
  | 'vercel-domain' 
  | 'conditional'
  | 'database'
  | 'api'
  | 'loop'
  | 'transform'
  | 'schedule'
  | 'webhook'
  | 'email'
  | 'notification'
  | 'ai-task';

export interface BaseNodeData {
  label: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface GitHubNodeData extends BaseNodeData {
  repository?: string;
  branch?: string;
  webhook?: string;
}

export interface ClaudeNodeData extends BaseNodeData {
  model?: string;
  prompt?: string;
  temperature?: number;
}

export interface VercelNodeData extends BaseNodeData {
  projectName?: string;
  domain?: string;
  environment?: 'production' | 'preview' | 'development';
  deploymentId?: string;
  status?: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  url?: string;
  branch?: string;
  framework?: string;
  repository?: string;
  verified?: boolean;
  ssl?: boolean;
  redirect?: string;
  id?: string;
}

export interface ConditionalNodeData extends BaseNodeData {
  condition?: string;
  trueOutput?: string;
  falseOutput?: string;
}

export interface DatabaseNodeData extends BaseNodeData {
  connectionString?: string;
  query?: string;
  database?: 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'sqlite';
  operation?: 'select' | 'insert' | 'update' | 'delete' | 'custom';
}

export interface ApiNodeData extends BaseNodeData {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string;
  authentication?: 'none' | 'bearer' | 'basic' | 'api-key';
  authToken?: string;
}

export interface LoopNodeData extends BaseNodeData {
  loopType?: 'for' | 'while' | 'forEach';
  iterations?: number;
  condition?: string;
  collection?: string;
  currentItem?: string;
  index?: string;
}

export interface TransformNodeData extends BaseNodeData {
  transformType?: 'map' | 'filter' | 'reduce' | 'sort' | 'custom';
  transformFunction?: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
}

export interface ScheduleNodeData extends BaseNodeData {
  cronExpression?: string;
  timezone?: string;
  enabled?: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface WebhookNodeData extends BaseNodeData {
  webhookUrl?: string;
  secret?: string;
  events?: string[];
  method?: 'POST' | 'GET';
  headers?: Record<string, string>;
}

export interface EmailNodeData extends BaseNodeData {
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
  template?: string;
  attachments?: string[];
  smtpConfig?: {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user?: string;
      pass?: string;
    };
  };
}

export interface NotificationNodeData extends BaseNodeData {
  channel?: 'push' | 'sms' | 'slack' | 'discord' | 'webhook';
  recipients?: string[];
  title?: string;
  message?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export interface AITaskNodeData extends BaseNodeData {
  model?: 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku' | 'gpt-4' | 'gpt-3.5-turbo';
  task?: string;
  context?: string;
  parameters?: Record<string, any>;
  maxTokens?: number;
  temperature?: number;
}

export type CustomNodeData = 
  | GitHubNodeData 
  | ClaudeNodeData 
  | VercelNodeData 
  | ConditionalNodeData
  | DatabaseNodeData
  | ApiNodeData
  | LoopNodeData
  | TransformNodeData
  | ScheduleNodeData
  | WebhookNodeData
  | EmailNodeData
  | NotificationNodeData
  | AITaskNodeData;

export type CustomNode = Node<CustomNodeData>;
export type CustomEdge = Edge;

export interface CanvasState {
  nodes: CustomNode[];
  edges: CustomEdge[];
  selectedNode: string | null;
  zoom: number;
}

// Workflow Execution Types
export interface WorkflowExecutionContext {
  workflowId: string;
  executionId: string;
  startTime: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  variables: Record<string, any>;
  results: Record<string, any>;
  errors: Array<{
    nodeId: string;
    error: string;
    timestamp: Date;
  }>;
}

export interface NodeExecutionResult {
  nodeId: string;
  status: 'success' | 'failure' | 'skipped';
  output: any;
  error?: string;
  startTime: Date;
  endTime: Date;
  retries?: number;
}

// Version Control Types
export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: string;
  nodes: CustomNode[];
  edges: CustomEdge[];
  description?: string;
  createdBy: string;
  createdAt: Date;
  tags?: string[];
}

// Collaboration Types
export interface CollaboratorCursor {
  userId: string;
  userName: string;
  position: { x: number; y: number };
  color: string;
  lastUpdate: Date;
}

export interface NodeComment {
  id: string;
  nodeId: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: Date;
  resolved?: boolean;
}

// Workflow Template Types
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: CustomNode[];
  edges: CustomEdge[];
  variables?: Record<string, any>;
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  downloads?: number;
  rating?: number;
}