'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getClaudeClient } from '../lib/claude-client';
import { getAgentManager, AgentManager, AgentMessage } from '../lib/agents/manager';
import { Agent, getAgent } from '../lib/agents/definitions';

interface UseAgentManagerOptions {
  apiKey: string;
  initialAgentId?: string;
  onAgentSwitch?: (fromAgentId: string, toAgentId: string) => void;
  onMessage?: (message: AgentMessage) => void;
}

interface UseAgentManagerReturn {
  // State
  conversationId: string | null;
  activeAgent: Agent | null;
  messages: AgentMessage[];
  isLoading: boolean;
  error: string | null;
  suggestedAgent: string | null;
  
  // Actions
  sendMessage: (message: string) => Promise<void>;
  switchAgent: (agentId: string) => void;
  clearConversation: () => void;
  setContext: (key: string, value: unknown) => void;
  getContext: (key: string) => unknown;
}

export const useAgentManager = ({
  apiKey,
  initialAgentId = 'nexy',
  onAgentSwitch,
  onMessage
}: UseAgentManagerOptions): UseAgentManagerReturn => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeAgentId, setActiveAgentId] = useState(initialAgentId);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedAgent, setSuggestedAgent] = useState<string | null>(null);
  
  const managerRef = useRef<AgentManager | null>(null);
  const activeAgent = getAgent(activeAgentId) || null;

  // Initialize manager and conversation
  useEffect(() => {
    try {
      const claudeClient = getClaudeClient(apiKey);
      const manager = getAgentManager(claudeClient);
      managerRef.current = manager;
      
      // Create new conversation
      const newConversationId = manager.createConversation(initialAgentId);
      setConversationId(newConversationId);
      
      // Add initial greeting
      const agent = getAgent(initialAgentId);
      if (agent) {
        const greetingMessage: AgentMessage = {
          role: 'assistant',
          content: agent.greeting,
          agentId: agent.id,
          timestamp: new Date(),
          metadata: { mood: 'happy' }
        };
        setMessages([greetingMessage]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize agent manager');
    }
  }, [apiKey, initialAgentId]);

  // Send message
  const sendMessage = useCallback(async (message: string) => {
    if (!managerRef.current || !conversationId) {
      setError('Agent manager not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestedAgent(null);

    try {
      // Add user message immediately for better UX
      const userMessage: AgentMessage = {
        role: 'user',
        content: message,
        agentId: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to agent
      const response = await managerRef.current.sendMessage(
        conversationId,
        message,
        activeAgentId
      );

      // Update messages with agent response
      setMessages(prev => [...prev, response]);

      // Check for suggested agent
      if (response.metadata?.suggestedNextAgent) {
        setSuggestedAgent(response.metadata.suggestedNextAgent);
      }

      // Callback
      if (onMessage) {
        onMessage(response);
      }

      // Update conversation history
      const history = managerRef.current.getConversationHistory(conversationId);
      setMessages(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, activeAgentId, onMessage]);

  // Switch agent
  const switchAgent = useCallback((agentId: string) => {
    if (!managerRef.current || !conversationId) {
      return;
    }

    const success = managerRef.current.switchAgent(conversationId, agentId);
    if (success) {
      const previousAgentId = activeAgentId;
      setActiveAgentId(agentId);
      setSuggestedAgent(null);
      
      // Update messages
      const history = managerRef.current.getConversationHistory(conversationId);
      setMessages(history);
      
      // Callback
      if (onAgentSwitch) {
        onAgentSwitch(previousAgentId, agentId);
      }
    }
  }, [conversationId, activeAgentId, onAgentSwitch]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    if (!managerRef.current || !conversationId) {
      return;
    }

    managerRef.current.clearConversation(conversationId);
    setMessages([]);
    setSuggestedAgent(null);
    
    // Add greeting from active agent
    const agent = getAgent(activeAgentId);
    if (agent) {
      const greetingMessage: AgentMessage = {
        role: 'assistant',
        content: agent.greeting,
        agentId: agent.id,
        timestamp: new Date(),
        metadata: { mood: 'happy' }
      };
      setMessages([greetingMessage]);
    }
  }, [conversationId, activeAgentId]);

  // Context management
  const setContext = useCallback((key: string, value: unknown) => {
    if (!managerRef.current || !conversationId) {
      return;
    }
    managerRef.current.setContext(conversationId, key, value);
  }, [conversationId]);

  const getContext = useCallback((key: string): unknown => {
    if (!managerRef.current || !conversationId) {
      return undefined;
    }
    return managerRef.current.getContext(conversationId, key);
  }, [conversationId]);

  return {
    // State
    conversationId,
    activeAgent,
    messages,
    isLoading,
    error,
    suggestedAgent,
    
    // Actions
    sendMessage,
    switchAgent,
    clearConversation,
    setContext,
    getContext
  };
};