'use client';

import React, { useContext } from 'react';
import { NodeProps } from 'reactflow';
import DraggableNode from './DraggableNode';
import { ClaudeNodeData } from './types';
import { CanvasContext } from './CanvasContext';

const ClaudeNode: React.FC<NodeProps<ClaudeNodeData>> = (props) => {
  const context = useContext(CanvasContext);
  
  return (
    <DraggableNode
      {...props}
      nodeType="claude"
      onEdit={context?.onEdit}
      onDelete={context?.onDelete}
      onDuplicate={context?.onDuplicate}
    />
  );
};

export default ClaudeNode;