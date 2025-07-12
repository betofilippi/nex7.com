import React from 'react';
import { Handle, Position } from 'reactflow';
import { Database, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { DatabaseNodeData } from '../types';

interface DatabaseNodeProps {
  data: DatabaseNodeData;
  selected: boolean;
}

export const DatabaseNode: React.FC<DatabaseNodeProps> = ({ data, selected }) => {
  const getOperationIcon = () => {
    switch (data.operation) {
      case 'select':
        return <Search className="w-3 h-3" />;
      case 'insert':
        return <Plus className="w-3 h-3" />;
      case 'update':
        return <Edit2 className="w-3 h-3" />;
      case 'delete':
        return <Trash2 className="w-3 h-3" />;
      default:
        return <Database className="w-3 h-3" />;
    }
  };

  const getDatabaseColor = () => {
    switch (data.database) {
      case 'postgresql':
        return 'from-blue-500 to-blue-600';
      case 'mysql':
        return 'from-orange-500 to-orange-600';
      case 'mongodb':
        return 'from-green-500 to-green-600';
      case 'redis':
        return 'from-red-500 to-red-600';
      case 'sqlite':
        return 'from-gray-500 to-gray-600';
      default:
        return 'from-purple-500 to-purple-600';
    }
  };

  return (
    <div
      className={`
        min-w-[250px] rounded-lg shadow-lg border-2 transition-all duration-200
        ${selected ? 'border-blue-500 shadow-blue-500/20' : 'border-gray-200'}
        bg-white dark:bg-gray-800
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      
      <div className={`p-1 bg-gradient-to-r ${getDatabaseColor()} rounded-t-lg`}>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 text-white">
            <Database className="w-5 h-5" />
            <span className="font-semibold text-sm">{data.label}</span>
          </div>
          {data.operation && (
            <div className="flex items-center gap-1 bg-white/20 rounded px-2 py-1">
              {getOperationIcon()}
              <span className="text-xs text-white capitalize">{data.operation}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {data.database && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Database:</span>
            <span className="font-medium capitalize">{data.database}</span>
          </div>
        )}

        {data.connectionString && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Connection:</span>
            <div className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
              <code className="text-xs text-gray-700 dark:text-gray-300 break-all">
                {data.connectionString.substring(0, 30)}...
              </code>
            </div>
          </div>
        )}

        {data.query && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Query:</span>
            <div className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 max-h-20 overflow-y-auto">
              <code className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {data.query}
              </code>
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