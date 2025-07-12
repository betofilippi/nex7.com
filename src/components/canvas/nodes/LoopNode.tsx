import React from 'react';
import { Handle, Position } from 'reactflow';
import { Repeat, RotateCw, List } from 'lucide-react';
import { LoopNodeData } from '../types';

interface LoopNodeProps {
  data: LoopNodeData;
  selected: boolean;
}

export const LoopNode: React.FC<LoopNodeProps> = ({ data, selected }) => {
  const getLoopIcon = () => {
    switch (data.loopType) {
      case 'for':
        return <Repeat className="w-5 h-5" />;
      case 'while':
        return <RotateCw className="w-5 h-5" />;
      case 'forEach':
        return <List className="w-5 h-5" />;
      default:
        return <Repeat className="w-5 h-5" />;
    }
  };

  const getLoopDescription = () => {
    switch (data.loopType) {
      case 'for':
        return `Iterate ${data.iterations || 'N'} times`;
      case 'while':
        return 'While condition is true';
      case 'forEach':
        return 'For each item in collection';
      default:
        return 'Loop';
    }
  };

  return (
    <div
      className={`
        min-w-[260px] rounded-lg shadow-lg border-2 transition-all duration-200
        ${selected ? 'border-blue-500 shadow-blue-500/20' : 'border-gray-200'}
        bg-white dark:bg-gray-800
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-1 rounded-t-lg">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 text-white">
            {getLoopIcon()}
            <span className="font-semibold text-sm">{data.label}</span>
          </div>
          {data.loopType && (
            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded capitalize">
              {data.loopType}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">
            {getLoopDescription()}
          </p>
          
          {data.loopType === 'for' && data.iterations && (
            <div className="text-sm text-amber-700 dark:text-amber-300">
              <span className="font-mono bg-amber-100 dark:bg-amber-800/30 px-1 rounded">
                i = 0; i &lt; {data.iterations}; i++
              </span>
            </div>
          )}
          
          {data.loopType === 'while' && data.condition && (
            <div className="text-sm text-amber-700 dark:text-amber-300">
              <span className="font-mono bg-amber-100 dark:bg-amber-800/30 px-1 rounded">
                while ({data.condition})
              </span>
            </div>
          )}
          
          {data.loopType === 'forEach' && data.collection && (
            <div className="text-sm text-amber-700 dark:text-amber-300">
              <span className="font-mono bg-amber-100 dark:bg-amber-800/30 px-1 rounded">
                {data.collection}.forEach({data.currentItem || 'item'})
              </span>
            </div>
          )}
        </div>

        {data.index && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Index variable:</span>
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
              {data.index}
            </code>
          </div>
        )}

        {data.currentItem && data.loopType === 'forEach' && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Current item:</span>
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
              {data.currentItem}
            </code>
          </div>
        )}

        {data.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 italic">
            {data.description}
          </p>
        )}
      </div>

      <div className="flex gap-2 px-4 pb-4">
        <Handle
          type="source"
          position={Position.Bottom}
          id="loop-body"
          style={{ left: '30%' }}
          className="w-3 h-3 bg-amber-500 border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="loop-complete"
          style={{ left: '70%' }}
          className="w-3 h-3 bg-green-500 border-2 border-white"
        />
      </div>
      
      <div className="absolute -bottom-6 left-0 right-0 flex justify-around text-xs text-gray-500">
        <span style={{ marginLeft: '20%' }}>Body</span>
        <span style={{ marginRight: '20%' }}>Complete</span>
      </div>
    </div>
  );
};