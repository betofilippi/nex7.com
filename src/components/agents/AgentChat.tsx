'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { Agent } from '../../lib/agents/definitions';
import { AgentMessage } from '../../lib/agents/manager';
import { AgentAvatar } from './AgentAvatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface AgentChatProps {
  conversationId: string;
  activeAgent: Agent;
  messages: AgentMessage[];
  onSendMessage: (message: string) => Promise<void>;
  onSwitchAgent?: (agentId: string) => void;
  isLoading?: boolean;
  suggestedAgent?: string;
}

interface TypingIndicatorProps {
  agent: Agent;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ agent }) => {
  return (
    <div className="flex items-center space-x-2 px-4 py-2">
      <AgentAvatar agent={agent} size="sm" mood="thinking" />
      <div className="flex space-x-1">
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: agent.color }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: agent.color }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
        />
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: agent.color }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
        />
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{
  message: AgentMessage;
  agent?: Agent;
  isUser: boolean;
}> = ({ message, agent, isUser }) => {
  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[70%]`}>
        {!isUser && agent && (
          <div className="mr-2">
            <AgentAvatar agent={agent} size="sm" mood={message.metadata?.mood} />
          </div>
        )}
        
        <div
          className={`
            px-4 py-2 rounded-2xl
            ${isUser 
              ? 'bg-blue-500 text-white rounded-br-none' 
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }
          `}
          style={!isUser && agent ? {
            backgroundColor: agent.color + '10',
            color: agent.color
          } : {}}
        >
          <div className="text-sm">{message.content}</div>
          <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AgentChat: React.FC<AgentChatProps> = ({
  conversationId,
  activeAgent,
  messages,
  onSendMessage,
  onSwitchAgent,
  isLoading = false,
  suggestedAgent
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      await onSendMessage(message);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get agents map for message rendering
  const agentsMap: Record<string, Agent> = {};
  messages.forEach(msg => {
    if (msg.agentId && msg.agentId !== 'user') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const agent = require('../../lib/agents/definitions').agents[msg.agentId];
      if (agent) {
        agentsMap[msg.agentId] = agent;
      }
    }
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center space-x-3">
          <AgentAvatar agent={activeAgent} size="md" isActive={true} />
          <div>
            <h3 className="font-semibold text-lg">{activeAgent.name}</h3>
            <p className="text-sm text-gray-500">{activeAgent.role}</p>
          </div>
        </div>
        
        {/* Agent switch suggestion */}
        {suggestedAgent && onSwitchAgent && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <span className="text-sm text-gray-600">Suggested:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSwitchAgent(suggestedAgent)}
            >
              Switch to {suggestedAgent}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <MessageBubble
              key={`${message.agentId}-${index}`}
              message={message}
              agent={message.agentId !== 'user' ? agentsMap[message.agentId] : undefined}
              isUser={message.role === 'user'}
            />
          ))}
        </AnimatePresence>
        
        {/* Typing indicator */}
        {(isLoading || isTyping) && (
          <TypingIndicator agent={activeAgent} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask ${activeAgent.name} anything...`}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Quick actions based on agent capabilities */}
        <div className="flex flex-wrap gap-2 mt-2">
          {activeAgent.capabilities.slice(0, 3).map((capability) => (
            <Button
              key={capability.name}
              variant="ghost"
              size="sm"
              onClick={() => setInputValue(capability.triggers[0])}
              className="text-xs"
            >
              {capability.description}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};