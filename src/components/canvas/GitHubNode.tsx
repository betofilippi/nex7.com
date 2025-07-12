'use client';

import React, { useContext } from 'react';
import { NodeProps } from 'reactflow';
import DraggableNode from './DraggableNode';
import { GitHubNodeData } from './types';
import { CanvasContext } from './CanvasContext';

const GitHubNode: React.FC<NodeProps<GitHubNodeData>> = (props) => {
  const context = useContext(CanvasContext);
  
  return (
    <DraggableNode
      {...props}
      nodeType="github"
      onEdit={context?.onEdit}
      onDelete={context?.onDelete}
      onDuplicate={context?.onDuplicate}
    />
  );
};

export default GitHubNode;