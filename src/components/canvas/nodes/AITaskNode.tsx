import React from 'react';
import { Handle, Position } from 'reactflow';
import { Brain, Sparkles, Settings, Zap } from 'lucide-react';
import { AITaskNodeData } from '../types';

interface AITaskNodeProps {
  data: AITaskNodeData;
  selected: boolean;
}

export const AITaskNode: React.FC<AITaskNodeProps> = ({ data, selected }) => {
  const getModelIcon = () => {
    if (data.model?.includes('claude')) {
      return <Sparkles className="w-5 h-5" />;
    } else if (data.model?.includes('gpt')) {
      return <Zap className="w-5 h-5" />;
    }
    return <Brain className="w-5 h-5" />;
  };

  const getModelColor = () => {
    if (data.model?.includes('claude')) {
      return 'from-orange-500 to-amber-600';
    } else if (data.model?.includes('gpt')) {
      return 'from-green-500 to-emerald-600';
    }
    return 'from-purple-500 to-indigo-600';
  };

  const formatModelName = (model: string) => {
    const names: Record<string, string> = {
      'claude-3-opus': 'Claude 3 Opus',
      'claude-3-sonnet': 'Claude 3 Sonnet',
      'claude-3-haiku': 'Claude 3 Haiku',
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo'
    };
    return names[model] || model;
  };

  return (
    <div
      className={`
        min-w-[300px] rounded-lg shadow-lg border-2 transition-all duration-200
        ${selected ? 'border-blue-500 shadow-blue-500/20' : 'border-gray-200'}
        bg-white dark:bg-gray-800
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      
      <div className={`bg-gradient-to-r ${getModelColor()} p-1 rounded-t-lg`}>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 text-white">
            {getModelIcon()}
            <span className="font-semibold text-sm">{data.label}</span>
          </div>
          {data.model && (
            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded">
              {formatModelName(data.model)}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {data.task && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                AI Task
              </span>
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300 whitespace-pre-wrap">
              {data.task}
            </p>
          </div>
        )}

        {data.context && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Context:</span>
            <div className="bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 max-h-20 overflow-y-auto">
              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {data.context}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs">
          {data.temperature !== undefined && (
            <div className="flex items-center gap-2">
              <Settings className="w-3 h-3 text-gray-500" />
              <span className="text-gray-500 dark:text-gray-400">Temp:</span>
              <span className="font-medium">{data.temperature}</span>
            </div>
          )}
          
          {data.maxTokens && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Max tokens:</span>
              <span className="font-medium">{data.maxTokens}</span>
            </div>
          )}
        </div>

        {data.parameters && Object.keys(data.parameters).length > 0 && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Parameters:</span>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
              <pre className="text-xs text-gray-700 dark:text-gray-300">
                {JSON.stringify(data.parameters, null, 2)}
              </pre>
            </div>
          </div>
        )}

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