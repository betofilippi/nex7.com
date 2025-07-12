'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Github, 
  Bot, 
  Triangle, 
  GitBranch, 
  Database, 
  Globe, 
  Repeat, 
  Shuffle, 
  Clock, 
  Webhook, 
  Mail, 
  Bell, 
  Brain 
} from 'lucide-react';

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const nodeCategories = [
    {
      title: 'Triggers',
      nodes: [
        {
          type: 'webhook',
          label: 'Webhook',
          icon: <Webhook className="w-5 h-5" />,
          color: 'from-pink-500 to-rose-600',
        },
        {
          type: 'schedule',
          label: 'Schedule',
          icon: <Clock className="w-5 h-5" />,
          color: 'from-violet-500 to-purple-600',
        },
      ]
    },
    {
      title: 'Data Sources',
      nodes: [
        {
          type: 'database',
          label: 'Database',
          icon: <Database className="w-5 h-5" />,
          color: 'from-emerald-500 to-green-600',
        },
        {
          type: 'api',
          label: 'API Call',
          icon: <Globe className="w-5 h-5" />,
          color: 'from-blue-500 to-indigo-600',
        },
        {
          type: 'github',
          label: 'GitHub',
          icon: <Github className="w-5 h-5" />,
          color: 'from-gray-700 to-gray-800',
        },
      ]
    },
    {
      title: 'Processing',
      nodes: [
        {
          type: 'transform',
          label: 'Transform',
          icon: <Shuffle className="w-5 h-5" />,
          color: 'from-purple-500 to-violet-600',
        },
        {
          type: 'loop',
          label: 'Loop',
          icon: <Repeat className="w-5 h-5" />,
          color: 'from-amber-500 to-orange-600',
        },
        {
          type: 'conditional',
          label: 'Conditional',
          icon: <GitBranch className="w-5 h-5" />,
          color: 'from-blue-500 to-cyan-600',
        },
      ]
    },
    {
      title: 'AI & Automation',
      nodes: [
        {
          type: 'ai-task',
          label: 'AI Task',
          icon: <Brain className="w-5 h-5" />,
          color: 'from-orange-500 to-amber-600',
        },
        {
          type: 'claude',
          label: 'Claude AI',
          icon: <Bot className="w-5 h-5" />,
          color: 'from-orange-500 to-red-600',
        },
      ]
    },
    {
      title: 'Outputs',
      nodes: [
        {
          type: 'email',
          label: 'Email',
          icon: <Mail className="w-5 h-5" />,
          color: 'from-cyan-500 to-blue-600',
        },
        {
          type: 'notification',
          label: 'Notification',
          icon: <Bell className="w-5 h-5" />,
          color: 'from-orange-500 to-red-600',
        },
        {
          type: 'vercel',
          label: 'Vercel',
          icon: <Triangle className="w-5 h-5" />,
          color: 'from-black to-gray-900',
        },
      ]
    }
  ];

  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-800 z-10 max-h-[80vh] overflow-y-auto">
      <h3 className="text-white text-sm font-medium mb-3">Node Palette</h3>
      <div className="space-y-4 w-48">
        {nodeCategories.map((category) => (
          <div key={category.title}>
            <h4 className="text-gray-300 text-xs font-medium mb-2 uppercase tracking-wide">
              {category.title}
            </h4>
            <div className="space-y-1">
              {category.nodes.map((node) => (
                <motion.div
                  key={node.type}
                  draggable
                  onDragStart={(event) => onDragStart(event as unknown as React.DragEvent, node.type)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`cursor-move bg-gradient-to-r ${node.color} text-white p-2 rounded-md flex items-center gap-2 hover:shadow-lg transition-all text-sm`}
                >
                  {node.icon}
                  <span className="font-medium">{node.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette;