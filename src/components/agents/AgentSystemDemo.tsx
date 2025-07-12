'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAgentManager } from '../../hooks/useAgentManager';
import { AgentChat } from './AgentChat';
import { AgentSelector } from './AgentSelector';
import { AgentPersonality } from './AgentPersonality';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { RefreshCw, MessageSquare, Users, Brain } from 'lucide-react';

interface AgentSystemDemoProps {
  apiKey: string;
}

export const AgentSystemDemo: React.FC<AgentSystemDemoProps> = ({ apiKey }) => {
  const [selectedTab, setSelectedTab] = useState('chat');
  const [messageCount, setMessageCount] = useState(0);

  const {
    conversationId,
    activeAgent,
    messages,
    isLoading,
    error,
    suggestedAgent,
    sendMessage,
    switchAgent,
    clearConversation
  } = useAgentManager({
    apiKey,
    initialAgentId: 'nexy',
    onMessage: (message) => {
      setMessageCount(prev => prev + 1);
      console.log('New message:', message);
    },
    onAgentSwitch: (from, to) => {
      console.log(`Switched from ${from} to ${to}`);
    }
  });

  const handleClearConversation = () => {
    clearConversation();
    setMessageCount(0);
  };

  if (!activeAgent || !conversationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing agent system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Intelligent Multi-Agent System</CardTitle>
                <CardDescription>
                  Experience AI assistants with unique personalities and capabilities
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={handleClearConversation}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                New Conversation
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Section */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="chat" className="gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="agents" className="gap-2">
                      <Users className="w-4 h-4" />
                      Agents
                    </TabsTrigger>
                    <TabsTrigger value="personality" className="gap-2">
                      <Brain className="w-4 h-4" />
                      Personality
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="chat" className="h-[600px] p-0">
                    <AgentChat
                      conversationId={conversationId}
                      activeAgent={activeAgent}
                      messages={messages}
                      onSendMessage={sendMessage}
                      onSwitchAgent={switchAgent}
                      isLoading={isLoading}
                      suggestedAgent={suggestedAgent || undefined}
                    />
                  </TabsContent>

                  <TabsContent value="agents" className="p-6">
                    <AgentSelector
                      activeAgentId={activeAgent.id}
                      onSelectAgent={switchAgent}
                      variant="list"
                    />
                  </TabsContent>

                  <TabsContent value="personality" className="p-6">
                    <AgentPersonality
                      agent={activeAgent}
                      mood={messages[messages.length - 1]?.metadata?.mood}
                      confidence={messages[messages.length - 1]?.metadata?.confidence}
                      messageCount={messageCount}
                      showDetails={true}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Quick Agent Switch */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Switch</CardTitle>
              </CardHeader>
              <CardContent>
                <AgentSelector
                  activeAgentId={activeAgent.id}
                  onSelectAgent={switchAgent}
                  variant="compact"
                  showLabels={false}
                />
              </CardContent>
            </Card>

            {/* Current Agent Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <AgentPersonality
                  agent={activeAgent}
                  mood={messages[messages.length - 1]?.metadata?.mood}
                  confidence={messages[messages.length - 1]?.metadata?.confidence}
                  messageCount={messageCount}
                  showDetails={false}
                />
              </CardContent>
            </Card>

            {/* Conversation Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversation Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Messages</div>
                    <div className="text-2xl font-bold">{messages.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Active Time</div>
                    <div className="text-lg font-medium">
                      {Math.floor((Date.now() - messages[0]?.timestamp.getTime()) / 60000)} min
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Agent Switches</div>
                    <div className="text-lg font-medium">
                      {messages.filter(m => m.content.includes('handed over')).length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};