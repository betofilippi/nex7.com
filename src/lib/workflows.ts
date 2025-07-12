import { prisma } from './prisma';
import { Workflow as PrismaWorkflow, WorkflowNode as PrismaWorkflowNode, WorkflowEdge as PrismaWorkflowEdge } from '@prisma/client';

export interface Workflow {
  id: string;
  name: string;
  description?: string | null;
  userId: string;
  projectId?: string | null;
  isPublic: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}

export interface WorkflowNode {
  id: string;
  workflowId: string;
  type: string;
  position: { x: number; y: number };
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowEdge {
  id: string;
  workflowId: string;
  sourceId: string;
  targetId: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type: string;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

export async function createWorkflow(
  userId: string,
  name: string,
  description?: string,
  projectId?: string,
  isPublic: boolean = false,
  metadata?: any
): Promise<Workflow> {
  const workflow = await prisma.workflow.create({
    data: {
      name,
      description,
      userId,
      projectId,
      isPublic,
      metadata,
    }
  });
  
  return workflow;
}

export async function findWorkflowById(
  workflowId: string,
  userId?: string
): Promise<Workflow | null> {
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: workflowId,
      OR: [
        { userId },
        { isPublic: true }
      ].filter(Boolean)
    },
    include: {
      nodes: true,
      edges: true,
    }
  });
  
  return workflow;
}

export async function listUserWorkflows(
  userId: string,
  projectId?: string
): Promise<Workflow[]> {
  const workflows = await prisma.workflow.findMany({
    where: {
      userId,
      ...(projectId && { projectId })
    },
    orderBy: { updatedAt: 'desc' },
  });
  
  return workflows;
}

export async function updateWorkflow(
  workflowId: string,
  userId: string,
  updates: Partial<Workflow>
): Promise<Workflow | null> {
  try {
    const workflow = await prisma.workflow.update({
      where: {
        id: workflowId,
        userId,
      },
      data: {
        name: updates.name,
        description: updates.description,
        isPublic: updates.isPublic,
        metadata: updates.metadata,
      }
    });
    
    return workflow;
  } catch (error) {
    return null;
  }
}

export async function addWorkflowNode(
  workflowId: string,
  type: string,
  position: { x: number; y: number },
  data: any
): Promise<WorkflowNode> {
  const node = await prisma.workflowNode.create({
    data: {
      workflowId,
      type,
      position,
      data,
    }
  });
  
  return node;
}

export async function updateWorkflowNode(
  nodeId: string,
  updates: { position?: { x: number; y: number }; data?: any }
): Promise<WorkflowNode | null> {
  try {
    const node = await prisma.workflowNode.update({
      where: { id: nodeId },
      data: updates,
    });
    
    return node;
  } catch (error) {
    return null;
  }
}

export async function deleteWorkflowNode(nodeId: string): Promise<boolean> {
  try {
    await prisma.workflowNode.delete({
      where: { id: nodeId }
    });
    return true;
  } catch (error) {
    return false;
  }
}

export async function addWorkflowEdge(
  workflowId: string,
  sourceId: string,
  targetId: string,
  sourceHandle?: string,
  targetHandle?: string,
  type: string = 'default',
  data?: any
): Promise<WorkflowEdge> {
  const edge = await prisma.workflowEdge.create({
    data: {
      workflowId,
      sourceId,
      targetId,
      sourceHandle,
      targetHandle,
      type,
      data,
    }
  });
  
  return edge;
}

export async function deleteWorkflowEdge(edgeId: string): Promise<boolean> {
  try {
    await prisma.workflowEdge.delete({
      where: { id: edgeId }
    });
    return true;
  } catch (error) {
    return false;
  }
}

export async function saveWorkflowState(
  workflowId: string,
  userId: string,
  nodes: Omit<WorkflowNode, 'id' | 'workflowId' | 'createdAt' | 'updatedAt'>[],
  edges: Omit<WorkflowEdge, 'id' | 'workflowId' | 'createdAt' | 'updatedAt'>[]
): Promise<boolean> {
  try {
    // Start a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // Verify ownership
      const workflow = await tx.workflow.findFirst({
        where: {
          id: workflowId,
          userId,
        }
      });
      
      if (!workflow) throw new Error('Workflow not found or unauthorized');
      
      // Delete existing nodes and edges
      await tx.workflowEdge.deleteMany({
        where: { workflowId }
      });
      
      await tx.workflowNode.deleteMany({
        where: { workflowId }
      });
      
      // Create new nodes
      if (nodes.length > 0) {
        await tx.workflowNode.createMany({
          data: nodes.map(node => ({
            ...node,
            workflowId,
          }))
        });
      }
      
      // Create new edges
      if (edges.length > 0) {
        await tx.workflowEdge.createMany({
          data: edges.map(edge => ({
            ...edge,
            workflowId,
          }))
        });
      }
      
      // Update workflow timestamp
      await tx.workflow.update({
        where: { id: workflowId },
        data: { updatedAt: new Date() }
      });
    });
    
    return true;
  } catch (error) {
    console.error('Error saving workflow state:', error);
    return false;
  }
}