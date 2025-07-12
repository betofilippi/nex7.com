'use client';

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { MoreVertical, Edit2, Trash2, Copy } from 'lucide-react';
import { CustomNodeData } from './types';

interface DraggableNodeProps extends NodeProps<CustomNodeData> {
  nodeType: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

const DraggableNode: React.FC<DraggableNodeProps> = ({
  id,
  data,
  selected,
  nodeType,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const handleLabelSave = () => {
    setIsEditing(false);
    // Here you would typically update the node data in the parent component
  };

  const getNodeColor = () => {
    switch (nodeType) {
      case 'github':
        return 'from-gray-800 to-gray-900';
      case 'claude':
        return 'from-orange-500 to-orange-600';
      case 'vercel':
        return 'from-black to-gray-900';
      case 'conditional':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getIcon = () => {
    switch (nodeType) {
      case 'github':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        );
      case 'claude':
        return <span className="text-xl">🤖</span>;
      case 'vercel':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 22.525H0l12-21.05 12 21.05z"/>
          </svg>
        );
      case 'conditional':
        return <span className="text-xl">🔀</span>;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`relative bg-gradient-to-br ${getNodeColor()} text-white rounded-lg p-4 min-w-[200px] shadow-xl ${
        selected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900' : ''
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-400 border-2 border-white"
      />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getIcon()}
          {isEditing ? (
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleLabelSave}
              onKeyPress={(e) => e.key === 'Enter' && handleLabelSave()}
              className="bg-transparent border-b border-white outline-none text-sm font-medium"
              autoFocus
            />
          ) : (
            <h3 className="text-sm font-medium">{label}</h3>
          )}
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 z-50"
            >
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Label
              </button>
              <button
                onClick={() => {
                  onEdit?.(id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Properties
              </button>
              <button
                onClick={() => {
                  onDuplicate?.(id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <button
                onClick={() => {
                  onDelete?.(id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2 text-red-400"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </motion.div>
          )}
        </div>
      </div>
      
      {data.description && (
        <p className="text-xs text-white/80">{data.description}</p>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-400 border-2 border-white"
      />
    </motion.div>
  );
};

export default memo(DraggableNode);