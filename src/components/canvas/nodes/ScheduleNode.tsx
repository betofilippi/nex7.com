import React from 'react';
import { Handle, Position } from 'reactflow';
import { Clock, Calendar, Play, Pause } from 'lucide-react';
import { ScheduleNodeData } from '../types';

interface ScheduleNodeProps {
  data: ScheduleNodeData;
  selected: boolean;
}

export const ScheduleNode: React.FC<ScheduleNodeProps> = ({ data, selected }) => {
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const parseCronExpression = (cron: string | undefined) => {
    if (!cron) return 'Not configured';
    
    // Simple cron parsing for common patterns
    if (cron === '0 * * * *') return 'Every hour';
    if (cron === '0 0 * * *') return 'Daily at midnight';
    if (cron === '0 0 * * 0') return 'Weekly on Sunday';
    if (cron === '0 0 1 * *') return 'Monthly on the 1st';
    if (cron === '*/5 * * * *') return 'Every 5 minutes';
    if (cron === '*/15 * * * *') return 'Every 15 minutes';
    if (cron === '0 9 * * 1-5') return 'Weekdays at 9 AM';
    
    return cron;
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
      
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-1 rounded-t-lg">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5" />
            <span className="font-semibold text-sm">{data.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {data.enabled !== undefined && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                data.enabled ? 'bg-green-500/30' : 'bg-red-500/30'
              }`}>
                {data.enabled ? (
                  <Play className="w-3 h-3 text-white" />
                ) : (
                  <Pause className="w-3 h-3 text-white" />
                )}
                <span className="text-xs text-white">
                  {data.enabled ? 'Active' : 'Paused'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {data.cronExpression && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Schedule
              </span>
            </div>
            <div className="space-y-1">
              <code className="text-xs bg-purple-100 dark:bg-purple-800/30 px-2 py-1 rounded inline-block">
                {data.cronExpression}
              </code>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                {parseCronExpression(data.cronExpression)}
              </p>
            </div>
          </div>
        )}

        {data.timezone && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Timezone:</span>
            <span className="font-medium">{data.timezone}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <span className="text-gray-500 dark:text-gray-400">Last Run:</span>
            <div className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
              {formatDate(data.lastRun)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-gray-500 dark:text-gray-400">Next Run:</span>
            <div className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
              {formatDate(data.nextRun)}
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