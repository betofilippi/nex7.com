'use client';

import React, { useState } from 'react';
import { useSSEQuery } from '../lib/sse-utils';

export function ClaudeExample() {
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [nonStreamingResponse, setNonStreamingResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { messages, isStreaming, error, startStream, cancelStream } = useSSEQuery();

  // Create a new conversation
  const createConversation = async () => {
    try {
      const response = await fetch('/api/claude/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      setConversationId(data.conversationId);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  // Send a non-streaming query
  const sendQuery = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    setNonStreamingResponse('');
    
    try {
      const response = await fetch('/api/claude/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationId,
          stream: false,
        }),
      });
      
      const data = await response.json();
      setNonStreamingResponse(data.content || data.error || 'No response');
    } catch (err) {
      setNonStreamingResponse('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Send a streaming query
  const sendStreamingQuery = () => {
    if (!input.trim()) return;
    startStream(input, conversationId);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Claude Code SDK Example</h2>
      
      <div className="mb-4">
        <button
          onClick={createConversation}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create New Conversation
        </button>
        {conversationId && (
          <span className="ml-4 text-sm text-gray-600">
            Conversation ID: {conversationId}
          </span>
        )}
      </div>

      <div className="mb-6">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your message for Claude..."
          className="w-full p-3 border border-gray-300 rounded-lg resize-none"
          rows={4}
        />
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={sendQuery}
          disabled={isLoading || isStreaming}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Query'}
        </button>
        
        <button
          onClick={sendStreamingQuery}
          disabled={isLoading || isStreaming}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {isStreaming ? 'Streaming...' : 'Send Streaming Query'}
        </button>
        
        {isStreaming && (
          <button
            onClick={cancelStream}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Cancel Stream
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {nonStreamingResponse && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Non-Streaming Response:</h3>
          <div className="p-4 bg-gray-100 rounded-lg whitespace-pre-wrap">
            {nonStreamingResponse}
          </div>
        </div>
      )}

      {messages && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Streaming Response:</h3>
          <div className="p-4 bg-gray-100 rounded-lg whitespace-pre-wrap">
            {messages}
          </div>
        </div>
      )}
    </div>
  );
}