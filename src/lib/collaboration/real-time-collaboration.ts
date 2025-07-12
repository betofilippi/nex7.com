import { CustomNode, CustomEdge, CollaboratorCursor, NodeComment } from '@/components/canvas/types';

export interface CollaborationEvent {
  type: 'cursor_move' | 'node_update' | 'edge_update' | 'node_add' | 'node_delete' | 'edge_add' | 'edge_delete' | 'comment_add' | 'comment_resolve';
  userId: string;
  timestamp: Date;
  data: any;
}

export interface CollaborationSession {
  workflowId: string;
  participants: Map<string, CollaboratorInfo>;
  nodes: Map<string, CustomNode>;
  edges: Map<string, CustomEdge>;
  comments: Map<string, NodeComment>;
  cursors: Map<string, CollaboratorCursor>;
  lastActivity: Date;
}

export interface CollaboratorInfo {
  userId: string;
  userName: string;
  email: string;
  avatar?: string;
  color: string;
  permissions: CollaboratorPermissions;
  joinedAt: Date;
  lastSeen: Date;
}

export interface CollaboratorPermissions {
  canEdit: boolean;
  canComment: boolean;
  canExecute: boolean;
  canShare: boolean;
  canManageVersions: boolean;
}

export class RealTimeCollaboration {
  private static instance: RealTimeCollaboration;
  private sessions: Map<string, CollaborationSession> = new Map();
  private eventListeners: Map<string, Array<(event: CollaborationEvent) => void>> = new Map();
  private conflictResolver: ConflictResolver;

  static getInstance(): RealTimeCollaboration {
    if (!this.instance) {
      this.instance = new RealTimeCollaboration();
    }
    return this.instance;
  }

  constructor() {
    this.conflictResolver = new ConflictResolver();
  }

  /**
   * Join a collaboration session
   */
  joinSession(
    workflowId: string,
    user: CollaboratorInfo,
    initialNodes: CustomNode[] = [],
    initialEdges: CustomEdge[] = []
  ): CollaborationSession {
    let session = this.sessions.get(workflowId);

    if (!session) {
      session = {
        workflowId,
        participants: new Map(),
        nodes: new Map(initialNodes.map(n => [n.id, n])),
        edges: new Map(initialEdges.map(e => [e.id!, e])),
        comments: new Map(),
        cursors: new Map(),
        lastActivity: new Date()
      };
      this.sessions.set(workflowId, session);
    }

    user.joinedAt = new Date();
    user.lastSeen = new Date();
    session.participants.set(user.userId, user);

    this.broadcastEvent(workflowId, {
      type: 'cursor_move',
      userId: user.userId,
      timestamp: new Date(),
      data: { type: 'user_joined', user }
    });

    return session;
  }

  /**
   * Leave a collaboration session
   */
  leaveSession(workflowId: string, userId: string): void {
    const session = this.sessions.get(workflowId);
    if (!session) return;

    session.participants.delete(userId);
    session.cursors.delete(userId);

    this.broadcastEvent(workflowId, {
      type: 'cursor_move',
      userId,
      timestamp: new Date(),
      data: { type: 'user_left' }
    });

    // Clean up empty sessions
    if (session.participants.size === 0) {
      this.sessions.delete(workflowId);
    }
  }

  /**
   * Update cursor position
   */
  updateCursor(
    workflowId: string,
    userId: string,
    position: { x: number; y: number }
  ): void {
    const session = this.sessions.get(workflowId);
    if (!session) return;

    const user = session.participants.get(userId);
    if (!user) return;

    const cursor: CollaboratorCursor = {
      userId,
      userName: user.userName,
      position,
      color: user.color,
      lastUpdate: new Date()
    };

    session.cursors.set(userId, cursor);
    user.lastSeen = new Date();

    this.broadcastEvent(workflowId, {
      type: 'cursor_move',
      userId,
      timestamp: new Date(),
      data: { cursor }
    });
  }

  /**
   * Update a node with conflict resolution
   */
  updateNode(
    workflowId: string,
    userId: string,
    updatedNode: CustomNode
  ): { success: boolean; conflicts?: any[] } {
    const session = this.sessions.get(workflowId);
    if (!session) {
      return { success: false };
    }

    const user = session.participants.get(userId);
    if (!user || !user.permissions.canEdit) {
      return { success: false };
    }

    const currentNode = session.nodes.get(updatedNode.id);
    
    if (currentNode) {
      // Check for conflicts
      const conflicts = this.conflictResolver.detectNodeConflicts(
        currentNode,
        updatedNode,
        userId
      );

      if (conflicts.length > 0) {
        return { success: false, conflicts };
      }
    }

    // Apply update
    session.nodes.set(updatedNode.id, updatedNode);
    session.lastActivity = new Date();
    user.lastSeen = new Date();

    this.broadcastEvent(workflowId, {
      type: 'node_update',
      userId,
      timestamp: new Date(),
      data: { node: updatedNode }
    });

    return { success: true };
  }

  /**
   * Add a new node
   */
  addNode(
    workflowId: string,
    userId: string,
    newNode: CustomNode
  ): { success: boolean } {
    const session = this.sessions.get(workflowId);
    if (!session) return { success: false };

    const user = session.participants.get(userId);
    if (!user || !user.permissions.canEdit) {
      return { success: false };
    }

    session.nodes.set(newNode.id, newNode);
    session.lastActivity = new Date();
    user.lastSeen = new Date();

    this.broadcastEvent(workflowId, {
      type: 'node_add',
      userId,
      timestamp: new Date(),
      data: { node: newNode }
    });

    return { success: true };
  }

  /**
   * Delete a node
   */
  deleteNode(
    workflowId: string,
    userId: string,
    nodeId: string
  ): { success: boolean } {
    const session = this.sessions.get(workflowId);
    if (!session) return { success: false };

    const user = session.participants.get(userId);
    if (!user || !user.permissions.canEdit) {
      return { success: false };
    }

    session.nodes.delete(nodeId);
    
    // Remove related edges
    const edgesToRemove: string[] = [];
    session.edges.forEach((edge, edgeId) => {
      if (edge.source === nodeId || edge.target === nodeId) {
        edgesToRemove.push(edgeId);
      }
    });
    
    edgesToRemove.forEach(edgeId => session.edges.delete(edgeId));

    session.lastActivity = new Date();
    user.lastSeen = new Date();

    this.broadcastEvent(workflowId, {
      type: 'node_delete',
      userId,
      timestamp: new Date(),
      data: { nodeId, removedEdges: edgesToRemove }
    });

    return { success: true };
  }

  /**
   * Add a comment to a node
   */
  addComment(
    workflowId: string,
    userId: string,
    nodeId: string,
    comment: string
  ): { success: boolean; comment?: NodeComment } {
    const session = this.sessions.get(workflowId);
    if (!session) return { success: false };

    const user = session.participants.get(userId);
    if (!user || !user.permissions.canComment) {
      return { success: false };
    }

    const newComment: NodeComment = {
      id: this.generateId(),
      nodeId,
      userId,
      userName: user.userName,
      comment,
      createdAt: new Date(),
      resolved: false
    };

    session.comments.set(newComment.id, newComment);
    session.lastActivity = new Date();
    user.lastSeen = new Date();

    this.broadcastEvent(workflowId, {
      type: 'comment_add',
      userId,
      timestamp: new Date(),
      data: { comment: newComment }
    });

    return { success: true, comment: newComment };
  }

  /**
   * Resolve a comment
   */
  resolveComment(
    workflowId: string,
    userId: string,
    commentId: string
  ): { success: boolean } {
    const session = this.sessions.get(workflowId);
    if (!session) return { success: false };

    const user = session.participants.get(userId);
    if (!user || !user.permissions.canComment) {
      return { success: false };
    }

    const comment = session.comments.get(commentId);
    if (!comment) return { success: false };

    comment.resolved = true;
    session.lastActivity = new Date();
    user.lastSeen = new Date();

    this.broadcastEvent(workflowId, {
      type: 'comment_resolve',
      userId,
      timestamp: new Date(),
      data: { commentId }
    });

    return { success: true };
  }

  /**
   * Get session state
   */
  getSessionState(workflowId: string): CollaborationSession | undefined {
    return this.sessions.get(workflowId);
  }

  /**
   * Subscribe to collaboration events
   */
  subscribe(
    workflowId: string,
    listener: (event: CollaborationEvent) => void
  ): () => void {
    const listeners = this.eventListeners.get(workflowId) || [];
    listeners.push(listener);
    this.eventListeners.set(workflowId, listeners);

    // Return unsubscribe function
    return () => {
      const currentListeners = this.eventListeners.get(workflowId) || [];
      const index = currentListeners.indexOf(listener);
      if (index > -1) {
        currentListeners.splice(index, 1);
      }
    };
  }

  private broadcastEvent(workflowId: string, event: CollaborationEvent): void {
    const listeners = this.eventListeners.get(workflowId) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in collaboration event listener:', error);
      }
    });
  }

  private generateId(): string {
    return `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class ConflictResolver {
  detectNodeConflicts(
    currentNode: CustomNode,
    incomingNode: CustomNode,
    userId: string
  ): any[] {
    const conflicts: any[] = [];

    // Check if nodes are significantly different
    if (this.hasSignificantChanges(currentNode, incomingNode)) {
      conflicts.push({
        type: 'simultaneous_edit',
        nodeId: incomingNode.id,
        description: 'Node was modified by another user',
        currentVersion: currentNode,
        incomingVersion: incomingNode,
        userId
      });
    }

    return conflicts;
  }

  private hasSignificantChanges(node1: CustomNode, node2: CustomNode): boolean {
    // Simple comparison - in production you'd want more sophisticated conflict detection
    return JSON.stringify(node1.data) !== JSON.stringify(node2.data) ||
           node1.position.x !== node2.position.x ||
           node1.position.y !== node2.position.y;
  }
}