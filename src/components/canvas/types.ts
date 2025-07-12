import { Node, Edge } from 'reactflow';

export type NodeType = 'github' | 'claude' | 'vercel' | 'vercel-deploy' | 'vercel-project' | 'vercel-domain' | 'conditional';

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

export type CustomNodeData = GitHubNodeData | ClaudeNodeData | VercelNodeData | ConditionalNodeData;

export type CustomNode = Node<CustomNodeData>;
export type CustomEdge = Edge;

export interface CanvasState {
  nodes: CustomNode[];
  edges: CustomEdge[];
  selectedNode: string | null;
  zoom: number;
}