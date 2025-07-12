import { CustomNode, CustomEdge } from '@/components/canvas/types';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  type: 'error';
  message: string;
}

export interface ValidationWarning {
  nodeId?: string;
  edgeId?: string;
  type: 'warning';
  message: string;
}

export class WorkflowValidator {
  static validate(nodes: CustomNode[], edges: CustomEdge[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for empty workflow
    if (nodes.length === 0) {
      errors.push({
        type: 'error',
        message: 'Workflow must contain at least one node'
      });
    }

    // Check for disconnected nodes
    const connectedNodes = new Set<string>();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    nodes.forEach(node => {
      if (!connectedNodes.has(node.id) && nodes.length > 1) {
        warnings.push({
          nodeId: node.id,
          type: 'warning',
          message: `Node "${node.data.label}" is not connected to any other nodes`
        });
      }
    });

    // Check for cycles
    if (this.hasCycles(nodes, edges)) {
      errors.push({
        type: 'error',
        message: 'Workflow contains circular dependencies'
      });
    }

    // Check for missing required fields
    nodes.forEach(node => {
      const missingFields = this.checkRequiredFields(node);
      missingFields.forEach(field => {
        errors.push({
          nodeId: node.id,
          type: 'error',
          message: `Node "${node.data.label}" is missing required field: ${field}`
        });
      });
    });

    // Check for invalid edges
    edges.forEach(edge => {
      const sourceExists = nodes.some(n => n.id === edge.source);
      const targetExists = nodes.some(n => n.id === edge.target);

      if (!sourceExists || !targetExists) {
        errors.push({
          edgeId: edge.id,
          type: 'error',
          message: 'Edge references non-existent node'
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static hasCycles(nodes: CustomNode[], edges: CustomEdge[]): boolean {
    const adjacencyList = new Map<string, string[]>();
    const visited = new Map<string, 'white' | 'gray' | 'black'>();

    // Initialize
    nodes.forEach(node => {
      adjacencyList.set(node.id, []);
      visited.set(node.id, 'white');
    });

    // Build adjacency list
    edges.forEach(edge => {
      const neighbors = adjacencyList.get(edge.source) || [];
      neighbors.push(edge.target);
      adjacencyList.set(edge.source, neighbors);
    });

    // DFS to detect cycles
    const dfs = (nodeId: string): boolean => {
      visited.set(nodeId, 'gray');

      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        const color = visited.get(neighbor);
        if (color === 'gray') {
          return true; // Cycle detected
        }
        if (color === 'white' && dfs(neighbor)) {
          return true;
        }
      }

      visited.set(nodeId, 'black');
      return false;
    };

    // Check all nodes
    for (const node of nodes) {
      if (visited.get(node.id) === 'white') {
        if (dfs(node.id)) {
          return true;
        }
      }
    }

    return false;
  }

  private static checkRequiredFields(node: CustomNode): string[] {
    const missingFields: string[] = [];
    const data = node.data as any;

    switch (node.type) {
      case 'database':
        if (!data.connectionString) missingFields.push('connectionString');
        if (!data.query) missingFields.push('query');
        break;
      case 'api':
        if (!data.url) missingFields.push('url');
        if (!data.method) missingFields.push('method');
        break;
      case 'loop':
        if (!data.loopType) missingFields.push('loopType');
        if (data.loopType === 'for' && !data.iterations) {
          missingFields.push('iterations');
        }
        break;
      case 'email':
        if (!data.to || data.to.length === 0) missingFields.push('to');
        if (!data.subject) missingFields.push('subject');
        if (!data.body && !data.template) missingFields.push('body or template');
        break;
      case 'schedule':
        if (!data.cronExpression) missingFields.push('cronExpression');
        break;
      case 'webhook':
        if (!data.webhookUrl) missingFields.push('webhookUrl');
        break;
      case 'notification':
        if (!data.channel) missingFields.push('channel');
        if (!data.recipients || data.recipients.length === 0) {
          missingFields.push('recipients');
        }
        break;
      case 'ai-task':
        if (!data.model) missingFields.push('model');
        if (!data.task) missingFields.push('task');
        break;
    }

    return missingFields;
  }
}