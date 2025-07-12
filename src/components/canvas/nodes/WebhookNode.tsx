import React from 'react';
import { Handle, Position } from 'reactflow';
import { Webhook, Shield, Copy, ExternalLink } from 'lucide-react';
import { WebhookNodeData } from '../types';

interface WebhookNodeProps {
  data: WebhookNodeData;
  selected: boolean;
}

export const WebhookNode: React.FC<WebhookNodeProps> = ({ data, selected }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
      
      <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-1 rounded-t-lg">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 text-white">
            <Webhook className="w-5 h-5" />
            <span className="font-semibold text-sm">{data.label}</span>
          </div>
          {data.method && (
            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded">
              {data.method}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {data.webhookUrl && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Webhook URL:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => copyToClipboard(data.webhookUrl!)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Copy URL"
                >
                  <Copy className="w-3 h-3 text-gray-500" />
                </button>
                <a
                  href={data.webhookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="Open URL"
                >
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
              <code className="text-xs text-gray-700 dark:text-gray-300 break-all">
                {data.webhookUrl}
              </code>
            </div>
          </div>
        )}

        {data.secret && (
          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 rounded p-2 border border-rose-200 dark:border-rose-800">
            <Shield className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-xs text-rose-700 dark:text-rose-300">
              Secret configured
            </span>
          </div>
        )}

        {data.events && data.events.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Listening for events:</span>
            <div className="flex flex-wrap gap-1">
              {data.events.map((event, index) => (
                <span
                  key={index}
                  className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs px-2 py-1 rounded"
                >
                  {event}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.headers && Object.keys(data.headers).length > 0 && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Custom Headers:</span>
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