import React from 'react';
import { Handle, Position } from 'reactflow';
import { Mail, Paperclip, Users, FileText } from 'lucide-react';
import { EmailNodeData } from '../types';

interface EmailNodeProps {
  data: EmailNodeData;
  selected: boolean;
}

export const EmailNode: React.FC<EmailNodeProps> = ({ data, selected }) => {
  const formatRecipients = (recipients: string[] | undefined, type: string) => {
    if (!recipients || recipients.length === 0) return null;
    
    return (
      <div className="space-y-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">{type}:</span>
        <div className="flex flex-wrap gap-1">
          {recipients.map((email, index) => (
            <span
              key={index}
              className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded"
            >
              {email}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`
        min-w-[320px] rounded-lg shadow-lg border-2 transition-all duration-200
        ${selected ? 'border-blue-500 shadow-blue-500/20' : 'border-gray-200'}
        bg-white dark:bg-gray-800
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-1 rounded-t-lg">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 text-white">
            <Mail className="w-5 h-5" />
            <span className="font-semibold text-sm">{data.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {data.template && (
              <div className="flex items-center gap-1 bg-white/20 rounded px-2 py-1">
                <FileText className="w-3 h-3 text-white" />
                <span className="text-xs text-white">Template</span>
              </div>
            )}
            {data.attachments && data.attachments.length > 0 && (
              <div className="flex items-center gap-1 bg-white/20 rounded px-2 py-1">
                <Paperclip className="w-3 h-3 text-white" />
                <span className="text-xs text-white">{data.attachments.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {formatRecipients(data.to, 'To')}
        {formatRecipients(data.cc, 'CC')}
        {formatRecipients(data.bcc, 'BCC')}

        {data.subject && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Subject:</span>
            <div className="bg-gray-100 dark:bg-gray-700 rounded px-3 py-2">
              <p className="text-sm font-medium">{data.subject}</p>
            </div>
          </div>
        )}

        {data.body && (
          <div className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Body:</span>
            <div className="bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 max-h-20 overflow-y-auto">
              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {data.body}
              </p>
            </div>
          </div>
        )}

        {data.smtpConfig && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded p-2 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-2 text-xs">
              <Mail className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span className="text-indigo-700 dark:text-indigo-300">
                SMTP: {data.smtpConfig.host}:{data.smtpConfig.port}
              </span>
              {data.smtpConfig.secure && (
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1 rounded">
                  SSL
                </span>
              )}
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