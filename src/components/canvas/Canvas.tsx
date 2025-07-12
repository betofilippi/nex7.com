'use client';

import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  Connection,
  Edge,
  ConnectionMode,
  MarkerType,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import GitHubNode from './GitHubNode';
import ClaudeNode from './ClaudeNode';
import VercelNode from './VercelNode';
import ConditionalNode from './ConditionalNode';
import {
  VercelDeployNode,
  VercelProjectNode,
  VercelDomainNode,
  DatabaseNode,
  ApiNode,
  LoopNode,
  TransformNode,
  ScheduleNode,
  WebhookNode,
  EmailNode,
  NotificationNode,
  AITaskNode
} from './nodes';
import CustomEdge from './CustomEdge';
import NodePalette from './NodePalette';
import NodeEditor from './NodeEditor';
import { CanvasContext } from './CanvasContext';
import { CustomNode, CustomEdge as CustomEdgeType } from './types';
import { WorkflowExecutor } from '../../lib/workflow-engine/executor';
import { WorkflowVersionControl } from '../../lib/version-control/workflow-versions';
import { RealTimeCollaboration } from '../../lib/collaboration/real-time-collaboration';
import { Play, Save, History, Users, Download, Upload } from 'lucide-react';

const nodeTypes = {
  github: GitHubNode,
  claude: ClaudeNode,
  vercel: VercelNode,
  'vercel-deploy': VercelDeployNode,
  'vercel-project': VercelProjectNode,
  'vercel-domain': VercelDomainNode,
  conditional: ConditionalNode,
  database: DatabaseNode,
  api: ApiNode,
  loop: LoopNode,
  transform: TransformNode,
  schedule: ScheduleNode,
  webhook: WebhookNode,
  email: EmailNode,
  notification: NotificationNode,
  'ai-task': AITaskNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const initialNodes: CustomNode[] = [
  {
    id: '1',
    type: 'github',
    position: { x: 250, y: 100 },
    data: { label: 'GitHub Webhook', description: 'Listens for push events' },
  },
  {
    id: '2',
    type: 'claude',
    position: { x: 500, y: 200 },
    data: { label: 'Code Review', description: 'AI-powered code analysis' },
  },
];

const initialEdges: CustomEdgeType[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'custom',
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#6b7280',
    },
  },
];

const CanvasFlow: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [workflowId] = useState('workflow-' + Date.now());
  const { project } = useReactFlow();
  
  // Initialize services
  const versionControl = WorkflowVersionControl.getInstance();
  const collaboration = RealTimeCollaboration.getInstance();

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const newEdge = {
        ...params,
        type: 'custom',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#6b7280',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = project({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: CustomNode = {
        id: `${Date.now()}`,
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  const onNodeDuplicate = useCallback(
    (nodeId: string) => {
      const nodeToDuplicate = nodes.find((node) => node.id === nodeId);
      if (nodeToDuplicate) {
        const newNode: CustomNode = {
          ...nodeToDuplicate,
          id: `${Date.now()}`,
          position: {
            x: nodeToDuplicate.position.x + 50,
            y: nodeToDuplicate.position.y + 50,
          },
        };
        setNodes((nds) => nds.concat(newNode));
      }
    },
    [nodes, setNodes]
  );

  const onNodeEdit = useCallback(
    (nodeId: string) => {
      const nodeToEdit = nodes.find((node) => node.id === nodeId);
      if (nodeToEdit) {
        setSelectedNode(nodeToEdit);
        setIsEditorOpen(true);
      }
    },
    [nodes]
  );

  const onNodeSave = useCallback(
    (updatedNode: CustomNode) => {
      setNodes((nds) =>
        nds.map((node) => (node.id === updatedNode.id ? updatedNode : node))
      );
    },
    [setNodes]
  );

  // Workflow execution
  const executeWorkflow = useCallback(async () => {
    if (isExecuting) return;
    
    setIsExecuting(true);
    setExecutionProgress(0);
    
    try {
      const executor = new WorkflowExecutor(
        workflowId,
        nodes,
        edges,
        {
          onProgress: (nodeId, status) => {
            console.log(`Node ${nodeId}: ${status}`);
            setExecutionProgress((prev) => prev + (100 / nodes.length));
          },
          onError: (nodeId, error) => {
            console.error(`Error in node ${nodeId}:`, error);
          }
        }
      );
      
      const result = await executor.execute();
      console.log('Workflow completed:', result);
    } catch (error) {
      console.error('Workflow execution failed:', error);
    } finally {
      setIsExecuting(false);
      setExecutionProgress(0);
    }
  }, [workflowId, nodes, edges, isExecuting]);

  // Save workflow version
  const saveVersion = useCallback(() => {
    try {
      const version = versionControl.createVersion(
        workflowId,
        nodes,
        edges,
        'Auto-save version',
        'user'
      );
      console.log('Version saved:', version);
    } catch (error) {
      console.error('Failed to save version:', error);
    }
  }, [workflowId, nodes, edges, versionControl]);

  // Load workflow template
  const loadTemplate = useCallback((templateNodes: CustomNode[], templateEdges: CustomEdgeType[]) => {
    setNodes(templateNodes);
    setEdges(templateEdges);
  }, [setNodes, setEdges]);

  // Export workflow
  const exportWorkflow = useCallback(() => {
    const workflowData = {
      nodes,
      edges,
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(workflowData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${workflowId}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }, [nodes, edges, workflowId]);

  // Import workflow
  const importWorkflow = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflowData = JSON.parse(e.target?.result as string);
        if (workflowData.nodes && workflowData.edges) {
          setNodes(workflowData.nodes);
          setEdges(workflowData.edges);
        }
      } catch (error) {
        console.error('Failed to import workflow:', error);
      }
    };
    reader.readAsText(file);
  }, [setNodes, setEdges]);

  const contextValue = {
    onEdit: onNodeEdit,
    onDelete: onNodeDelete,
    onDuplicate: onNodeDuplicate,
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      <div className="h-screen w-full bg-gray-950" ref={reactFlowWrapper}>
        {/* Workflow Toolbar */}
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <button
            onClick={executeWorkflow}
            disabled={isExecuting || nodes.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            {isExecuting ? 'Running...' : 'Execute'}
          </button>
          
          <button
            onClick={saveVersion}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Version
          </button>
          
          <button
            onClick={exportWorkflow}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <label className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={importWorkflow}
              className="hidden"
            />
          </label>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg text-sm">
            <History className="w-4 h-4" />
            <span>v1.0.0</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg text-sm">
            <Users className="w-4 h-4" />
            <span>1 user</span>
          </div>
        </div>

        {/* Execution Progress */}
        {isExecuting && (
          <div className="absolute top-20 left-4 right-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Executing Workflow</span>
                <span className="text-sm text-gray-500">{Math.round(executionProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${executionProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-gray-950"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#374151"
          />
          <Controls className="bg-gray-800 border-gray-700" />
          <MiniMap
            className="bg-gray-800 border-gray-700"
            nodeColor={(node) => {
              switch (node.type) {
                case 'github':
                  return '#374151';
                case 'claude':
                case 'ai-task':
                  return '#f97316';
                case 'vercel':
                case 'vercel-deploy':
                case 'vercel-project':
                case 'vercel-domain':
                  return '#000000';
                case 'conditional':
                case 'api':
                  return '#3b82f6';
                case 'database':
                  return '#059669';
                case 'loop':
                  return '#d97706';
                case 'transform':
                  return '#7c3aed';
                case 'schedule':
                  return '#be185d';
                case 'webhook':
                  return '#dc2626';
                case 'email':
                  return '#0891b2';
                case 'notification':
                  return '#ea580c';
                default:
                  return '#6b7280';
              }
            }}
          />
        </ReactFlow>
        <NodePalette onDragStart={onDragStart} />
        <NodeEditor
          node={selectedNode}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={onNodeSave}
        />
      </div>
    </CanvasContext.Provider>
  );
};

const Canvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CanvasFlow />
    </ReactFlowProvider>
  );
};

export default Canvas;