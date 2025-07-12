'use client';

import React from 'react';
import { AgentSystemDemo } from '../../components/agents/AgentSystemDemo';

export default function AgentsPage() {
  // In a real app, you'd get this from environment or user settings
  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '';

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Required</h1>
          <p className="text-gray-600">
            Please set your Anthropic API key in the environment variables to use the agent system.
          </p>
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <code className="text-sm">NEXT_PUBLIC_ANTHROPIC_API_KEY=your-api-key</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AgentSystemDemo apiKey={apiKey} />
    </div>
  );
}