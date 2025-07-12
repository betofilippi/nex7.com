'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CustomNode, GitHubNodeData, ClaudeNodeData, VercelNodeData, ConditionalNodeData } from './types';

interface NodeEditorProps {
  node: CustomNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: CustomNode) => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({ node, isOpen, onClose, onSave }) => {
  const [editedNode, setEditedNode] = useState<CustomNode | null>(node);

  React.useEffect(() => {
    setEditedNode(node);
  }, [node]);

  if (!editedNode) return null;

  const handleSave = () => {
    if (editedNode) {
      onSave(editedNode);
      onClose();
    }
  };

  const updateNodeData = (field: string, value: any) => {
    if (editedNode) {
      setEditedNode({
        ...editedNode,
        data: {
          ...editedNode.data,
          [field]: value,
        },
      });
    }
  };

  const renderNodeSpecificFields = () => {
    switch (editedNode.type) {
      case 'github':
        const githubData = editedNode.data as GitHubNodeData;
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Repository
              </label>
              <input
                type="text"
                value={githubData.repository || ''}
                onChange={(e) => updateNodeData('repository', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="owner/repository"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Branch
              </label>
              <input
                type="text"
                value={githubData.branch || ''}
                onChange={(e) => updateNodeData('branch', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="main"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Webhook URL
              </label>
              <input
                type="text"
                value={githubData.webhook || ''}
                onChange={(e) => updateNodeData('webhook', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="https://..."
              />
            </div>
          </>
        );

      case 'claude':
        const claudeData = editedNode.data as ClaudeNodeData;
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Model
              </label>
              <select
                value={claudeData.model || 'claude-3-opus'}
                onChange={(e) => updateNodeData('model', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Prompt
              </label>
              <textarea
                value={claudeData.prompt || ''}
                onChange={(e) => updateNodeData('prompt', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 h-24 resize-none"
                placeholder="Enter your prompt..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Temperature: {claudeData.temperature || 0.7}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={claudeData.temperature || 0.7}
                onChange={(e) => updateNodeData('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </>
        );

      case 'vercel':
        const vercelData = editedNode.data as VercelNodeData;
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={vercelData.projectName || ''}
                onChange={(e) => updateNodeData('projectName', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="my-project"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Domain
              </label>
              <input
                type="text"
                value={vercelData.domain || ''}
                onChange={(e) => updateNodeData('domain', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="example.vercel.app"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Environment
              </label>
              <select
                value={vercelData.environment || 'production'}
                onChange={(e) => updateNodeData('environment', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="production">Production</option>
                <option value="preview">Preview</option>
                <option value="development">Development</option>
              </select>
            </div>
          </>
        );

      case 'conditional':
        const conditionalData = editedNode.data as ConditionalNodeData;
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Condition
              </label>
              <input
                type="text"
                value={conditionalData.condition || ''}
                onChange={(e) => updateNodeData('condition', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="status === 'success'"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                True Output
              </label>
              <input
                type="text"
                value={conditionalData.trueOutput || ''}
                onChange={(e) => updateNodeData('trueOutput', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Continue to next step"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                False Output
              </label>
              <input
                type="text"
                value={conditionalData.falseOutput || ''}
                onChange={(e) => updateNodeData('falseOutput', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Handle error"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gray-900 rounded-lg shadow-xl z-50 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Edit Node</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={editedNode.data.label}
                  onChange={(e) => updateNodeData('label', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editedNode.data.description || ''}
                  onChange={(e) => updateNodeData('description', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 h-20 resize-none"
                  placeholder="Add a description..."
                />
              </div>

              {renderNodeSpecificFields()}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NodeEditor;