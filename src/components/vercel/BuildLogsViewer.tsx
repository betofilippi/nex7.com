'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import {
  Terminal,
  Download,
  RefreshCw,
  Pause,
  Play,
  AlertCircle,
  Copy,
  Maximize2,
  Filter,
} from 'lucide-react';
import { VercelBuildLog } from '../../lib/vercel/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface BuildLogsViewerProps {
  deploymentId: string;
  autoScroll?: boolean;
  syntaxHighlight?: boolean;
  maxHeight?: string;
}

const logTypeConfig = {
  command: { color: 'text-blue-500', label: 'CMD', icon: Terminal },
  stdout: { color: 'text-gray-300', label: 'OUT', icon: null },
  stderr: { color: 'text-red-500', label: 'ERR', icon: AlertCircle },
  exit: { color: 'text-green-500', label: 'EXIT', icon: null },
  error: { color: 'text-red-600', label: 'ERROR', icon: AlertCircle },
};

export default function BuildLogsViewer({ 
  deploymentId,
  autoScroll = true,
  syntaxHighlight = true,
  maxHeight = '500px'
}: BuildLogsViewerProps) {
  const [logs, setLogs] = useState<VercelBuildLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStreaming = () => {
    if (eventSourceRef.current) return;

    setStreaming(true);
    const eventSource = new EventSource(`/api/vercel/logs?deploymentId=${deploymentId}&stream=true`);
    
    eventSource.addEventListener('log', (event) => {
      if (!paused) {
        const log = JSON.parse(event.data);
        setLogs(prev => [...prev, log]);
      }
    });

    eventSource.addEventListener('error', () => {
      console.error('SSE connection error');
      setStreaming(false);
      eventSource.close();
    });

    eventSource.addEventListener('complete', () => {
      setStreaming(false);
      eventSource.close();
    });

    eventSourceRef.current = eventSource;
  };

  const stopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setStreaming(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vercel/logs?deploymentId=${deploymentId}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deploymentId) {
      fetchLogs();
      startStreaming();
    }

    return () => {
      stopStreaming();
    };
  }, [deploymentId]);

  useEffect(() => {
    if (autoScroll && scrollRef.current && !paused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll, paused]);

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.type === filter);

  const downloadLogs = () => {
    const content = logs.map(log => 
      `[${new Date(log.created).toISOString()}] [${log.type.toUpperCase()}] ${log.payload}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `build-logs-${deploymentId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLogs = () => {
    const content = filteredLogs.map(log => log.payload).join('\n');
    navigator.clipboard.writeText(content);
  };

  const highlightSyntax = (text: string): React.ReactNode => {
    if (!syntaxHighlight) return text;

    // Simple syntax highlighting
    return text.split('\n').map((line, idx) => {
      let highlighted = line;
      
      // Highlight URLs
      highlighted = highlighted.replace(
        /(https?:\/\/[^\s]+)/g,
        '<span class="text-blue-400 underline">$1</span>'
      );
      
      // Highlight file paths
      highlighted = highlighted.replace(
        /(\/?[\w-]+(?:\/[\w.-]+)*\.\w+)/g,
        '<span class="text-green-400">$1</span>'
      );
      
      // Highlight numbers
      highlighted = highlighted.replace(
        /\b(\d+(?:\.\d+)?)\b/g,
        '<span class="text-yellow-400">$1</span>'
      );
      
      // Highlight strings in quotes
      highlighted = highlighted.replace(
        /(["'])(?:(?=(\\?))\2.)*?\1/g,
        '<span class="text-orange-400">$&</span>'
      );

      return (
        <span key={idx} dangerouslySetInnerHTML={{ __html: highlighted }} />
      );
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <CardTitle className="text-lg">Build Logs</CardTitle>
            {streaming && (
              <Badge variant="secondary" className="animate-pulse">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
                Live
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Logs</SelectItem>
                <SelectItem value="command">Commands</SelectItem>
                <SelectItem value="stdout">Output</SelectItem>
                <SelectItem value="stderr">Errors</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setPaused(!paused)}
              className="h-8 w-8"
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={copyLogs}
              className="h-8 w-8"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={downloadLogs}
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea 
          className="w-full border-t" 
          style={{ height: maxHeight }}
          ref={scrollRef}
        >
          <div className="p-4 font-mono text-sm space-y-1 bg-gray-950">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {!loading && filteredLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No logs available
              </div>
            )}

            {filteredLogs.map((log, index) => {
              const config = logTypeConfig[log.type];
              const LogIcon = config.icon;

              return (
                <div 
                  key={index} 
                  className={`flex items-start gap-2 py-0.5 ${config.color} hover:bg-gray-900/50 rounded px-2 -mx-2`}
                >
                  <span className="text-gray-600 text-xs w-32 flex-shrink-0">
                    {new Date(log.created).toLocaleTimeString()}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1 py-0 h-5 ${config.color} border-current`}
                  >
                    {config.label}
                  </Badge>
                  {LogIcon && <LogIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                  <pre className="flex-1 whitespace-pre-wrap break-all">
                    {highlightSyntax(log.payload)}
                  </pre>
                </div>
              );
            })}

            {streaming && !paused && (
              <div className="flex items-center gap-2 text-muted-foreground py-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-xs">Waiting for more logs...</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}