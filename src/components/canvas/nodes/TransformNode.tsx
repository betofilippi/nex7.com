import React from 'react';
import { Handle, Position } from 'reactflow';
import { Shuffle, Filter, Layers, ArrowUpDown, Code } from 'lucide-react';
import { TransformNodeData } from '../types';

interface TransformNodeProps {
  data: TransformNodeData;
  selected: boolean;
}

export const TransformNode: React.FC<TransformNodeProps> = ({ data, selected }) => {
  const getTransformIcon = () => {
    switch (data.transformType) {
      case 'map':
        return <Shuffle className="w-5 h-5" />;
      case 'filter':
        return <Filter className="w-5 h-5" />;
      case 'reduce':
        return <Layers className="w-5 h-5" />;
      case 'sort':
        return <ArrowUpDown className="w-5 h-5" />;
      case 'custom':
        return <Code className="w-5 h-5" />;
      default:
        return <Shuffle className="w-5 h-5" />;
    }
  };

  const getTransformColor = () => {
    switch (data.transformType) {
      case 'map':
        return 'from-cyan-500 to-blue-600';
      case 'filter':
        return 'from-purple-500 to-pink-600';
      case 'reduce':
        return 'from-green-500 to-teal-600';
      case 'sort':
        return 'from-yellow-500 to-orange-600';
      case 'custom':
        return 'from-gray-500 to-gray-700';
      default:
        return 'from-indigo-500 to-purple-600';
    }
  };

  return (
    <div
      className={`
        min-w-[280px] rounded-lg shadow-lg border-2 transition-all duration-200
        ${selected ? 'border-blue-500 shadow-blue-500/20' : 'border-gray-200'}
        bg-white dark:bg-gray-800
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      
      <div className={`bg-gradient-to-r ${getTransformColor()} p-1 rounded-t-lg`}>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 text-white">
            {getTransformIcon()}
            <span className="font-semibold text-sm">{data.label}</span>
          </div>
          {data.transformType && (
            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded capitalize">
              {data.transformType}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {data.transformFunction && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Transform Function:</span>
            <div className="bg-gray-900 dark:bg-black rounded p-3">
              <code className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                {data.transformFunction}
              </code>
            </div>
          </div>
        )}

        {data.inputSchema && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Input Schema:</span>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 border border-blue-200 dark:border-blue-800">
                <pre className="text-xs text-blue-700 dark:text-blue-300">
                  {JSON.stringify(data.inputSchema, null, 2)}
                </pre>
              </div>
            </div>
            
            {data.outputSchema && (
              <div className="space-y-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Output Schema:</span>
                <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 border border-green-200 dark:border-green-800">
                  <pre className="text-xs text-green-700 dark:text-green-300">
                    {JSON.stringify(data.outputSchema, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-400">In</span>
            </div>
            <div className="flex-1 border-t-2 border-dashed border-gray-300 dark:border-gray-600"></div>
            {getTransformIcon()}
            <div className="flex-1 border-t-2 border-dashed border-gray-300 dark:border-gray-600"></div>
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-400">Out</span>
            </div>
          </div>
        </div>

        {data.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 italic">
            {data.description}
          </p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
    </div>
  );
};