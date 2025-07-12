import { CustomNode, CustomEdge, WorkflowVersion } from '@/components/canvas/types';

export interface VersionDiff {
  nodesAdded: CustomNode[];
  nodesRemoved: CustomNode[];
  nodesModified: Array<{
    oldNode: CustomNode;
    newNode: CustomNode;
    changes: string[];
  }>;
  edgesAdded: CustomEdge[];
  edgesRemoved: CustomEdge[];
}

export interface MergeConflict {
  nodeId: string;
  type: 'node_modified' | 'node_deleted' | 'edge_conflict';
  baseVersion: any;
  currentVersion: any;
  incomingVersion: any;
  description: string;
}

export class WorkflowVersionControl {
  private static instance: WorkflowVersionControl;
  private versions: Map<string, WorkflowVersion[]> = new Map();

  static getInstance(): WorkflowVersionControl {
    if (!this.instance) {
      this.instance = new WorkflowVersionControl();
    }
    return this.instance;
  }

  /**
   * Create a new version of a workflow
   */
  createVersion(
    workflowId: string,
    nodes: CustomNode[],
    edges: CustomEdge[],
    description?: string,
    createdBy: string = 'user',
    tags?: string[]
  ): WorkflowVersion {
    const workflowVersions = this.versions.get(workflowId) || [];
    const latestVersion = workflowVersions[workflowVersions.length - 1];
    
    const newVersionNumber = latestVersion 
      ? this.incrementVersion(latestVersion.version)
      : '1.0.0';

    const newVersion: WorkflowVersion = {
      id: this.generateVersionId(),
      workflowId,
      version: newVersionNumber,
      nodes: this.deepClone(nodes),
      edges: this.deepClone(edges),
      description,
      createdBy,
      createdAt: new Date(),
      tags: tags || []
    };

    workflowVersions.push(newVersion);
    this.versions.set(workflowId, workflowVersions);

    return newVersion;
  }

  /**
   * Get all versions for a workflow
   */
  getVersions(workflowId: string): WorkflowVersion[] {
    return this.versions.get(workflowId) || [];
  }

  /**
   * Get a specific version
   */
  getVersion(workflowId: string, versionId: string): WorkflowVersion | undefined {
    const versions = this.versions.get(workflowId) || [];
    return versions.find(v => v.id === versionId);
  }

  /**
   * Get the latest version
   */
  getLatestVersion(workflowId: string): WorkflowVersion | undefined {
    const versions = this.versions.get(workflowId) || [];
    return versions[versions.length - 1];
  }

  /**
   * Compare two versions and return differences
   */
  compareVersions(
    workflowId: string,
    fromVersionId: string,
    toVersionId: string
  ): VersionDiff {
    const fromVersion = this.getVersion(workflowId, fromVersionId);
    const toVersion = this.getVersion(workflowId, toVersionId);

    if (!fromVersion || !toVersion) {
      throw new Error('Version not found');
    }

    return this.calculateDiff(fromVersion, toVersion);
  }

  /**
   * Rollback to a specific version
   */
  rollback(
    workflowId: string,
    targetVersionId: string,
    createdBy: string = 'user'
  ): WorkflowVersion {
    const targetVersion = this.getVersion(workflowId, targetVersionId);
    if (!targetVersion) {
      throw new Error('Target version not found');
    }

    // Create a new version with the content from the target version
    return this.createVersion(
      workflowId,
      targetVersion.nodes,
      targetVersion.edges,
      `Rollback to version ${targetVersion.version}`,
      createdBy,
      ['rollback']
    );
  }

  /**
   * Create a branch from a specific version
   */
  createBranch(
    workflowId: string,
    sourceVersionId: string,
    branchName: string,
    createdBy: string = 'user'
  ): string {
    const sourceVersion = this.getVersion(workflowId, sourceVersionId);
    if (!sourceVersion) {
      throw new Error('Source version not found');
    }

    const branchWorkflowId = `${workflowId}-${branchName}`;
    
    // Create the first version in the branch
    this.createVersion(
      branchWorkflowId,
      sourceVersion.nodes,
      sourceVersion.edges,
      `Branched from ${sourceVersion.version}`,
      createdBy,
      ['branch', branchName]
    );

    return branchWorkflowId;
  }

  /**
   * Merge a branch back into the main workflow
   */
  mergeBranch(
    mainWorkflowId: string,
    branchWorkflowId: string,
    createdBy: string = 'user'
  ): { mergedVersion?: WorkflowVersion; conflicts: MergeConflict[] } {
    const mainLatest = this.getLatestVersion(mainWorkflowId);
    const branchLatest = this.getLatestVersion(branchWorkflowId);

    if (!mainLatest || !branchLatest) {
      throw new Error('Cannot find latest versions for merge');
    }

    // Detect merge conflicts
    const conflicts = this.detectMergeConflicts(mainLatest, branchLatest);

    if (conflicts.length > 0) {
      return { conflicts };
    }

    // Perform automatic merge
    const mergedNodes = this.mergeNodes(mainLatest.nodes, branchLatest.nodes);
    const mergedEdges = this.mergeEdges(mainLatest.edges, branchLatest.edges);

    const mergedVersion = this.createVersion(
      mainWorkflowId,
      mergedNodes,
      mergedEdges,
      `Merged branch ${branchWorkflowId}`,
      createdBy,
      ['merge']
    );

    return { mergedVersion, conflicts: [] };
  }

  /**
   * Tag a specific version
   */
  tagVersion(
    workflowId: string,
    versionId: string,
    tag: string
  ): boolean {
    const version = this.getVersion(workflowId, versionId);
    if (!version) {
      return false;
    }

    if (!version.tags) {
      version.tags = [];
    }

    if (!version.tags.includes(tag)) {
      version.tags.push(tag);
    }

    return true;
  }

  /**
   * Get versions by tag
   */
  getVersionsByTag(workflowId: string, tag: string): WorkflowVersion[] {
    const versions = this.versions.get(workflowId) || [];
    return versions.filter(v => v.tags && v.tags.includes(tag));
  }

  private calculateDiff(fromVersion: WorkflowVersion, toVersion: WorkflowVersion): VersionDiff {
    const diff: VersionDiff = {
      nodesAdded: [],
      nodesRemoved: [],
      nodesModified: [],
      edgesAdded: [],
      edgesRemoved: []
    };

    // Compare nodes
    const fromNodeMap = new Map(fromVersion.nodes.map(n => [n.id, n]));
    const toNodeMap = new Map(toVersion.nodes.map(n => [n.id, n]));

    // Find added nodes
    for (const [id, node] of toNodeMap) {
      if (!fromNodeMap.has(id)) {
        diff.nodesAdded.push(node);
      }
    }

    // Find removed and modified nodes
    for (const [id, oldNode] of fromNodeMap) {
      const newNode = toNodeMap.get(id);
      if (!newNode) {
        diff.nodesRemoved.push(oldNode);
      } else if (!this.nodesEqual(oldNode, newNode)) {
        diff.nodesModified.push({
          oldNode,
          newNode,
          changes: this.getNodeChanges(oldNode, newNode)
        });
      }
    }

    // Compare edges
    const fromEdgeSet = new Set(fromVersion.edges.map(e => `${e.source}-${e.target}`));
    const toEdgeSet = new Set(toVersion.edges.map(e => `${e.source}-${e.target}`));

    // Find added edges
    toVersion.edges.forEach(edge => {
      const edgeKey = `${edge.source}-${edge.target}`;
      if (!fromEdgeSet.has(edgeKey)) {
        diff.edgesAdded.push(edge);
      }
    });

    // Find removed edges
    fromVersion.edges.forEach(edge => {
      const edgeKey = `${edge.source}-${edge.target}`;
      if (!toEdgeSet.has(edgeKey)) {
        diff.edgesRemoved.push(edge);
      }
    });

    return diff;
  }

  private detectMergeConflicts(
    mainVersion: WorkflowVersion,
    branchVersion: WorkflowVersion
  ): MergeConflict[] {
    const conflicts: MergeConflict[] = [];

    // For now, we'll implement simple conflict detection
    // In a real implementation, you'd need a common base version to compare against

    const mainNodeMap = new Map(mainVersion.nodes.map(n => [n.id, n]));
    const branchNodeMap = new Map(branchVersion.nodes.map(n => [n.id, n]));

    // Check for nodes that exist in both but are different
    for (const [id, branchNode] of branchNodeMap) {
      const mainNode = mainNodeMap.get(id);
      if (mainNode && !this.nodesEqual(mainNode, branchNode)) {
        conflicts.push({
          nodeId: id,
          type: 'node_modified',
          baseVersion: null, // Would need common ancestor
          currentVersion: mainNode,
          incomingVersion: branchNode,
          description: `Node ${id} was modified in both versions`
        });
      }
    }

    return conflicts;
  }

  private mergeNodes(mainNodes: CustomNode[], branchNodes: CustomNode[]): CustomNode[] {
    const nodeMap = new Map(mainNodes.map(n => [n.id, n]));

    // Add or update nodes from branch
    branchNodes.forEach(branchNode => {
      nodeMap.set(branchNode.id, branchNode);
    });

    return Array.from(nodeMap.values());
  }

  private mergeEdges(mainEdges: CustomEdge[], branchEdges: CustomEdge[]): CustomEdge[] {
    const edgeSet = new Set(mainEdges.map(e => `${e.source}-${e.target}`));
    const mergedEdges = [...mainEdges];

    // Add edges from branch that don't exist in main
    branchEdges.forEach(branchEdge => {
      const edgeKey = `${branchEdge.source}-${branchEdge.target}`;
      if (!edgeSet.has(edgeKey)) {
        mergedEdges.push(branchEdge);
      }
    });

    return mergedEdges;
  }

  private nodesEqual(node1: CustomNode, node2: CustomNode): boolean {
    return JSON.stringify(node1) === JSON.stringify(node2);
  }

  private getNodeChanges(oldNode: CustomNode, newNode: CustomNode): string[] {
    const changes: string[] = [];

    if (oldNode.position.x !== newNode.position.x || oldNode.position.y !== newNode.position.y) {
      changes.push('position');
    }

    if (JSON.stringify(oldNode.data) !== JSON.stringify(newNode.data)) {
      changes.push('data');
    }

    if (oldNode.type !== newNode.type) {
      changes.push('type');
    }

    return changes;
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    parts[2]++; // Increment patch version
    return parts.join('.');
  }

  private generateVersionId(): string {
    return `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}