'use client';

import React, { useContext } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import DraggableNode from './DraggableNode';
import { ConditionalNodeData } from './types';
import { CanvasContext } from './CanvasContext';

const ConditionalNode: React.FC<NodeProps<ConditionalNodeData>> = (props) => {
  const context = useContext(CanvasContext);
  
  return (
    <div className="relative">
      <DraggableNode
        {...props}
        nodeType="conditional"
        onEdit={context?.onEdit}
        onDelete={context?.onDelete}
        onDuplicate={context?.onDuplicate}
      />
      {/* Additional handles for true/false paths */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '30%' }}
        className="w-3 h-3 bg-green-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '70%' }}
        className="w-3 h-3 bg-red-400 border-2 border-white"
      />
    </div>
  );
};

export default ConditionalNode;