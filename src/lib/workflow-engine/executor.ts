import { CustomNode, CustomEdge, WorkflowExecutionContext, NodeExecutionResult } from '@/components/canvas/types';

export interface ExecutionOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  parallel?: boolean;
  onProgress?: (nodeId: string, status: string) => void;
  onError?: (nodeId: string, error: Error) => void;
}

export class WorkflowExecutor {
  private context: WorkflowExecutionContext;
  private nodes: CustomNode[];
  private edges: CustomEdge[];
  private options: ExecutionOptions;
  private abortController: AbortController;
  private executionQueue: string[] = [];
  private executedNodes: Set<string> = new Set();
  private nodeResults: Map<string, NodeExecutionResult> = new Map();

  constructor(
    workflowId: string,
    nodes: CustomNode[],
    edges: CustomEdge[],
    options: ExecutionOptions = {}
  ) {
    this.nodes = nodes;
    this.edges = edges;
    this.options = {
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 300000, // 5 minutes default
      parallel: false,
      ...options
    };
    this.abortController = new AbortController();
    
    this.context = {
      workflowId,
      executionId: this.generateExecutionId(),
      startTime: new Date(),
      status: 'pending',
      variables: {},
      results: {},
      errors: []
    };
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async execute(variables: Record<string, any> = {}): Promise<WorkflowExecutionContext> {
    this.context.variables = variables;
    this.context.status = 'running';
    
    try {
      // Build execution order
      this.buildExecutionQueue();
      
      // Execute nodes
      if (this.options.parallel) {
        await this.executeParallel();
      } else {
        await this.executeSequential();
      }
      
      this.context.status = 'completed';
    } catch (error) {
      this.context.status = 'failed';
      this.context.errors.push({
        nodeId: 'workflow',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
      throw error;
    }
    
    return this.context;
  }

  cancel(): void {
    this.abortController.abort();
    this.context.status = 'cancelled';
  }

  private buildExecutionQueue(): void {
    // Topological sort to determine execution order
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();
    
    // Initialize
    this.nodes.forEach(node => {
      inDegree.set(node.id, 0);
      adjacencyList.set(node.id, []);
    });
    
    // Build graph
    this.edges.forEach(edge => {
      const targetCount = inDegree.get(edge.target) || 0;
      inDegree.set(edge.target, targetCount + 1);
      
      const sourceList = adjacencyList.get(edge.source) || [];
      sourceList.push(edge.target);
      adjacencyList.set(edge.source, sourceList);
    });
    
    // Find nodes with no dependencies
    const queue: string[] = [];
    inDegree.forEach((count, nodeId) => {
      if (count === 0) {
        queue.push(nodeId);
      }
    });
    
    // Process queue
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      this.executionQueue.push(nodeId);
      
      const neighbors = adjacencyList.get(nodeId) || [];
      neighbors.forEach(neighbor => {
        const count = inDegree.get(neighbor) || 0;
        inDegree.set(neighbor, count - 1);
        
        if (count - 1 === 0) {
          queue.push(neighbor);
        }
      });
    }
  }

  private async executeSequential(): Promise<void> {
    for (const nodeId of this.executionQueue) {
      if (this.abortController.signal.aborted) {
        throw new Error('Execution cancelled');
      }
      
      await this.executeNode(nodeId);
    }
  }

  private async executeParallel(): Promise<void> {
    const executionGroups = this.groupNodesForParallelExecution();
    
    for (const group of executionGroups) {
      if (this.abortController.signal.aborted) {
        throw new Error('Execution cancelled');
      }
      
      await Promise.all(
        group.map(nodeId => this.executeNode(nodeId))
      );
    }
  }

  private groupNodesForParallelExecution(): string[][] {
    const groups: string[][] = [];
    const visited = new Set<string>();
    const currentGroup: string[] = [];
    
    for (const nodeId of this.executionQueue) {
      const dependencies = this.getNodeDependencies(nodeId);
      const canExecute = dependencies.every(dep => this.executedNodes.has(dep));
      
      if (canExecute) {
        currentGroup.push(nodeId);
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
          currentGroup.length = 0;
        }
        currentGroup.push(nodeId);
      }
    }
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  }

  private getNodeDependencies(nodeId: string): string[] {
    return this.edges
      .filter(edge => edge.target === nodeId)
      .map(edge => edge.source);
  }

  private async executeNode(nodeId: string): Promise<void> {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    
    const startTime = new Date();
    let retries = 0;
    let lastError: Error | undefined;
    
    this.options.onProgress?.(nodeId, 'started');
    
    while (retries <= this.options.maxRetries!) {
      try {
        const result = await this.executeNodeWithTimeout(node);
        
        this.nodeResults.set(nodeId, {
          nodeId,
          status: 'success',
          output: result,
          startTime,
          endTime: new Date(),
          retries
        });
        
        this.context.results[nodeId] = result;
        this.executedNodes.add(nodeId);
        this.options.onProgress?.(nodeId, 'completed');
        
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        retries++;
        
        if (retries <= this.options.maxRetries!) {
          await this.delay(this.options.retryDelay! * retries);
        }
      }
    }
    
    // All retries failed
    this.nodeResults.set(nodeId, {
      nodeId,
      status: 'failure',
      output: null,
      error: lastError?.message,
      startTime,
      endTime: new Date(),
      retries
    });
    
    this.context.errors.push({
      nodeId,
      error: lastError?.message || 'Unknown error',
      timestamp: new Date()
    });
    
    this.options.onError?.(nodeId, lastError!);
    this.options.onProgress?.(nodeId, 'failed');
    
    throw lastError;
  }

  private async executeNodeWithTimeout(node: CustomNode): Promise<any> {
    return Promise.race([
      this.executeNodeHandler(node),
      this.createTimeout(this.options.timeout!)
    ]);
  }

  private async executeNodeHandler(node: CustomNode): Promise<any> {
    // Get input data from connected nodes
    const inputData = this.getNodeInputData(node.id);
    
    switch (node.type) {
      case 'database':
        return this.executeDatabaseNode(node, inputData);
      case 'api':
        return this.executeApiNode(node, inputData);
      case 'loop':
        return this.executeLoopNode(node, inputData);
      case 'transform':
        return this.executeTransformNode(node, inputData);
      case 'schedule':
        return this.executeScheduleNode(node, inputData);
      case 'webhook':
        return this.executeWebhookNode(node, inputData);
      case 'email':
        return this.executeEmailNode(node, inputData);
      case 'notification':
        return this.executeNotificationNode(node, inputData);
      case 'ai-task':
        return this.executeAITaskNode(node, inputData);
      case 'conditional':
        return this.executeConditionalNode(node, inputData);
      default:
        // For other node types, just pass through the input
        return inputData;
    }
  }

  private getNodeInputData(nodeId: string): any {
    const inputEdges = this.edges.filter(edge => edge.target === nodeId);
    
    if (inputEdges.length === 0) {
      return this.context.variables;
    }
    
    if (inputEdges.length === 1) {
      const sourceNodeId = inputEdges[0].source;
      return this.context.results[sourceNodeId];
    }
    
    // Multiple inputs - combine them
    const combinedInput: Record<string, any> = {};
    inputEdges.forEach(edge => {
      const sourceNodeId = edge.source;
      combinedInput[sourceNodeId] = this.context.results[sourceNodeId];
    });
    
    return combinedInput;
  }

  // Node execution handlers
  private async executeDatabaseNode(node: CustomNode, input: any): Promise<any> {
    // Simulate database query execution
    const data = node.data as any;
    console.log(`Executing database query: ${data.query}`);
    
    // In a real implementation, this would connect to the database and execute the query
    return {
      rows: [],
      rowCount: 0,
      query: data.query,
      database: data.database
    };
  }

  private async executeApiNode(node: CustomNode, input: any): Promise<any> {
    const data = node.data as any;
    
    // In a real implementation, this would make an HTTP request
    const response = await fetch(data.url, {
      method: data.method || 'GET',
      headers: data.headers || {},
      body: data.body ? JSON.stringify(data.body) : undefined,
      signal: this.abortController.signal
    });
    
    return response.json();
  }

  private async executeLoopNode(node: CustomNode, input: any): Promise<any> {
    const data = node.data as any;
    const results: any[] = [];
    
    if (data.loopType === 'for' && data.iterations) {
      for (let i = 0; i < data.iterations; i++) {
        // Execute loop body nodes
        results.push({ index: i, input });
      }
    } else if (data.loopType === 'forEach' && Array.isArray(input)) {
      for (let i = 0; i < input.length; i++) {
        results.push({ index: i, item: input[i] });
      }
    }
    
    return results;
  }

  private async executeTransformNode(node: CustomNode, input: any): Promise<any> {
    const data = node.data as any;
    
    if (data.transformType === 'map' && Array.isArray(input)) {
      // In a real implementation, this would apply the transform function
      return input.map((item: any) => ({ transformed: item }));
    } else if (data.transformType === 'filter' && Array.isArray(input)) {
      return input.filter((item: any) => true); // Apply actual filter logic
    } else if (data.transformType === 'reduce' && Array.isArray(input)) {
      return input.reduce((acc: any, item: any) => acc, {});
    }
    
    return input;
  }

  private async executeScheduleNode(node: CustomNode, input: any): Promise<any> {
    const data = node.data as any;
    
    // In a real implementation, this would schedule the task
    return {
      scheduled: true,
      cronExpression: data.cronExpression,
      nextRun: new Date()
    };
  }

  private async executeWebhookNode(node: CustomNode, input: any): Promise<any> {
    const data = node.data as any;
    
    // In a real implementation, this would register a webhook listener
    return {
      webhookRegistered: true,
      url: data.webhookUrl,
      events: data.events
    };
  }

  private async executeEmailNode(node: CustomNode, input: any): Promise<any> {
    const data = node.data as any;
    
    // In a real implementation, this would send an email
    return {
      sent: true,
      to: data.to,
      subject: data.subject,
      timestamp: new Date()
    };
  }

  private async executeNotificationNode(node: CustomNode, input: any): Promise<any> {
    const data = node.data as any;
    
    // In a real implementation, this would send notifications
    return {
      sent: true,
      channel: data.channel,
      recipients: data.recipients,
      timestamp: new Date()
    };
  }

  private async executeAITaskNode(node: CustomNode, input: any): Promise<any> {
    const data = node.data as any;
    
    // In a real implementation, this would call the AI API
    return {
      response: `AI response for task: ${data.task}`,
      model: data.model,
      timestamp: new Date()
    };
  }

  private async executeConditionalNode(node: CustomNode, input: any): Promise<any> {
    const data = node.data as any;
    
    // Simple condition evaluation
    // In a real implementation, this would properly evaluate the condition
    const conditionMet = Boolean(data.condition);
    
    return {
      conditionMet,
      output: conditionMet ? data.trueOutput : data.falseOutput
    };
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Execution timeout after ${ms}ms`));
      }, ms);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Getters for execution state
  getContext(): WorkflowExecutionContext {
    return this.context;
  }

  getNodeResult(nodeId: string): NodeExecutionResult | undefined {
    return this.nodeResults.get(nodeId);
  }

  getProgress(): number {
    return (this.executedNodes.size / this.nodes.length) * 100;
  }
}