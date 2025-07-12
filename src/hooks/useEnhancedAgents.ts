import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentId: string;
  timestamp: Date;
  metadata?: {
    mood?: string;
    confidence?: number;
    suggestedNextAgent?: string;
    toolsUsed?: string[];
    memoryAccessed?: boolean;
  };
}

export interface AgentCollaboration {
  fromAgent: string;
  toAgent: string;
  reason: string;
}

export interface AgentTool {
  name: string;
  description: string;
  input_schema: any;
}

export interface UseEnhancedAgentsOptions {
  onMessage?: (message: AgentMessage) => void;
  onCollaboration?: (collaboration: AgentCollaboration) => void;
  onToolExecution?: (tool: string, result: any) => void;
  voiceEnabled?: boolean;
}

export function useEnhancedAgents(options: UseEnhancedAgentsOptions = {}) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState('nexy');
  const [collaborations, setCollaborations] = useState<AgentCollaboration[]>([]);
  const [agentTools, setAgentTools] = useState<Record<string, AgentTool[]>>({});
  const [memoryStats, setMemoryStats] = useState<any>(null);

  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize a new conversation
  const initializeConversation = useCallback(async (agentId: string = 'nexy') => {
    try {
      const response = await fetch('/api/agents/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      });

      if (!response.ok) throw new Error('Failed to initialize conversation');

      const data = await response.json();
      setConversationId(data.conversationId);
      setActiveAgentId(agentId);

      if (data.greeting) {
        const greetingMessage: AgentMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: data.greeting,
          agentId,
          timestamp: new Date()
        };
        setMessages([greetingMessage]);
        options.onMessage?.(greetingMessage);
      }

      // Load agent tools
      await loadAgentTools(agentId);

      return data.conversationId;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initialize conversation',
        variant: 'destructive'
      });
      throw error;
    }
  }, [options, toast]);

  // Send a message to the active agent
  const sendMessage = useCallback(async (
    content: string,
    agentId?: string,
    stream: boolean = true
  ) => {
    if (!content.trim() || !conversationId || isLoading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const targetAgentId = agentId || activeAgentId;

    const userMessage: AgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      agentId: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    options.onMessage?.(userMessage);
    setIsLoading(true);

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: content,
          agentId: targetAgentId,
          stream
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Failed to send message');

      if (stream) {
        await handleStreamResponse(response, targetAgentId);
      } else {
        const data = await response.json();
        const assistantMessage: AgentMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: data.message.content,
          agentId: targetAgentId,
          timestamp: new Date(),
          metadata: data.message.metadata
        };
        setMessages(prev => [...prev, assistantMessage]);
        options.onMessage?.(assistantMessage);
        
        if (data.collaborations) {
          setCollaborations(data.collaborations);
          data.collaborations.forEach((collab: AgentCollaboration) => {
            options.onCollaboration?.(collab);
          });
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({
          title: 'Error',
          description: 'Failed to send message',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [conversationId, activeAgentId, isLoading, options, toast]);

  // Handle streaming response
  const handleStreamResponse = async (response: Response, agentId: string) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    const assistantMessage: AgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: '',
      agentId,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'chunk') {
              assistantMessage.content += data.content;
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: assistantMessage.content }
                    : msg
                )
              );
            } else if (data.type === 'done') {
              if (data.message?.metadata) {
                assistantMessage.metadata = data.message.metadata;
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, metadata: assistantMessage.metadata }
                      : msg
                  )
                );
              }
              if (data.collaborations) {
                setCollaborations(data.collaborations);
                data.collaborations.forEach((collab: AgentCollaboration) => {
                  options.onCollaboration?.(collab);
                });
              }
              options.onMessage?.(assistantMessage);
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }
  };

  // Switch to a different agent
  const switchAgent = useCallback(async (agentId: string) => {
    setActiveAgentId(agentId);
    await loadAgentTools(agentId);
  }, []);

  // Load tools for a specific agent
  const loadAgentTools = useCallback(async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/tools?agentId=${agentId}`);
      const data = await response.json();
      setAgentTools(prev => ({ ...prev, [agentId]: data.tools || [] }));
    } catch (error) {
      console.error('Failed to load agent tools:', error);
    }
  }, []);

  // Execute a specific agent tool
  const executeTool = useCallback(async (
    agentId: string,
    toolName: string,
    toolInput: any
  ) => {
    try {
      const response = await fetch('/api/agents/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          toolName,
          toolInput,
          conversationId
        })
      });

      if (!response.ok) throw new Error('Failed to execute tool');

      const data = await response.json();
      options.onToolExecution?.(toolName, data.result);
      return data.result;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute tool',
        variant: 'destructive'
      });
      throw error;
    }
  }, [conversationId, options, toast]);

  // Start a multi-agent collaboration
  const startCollaboration = useCallback(async (
    agents: string[],
    task: string,
    parallel: boolean = false
  ) => {
    if (!conversationId) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/agents/collaborate', {
        method: parallel ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          task,
          agents,
          parallel,
          context: { currentAgent: activeAgentId }
        })
      });

      if (!response.ok) throw new Error('Failed to start collaboration');

      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        await handleCollaborationStream(response);
      } else {
        const data = await response.json();
        // Process collaboration results
        data.results.forEach((result: any) => {
          const message: AgentMessage = {
            id: `msg_${Date.now()}_${result.agentId}`,
            role: 'assistant',
            content: result.response,
            agentId: result.agentId,
            timestamp: new Date(result.timestamp)
          };
          setMessages(prev => [...prev, message]);
          options.onMessage?.(message);
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start collaboration',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, activeAgentId, options, toast]);

  // Handle collaboration streaming
  const handleCollaborationStream = async (response: Response) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const agentMessages: Record<string, AgentMessage> = {};

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'agent_start') {
              const message: AgentMessage = {
                id: `msg_${Date.now()}_${data.agentId}`,
                role: 'assistant',
                content: '',
                agentId: data.agentId,
                timestamp: new Date()
              };
              agentMessages[data.agentId] = message;
              setMessages(prev => [...prev, message]);
            } else if (data.type === 'agent_chunk' && agentMessages[data.agentId]) {
              agentMessages[data.agentId].content += data.content;
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === agentMessages[data.agentId].id
                    ? { ...msg, content: agentMessages[data.agentId].content }
                    : msg
                )
              );
            } else if (data.type === 'agent_complete' && agentMessages[data.agentId]) {
              options.onMessage?.(agentMessages[data.agentId]);
            }
          } catch (e) {
            console.error('Failed to parse collaboration data:', e);
          }
        }
      }
    }
  };

  // Get agent memory
  const getAgentMemory = useCallback(async (agentId: string, key?: string, search?: string) => {
    const params = new URLSearchParams({ agentId });
    if (key) params.append('key', key);
    if (search) params.append('search', search);

    const response = await fetch(`/api/agents/memory?${params}`);
    const data = await response.json();
    return data.memories;
  }, []);

  // Set agent memory
  const setAgentMemory = useCallback(async (agentId: string, key: string, value: any, expiresIn?: number) => {
    const response = await fetch('/api/agents/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, key, value, expiresIn })
    });
    const data = await response.json();
    return data.memory;
  }, []);

  // Clear agent memory
  const clearAgentMemory = useCallback(async (agentId: string) => {
    const response = await fetch(`/api/agents/memory?agentId=${agentId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    return data.cleared;
  }, []);

  // Get memory stats
  const getMemoryStats = useCallback(async () => {
    const response = await fetch('/api/agents/memory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'analytics' })
    });
    const data = await response.json();
    setMemoryStats(data);
    return data;
  }, []);

  // Clear the current conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setCollaborations([]);
    setConversationId(null);
  }, []);

  // Cancel ongoing operations
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    conversationId,
    messages,
    isLoading,
    activeAgentId,
    collaborations,
    agentTools,
    memoryStats,

    // Actions
    initializeConversation,
    sendMessage,
    switchAgent,
    executeTool,
    startCollaboration,
    clearConversation,
    cancel,

    // Memory operations
    memory: {
      get: getAgentMemory,
      set: setAgentMemory,
      clear: clearAgentMemory,
      getStats: getMemoryStats
    },

    // Utilities
    getActiveTools: () => agentTools[activeAgentId] || [],
    hasCollaborationSuggestions: () => collaborations.length > 0,
    isAgentActive: (agentId: string) => activeAgentId === agentId
  };
}