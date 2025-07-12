import React from 'react';
import { Handle, Position } from 'reactflow';
import { Bell, MessageSquare, Hash, Webhook, Smartphone, AlertCircle } from 'lucide-react';
import { NotificationNodeData } from '../types';

interface NotificationNodeProps {
  data: NotificationNodeData;
  selected: boolean;
}

export const NotificationNode: React.FC<NotificationNodeProps> = ({ data, selected }) => {
  const getChannelIcon = () => {
    switch (data.channel) {
      case 'push':
        return <Smartphone className="w-5 h-5" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5" />;
      case 'slack':
        return <Hash className="w-5 h-5" />;
      case 'discord':
        return <Hash className="w-5 h-5" />;
      case 'webhook':
        return <Webhook className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getChannelColor = () => {
    switch (data.channel) {
      case 'push':
        return 'from-blue-500 to-cyan-600';
      case 'sms':
        return 'from-green-500 to-emerald-600';
      case 'slack':
        return 'from-purple-500 to-pink-600';
      case 'discord':
        return 'from-indigo-500 to-purple-600';
      case 'webhook':
        return 'from-orange-500 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getPriorityColor = () => {
    switch (data.priority) {
      case 'low':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'normal':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
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
      
      <div className={`bg-gradient-to-r ${getChannelColor()} p-1 rounded-t-lg`}>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 text-white">
            {getChannelIcon()}
            <span className="font-semibold text-sm">{data.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {data.channel && (
              <span className="bg-white/20 text-white text-xs px-2 py-1 rounded capitalize">
                {data.channel}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {data.priority && (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Priority:</span>
            <span className={`text-xs px-2 py-1 rounded ${getPriorityColor()}`}>
              {data.priority}
            </span>
          </div>
        )}

        {data.title && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Title:</span>
            <div className="bg-gray-100 dark:bg-gray-700 rounded px-3 py-2">
              <p className="text-sm font-medium">{data.title}</p>
            </div>
          </div>
        )}

        {data.message && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Message:</span>
            <div className="bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 max-h-20 overflow-y-auto">
              <p className="text-xs text-gray-700 dark:text-gray-300">
                {data.message}
              </p>
            </div>
          </div>
        )}

        {data.recipients && data.recipients.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Recipients:</span>
            <div className="flex flex-wrap gap-1">
              {data.recipients.slice(0, 3).map((recipient, index) => (
                <span
                  key={index}
                  className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded"
                >
                  {recipient}
                </span>
              ))}
              {data.recipients.length > 3 && (
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded">
                  +{data.recipients.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {data.metadata && Object.keys(data.metadata).length > 0 && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Metadata:</span>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
              <pre className="text-xs text-gray-700 dark:text-gray-300">
                {JSON.stringify(data.metadata, null, 2)}
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