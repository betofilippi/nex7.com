'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Send, 
  Loader2, 
  Brain, 
  Code, 
  Palette, 
  BookOpen, 
  Bug,
  Users,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  History,
  Trash2,
  Download,
  ChevronRight
} from 'lucide-react';
import { useToast } from './ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  greeting: string;
}

interface Message {
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

interface Tool {
  name: string;
  description: string;
  lastUsed?: Date;
}

interface Collaboration {
  fromAgent: string;
  toAgent: string;
  reason: string;
}

const AGENTS: Record<string, Agent> = {
  nexy: {
    id: 'nexy',
    name: 'Nexy',
    role: 'Main Guide',
    avatar: '🤖',
    color: '#4F46E5',
    greeting: "Hi! I'm Nexy, your guide. How can I help you today?"
  },
  dev: {
    id: 'dev',
    name: 'Dev',
    role: 'Code Assistant',
    avatar: '💻',
    color: '#10B981',
    greeting: "Hello! I'm Dev, ready to help with your coding needs."
  },
  designer: {
    id: 'designer',
    name: 'Designer',
    role: 'Visual Assistant',
    avatar: '🎨',
    color: '#EC4899',
    greeting: "Hi! I'm Designer, let's create something beautiful."
  },
  teacher: {
    id: 'teacher',
    name: 'Teacher',
    role: 'Educational Assistant',
    avatar: '📚',
    color: '#F59E0B',
    greeting: "Welcome! I'm Teacher, here to help you learn."
  },
  debugger: {
    id: 'debugger',
    name: 'Debugger',
    role: 'Problem Solver',
    avatar: '🔍',
    color: '#EF4444',
    greeting: "Hello! I'm Debugger, let's solve this together."
  }
};

export function EnhancedAgentChat() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<Agent>(AGENTS.nexy);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [agentTools, setAgentTools] = useState<Tool[]>([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [memoryStats, setMemoryStats] = useState<any>(null);

  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognition = useRef<any>(null);
  const speechSynthesis = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize conversation
  useEffect(() => {
    initializeConversation();
  }, []);

  // Load agent tools
  useEffect(() => {
    if (activeAgent) {
      loadAgentTools(activeAgent.id);
    }
  }, [activeAgent]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeConversation = async () => {
    try {
      const response = await fetch('/api/agents/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: 'nexy' })
      });

      const data = await response.json();
      setConversationId(data.conversationId);

      // Add greeting message
      if (data.greeting) {
        setMessages([{
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: data.greeting,
          agentId: 'nexy',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initialize conversation',
        variant: 'destructive'
      });
    }
  };

  const loadAgentTools = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/tools?agentId=${agentId}`);
      const data = await response.json();
      setAgentTools(data.tools || []);
    } catch (error) {
      console.error('Failed to load agent tools:', error);
    }
  };

  const loadMemoryStats = async () => {
    try {
      const response = await fetch('/api/agents/memory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analytics' })
      });
      const data = await response.json();
      setMemoryStats(data);
    } catch (error) {
      console.error('Failed to load memory stats:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      agentId: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowThinking(true);

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: input,
          agentId: activeAgent.id,
          stream: true
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        agentId: activeAgent.id,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setShowThinking(false);

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
                }
                if (data.collaborations) {
                  setCollaborations(data.collaborations);
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      // Text-to-speech for assistant response
      if (isSpeaking && assistantMessage.content) {
        speak(assistantMessage.content);
      }

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setShowThinking(false);
    }
  };

  const switchAgent = async (agent: Agent) => {
    setActiveAgent(agent);
    
    // Add transition message
    const transitionMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `Switching to ${agent.name}... ${agent.greeting}`,
      agentId: agent.id,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, transitionMessage]);
  };

  const startCollaboration = async (agents: string[], task: string) => {
    if (!conversationId) return;

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/agents/collaborate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          task,
          agents,
          context: { currentAgent: activeAgent.id }
        })
      });

      if (!response.ok) throw new Error('Failed to start collaboration');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

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
                const agent = AGENTS[data.agentId];
                const startMessage: Message = {
                  id: `msg_${Date.now()}_${data.agentId}`,
                  role: 'assistant',
                  content: `${agent.avatar} ${agent.name} is working on this...`,
                  agentId: data.agentId,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, startMessage]);
              } else if (data.type === 'agent_chunk') {
                setMessages(prev => {
                  const lastMessage = prev[prev.length - 1];
                  if (lastMessage.agentId === data.agentId) {
                    return prev.map(msg => 
                      msg.id === lastMessage.id
                        ? { ...msg, content: msg.content + data.content }
                        : msg
                    );
                  }
                  return prev;
                });
              }
            } catch (e) {
              console.error('Failed to parse collaboration data:', e);
            }
          }
        }
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
  };

  const toggleVoiceInput = () => {
    if (!isVoiceEnabled) {
      // Start voice recognition
      if ('webkitSpeechRecognition' in window) {
        speechRecognition.current = new (window as any).webkitSpeechRecognition();
        speechRecognition.current.continuous = true;
        speechRecognition.current.interimResults = true;

        speechRecognition.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setInput(transcript);
        };

        speechRecognition.current.start();
        setIsVoiceEnabled(true);
      } else {
        toast({
          title: 'Not Supported',
          description: 'Voice input is not supported in your browser',
          variant: 'destructive'
        });
      }
    } else {
      // Stop voice recognition
      if (speechRecognition.current) {
        speechRecognition.current.stop();
      }
      setIsVoiceEnabled(false);
    }
  };

  const toggleSpeaking = () => {
    setIsSpeaking(!isSpeaking);
    if (isSpeaking && speechSynthesis.current) {
      window.speechSynthesis.cancel();
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.current = new SpeechSynthesisUtterance(text);
      speechSynthesis.current.rate = 1;
      speechSynthesis.current.pitch = 1;
      window.speechSynthesis.speak(speechSynthesis.current);
    }
  };

  const exportConversation = () => {
    const conversationData = {
      conversationId,
      messages,
      activeAgent: activeAgent.id,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(conversationData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_${conversationId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearConversation = () => {
    setMessages([]);
    setCollaborations([]);
    initializeConversation();
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10" style={{ backgroundColor: activeAgent.color }}>
                <AvatarFallback>{activeAgent.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{activeAgent.name}</h3>
                <p className="text-sm text-muted-foreground">{activeAgent.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleVoiceInput}
                className={isVoiceEnabled ? 'text-primary' : ''}
              >
                {isVoiceEnabled ? <Mic /> : <MicOff />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSpeaking}
                className={isSpeaking ? 'text-primary' : ''}
              >
                {isSpeaking ? <Volume2 /> : <VolumeX />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={exportConversation}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearConversation}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message) => {
                  const agent = message.agentId === 'user' ? null : AGENTS[message.agentId];
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && agent && (
                        <Avatar className="h-8 w-8 mt-1" style={{ backgroundColor: agent.color }}>
                          <AvatarFallback>{agent.avatar}</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.metadata && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {message.metadata.mood && (
                              <Badge variant="secondary" className="text-xs">
                                {message.metadata.mood}
                              </Badge>
                            )}
                            {message.metadata.toolsUsed && message.metadata.toolsUsed.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                🛠️ {message.metadata.toolsUsed.length} tools
                              </Badge>
                            )}
                            {message.metadata.memoryAccessed && (
                              <Badge variant="secondary" className="text-xs">
                                🧠 Memory
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {showThinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm italic">
                    {activeAgent.name} is thinking...
                  </span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            {collaborations.length > 0 && (
              <div className="mb-3 p-2 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Suggested Collaborations:</p>
                <div className="flex flex-wrap gap-2">
                  {collaborations.map((collab, idx) => (
                    <Button
                      key={idx}
                      variant="secondary"
                      size="sm"
                      onClick={() => switchAgent(AGENTS[collab.toAgent])}
                    >
                      Switch to {AGENTS[collab.toAgent].name}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={`Ask ${activeAgent.name} anything...`}
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-4"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side Panel */}
      <div className="w-80 space-y-4">
        {/* Agent Selector */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              AI Agents
            </h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.values(AGENTS).map((agent) => (
              <Button
                key={agent.id}
                variant={activeAgent.id === agent.id ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => switchAgent(agent)}
              >
                <span className="mr-2">{agent.avatar}</span>
                {agent.name}
                <Badge variant="secondary" className="ml-auto">
                  {agent.role}
                </Badge>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Tools & Capabilities */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Agent Capabilities
            </h3>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {agentTools.map((tool, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-medium">{tool.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {tool.description}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold">Quick Actions</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => startCollaboration(['dev', 'designer'], 'Create a new component')}
            >
              <Code className="h-4 w-4 mr-2" />
              Dev + Designer Collab
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => startCollaboration(['teacher', 'dev'], 'Learn a new concept')}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Learn with Examples
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => startCollaboration(['debugger', 'dev'], 'Fix an issue')}
            >
              <Bug className="h-4 w-4 mr-2" />
              Debug + Fix
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={loadMemoryStats}
            >
              <Brain className="h-4 w-4 mr-2" />
              Memory Stats
            </Button>
          </CardContent>
        </Card>

        {/* Memory Stats */}
        {memoryStats && (
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Agent Memory
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Memories:</span>
                  <span className="font-medium">{memoryStats.totalMemories}</span>
                </div>
                {Object.entries(memoryStats.byAgent).map(([agentId, stats]: [string, any]) => (
                  <div key={agentId} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {AGENTS[agentId]?.name || agentId}:
                    </span>
                    <span className="font-medium">{stats.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}