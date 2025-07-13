export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export async function getWorkflows(): Promise<Workflow[]> {
  return [];
}

export async function getWorkflowById(id: string): Promise<Workflow | null> {
  return null;
}

export async function createWorkflow(data: {
  name: string;
  description?: string;
}): Promise<Workflow> {
  return {
    id: Math.random().toString(36).substr(2, 9),
    name: data.name,
    description: data.description,
    nodes: [],
    edges: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
