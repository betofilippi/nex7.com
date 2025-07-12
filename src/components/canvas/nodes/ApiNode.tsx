import React from 'react';
import { Handle, Position } from 'reactflow';
import { Globe, Lock, Unlock, Send } from 'lucide-react';
import { ApiNodeData } from '../types';

interface ApiNodeProps {
  data: ApiNodeData;
  selected: boolean;
}

export const ApiNode: React.FC<ApiNodeProps> = ({ data, selected }) => {
  const getMethodColor = () => {
    switch (data.method) {
      case 'GET':
        return 'bg-green-500';
      case 'POST':
        return 'bg-blue-500';
      case 'PUT':
        return 'bg-yellow-500';
      case 'DELETE':
        return 'bg-red-500';
      case 'PATCH':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAuthIcon = () => {
    if (data.authentication === 'none') {
      return <Unlock className="w-3 h-3" />;
    }
    return <Lock className="w-3 h-3" />;
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
      
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-1 rounded-t-lg">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 text-white">
            <Globe className="w-5 h-5" />
            <span className="font-semibold text-sm">{data.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {data.authentication && (
              <div className="flex items-center gap-1 bg-white/20 rounded px-2 py-1">
                {getAuthIcon()}
                <span className="text-xs text-white capitalize">{data.authentication}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          {data.method && (
            <span className={`${getMethodColor()} text-white text-xs font-bold px-2 py-1 rounded`}>
              {data.method}
            </span>
          )}
          {data.url && (
            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
              <code className="text-xs text-gray-700 dark:text-gray-300 break-all">
                {data.url}
              </code>
            </div>
          )}
        </div>

        {data.headers && Object.keys(data.headers).length > 0 && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Headers:</span>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 space-y-1">
              {Object.entries(data.headers).map(([key, value]) => (
                <div key={key} className="text-xs">
                  <span className="text-gray-600 dark:text-gray-400">{key}:</span>{' '}
                  <span className="text-gray-800 dark:text-gray-200">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.body && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Body:</span>
            <div className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 max-h-20 overflow-y-auto">
              <code className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {data.body}
              </code>
            </div>
          </div>
        )}

        {data.authToken && (
          <div className="flex items-center gap-2 text-xs">
            <Lock className="w-3 h-3 text-gray-500" />
            <span className="text-gray-500 dark:text-gray-400">Auth configured</span>
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