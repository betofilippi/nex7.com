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
import VercelDeployNode from './nodes/VercelDeployNode';
import VercelProjectNode from './nodes/VercelProjectNode';
import VercelDomainNode from './nodes/VercelDomainNode';
import CustomEdge from './CustomEdge';
import NodePalette from './NodePalette';
import NodeEditor from './NodeEditor';
import { CanvasContext } from './CanvasContext';
import { CustomNode, CustomEdge as CustomEdgeType } from './types';

const nodeTypes = {
  github: GitHubNode,
  claude: ClaudeNode,
  vercel: VercelNode,
  'vercel-deploy': VercelDeployNode,
  'vercel-project': VercelProjectNode,
  'vercel-domain': VercelDomainNode,
  conditional: ConditionalNode,
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
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { project } = useReactFlow();

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

  const contextValue = {
    onEdit: onNodeEdit,
    onDelete: onNodeDelete,
    onDuplicate: onNodeDuplicate,
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      <div className="h-screen w-full bg-gray-950" ref={reactFlowWrapper}>
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
                  return '#f97316';
                case 'vercel':
                case 'vercel-deploy':
                case 'vercel-project':
                case 'vercel-domain':
                  return '#000000';
                case 'conditional':
                  return '#3b82f6';
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