'use client';

import React, { useContext } from 'react';
import { NodeProps } from 'reactflow';
import DraggableNode from './DraggableNode';
import { VercelNodeData } from './types';
import { CanvasContext } from './CanvasContext';

const VercelNode: React.FC<NodeProps<VercelNodeData>> = (props) => {
  const context = useContext(CanvasContext);
  
  return (
    <DraggableNode
      {...props}
      nodeType="vercel"
      onEdit={context?.onEdit}
      onDelete={context?.onDelete}
      onDuplicate={context?.onDuplicate}
    />
  );
};

export default VercelNode;