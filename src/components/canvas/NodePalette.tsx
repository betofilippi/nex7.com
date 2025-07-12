'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Github, Bot, Triangle, GitBranch } from 'lucide-react';

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const nodes = [
    {
      type: 'github',
      label: 'GitHub',
      icon: <Github className="w-6 h-6" />,
      color: 'from-gray-700 to-gray-800',
    },
    {
      type: 'claude',
      label: 'Claude AI',
      icon: <Bot className="w-6 h-6" />,
      color: 'from-orange-500 to-orange-600',
    },
    {
      type: 'vercel',
      label: 'Vercel',
      icon: <Triangle className="w-6 h-6" />,
      color: 'from-black to-gray-900',
    },
    {
      type: 'conditional',
      label: 'Conditional',
      icon: <GitBranch className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600',
    },
  ];

  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-800 z-10">
      <h3 className="text-white text-sm font-medium mb-3">Nodes</h3>
      <div className="space-y-2">
        {nodes.map((node) => (
          <motion.div
            key={node.type}
            draggable
            onDragStart={(event) => onDragStart(event as unknown as React.DragEvent, node.type)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`cursor-move bg-gradient-to-r ${node.color} text-white p-3 rounded-lg flex items-center gap-2 hover:shadow-lg transition-shadow`}
          >
            {node.icon}
            <span className="text-sm font-medium">{node.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette;