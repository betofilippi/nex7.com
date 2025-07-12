import { EventSourceParserStream } from 'eventsource-parser/stream';

export interface SSEMessage {
  type: 'delta' | 'done' | 'error';
  content?: string;
  conversationId?: string;
  error?: string;
}

export class SSEClient {
  private controller: AbortController | null = null;

  async *streamQuery(
    message: string,
    conversationId?: string,
    tools?: unknown[]
  ): AsyncGenerator<SSEMessage> {
    this.controller = new AbortController();

    try {
      const response = await fetch('/api/claude/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId,
          tools,
          stream: true,
        }),
        signal: this.controller.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new EventSourceParserStream())
        .getReader();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        if (value.data) {
          try {
            const message = JSON.parse(value.data) as SSEMessage;
            yield message;
            
            if (message.type === 'done' || message.type === 'error') {
              break;
            }
          } catch (e) {
            console.error('Failed to parse SSE message:', e);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        yield { type: 'error', error: 'Stream cancelled' };
      } else {
        yield { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
      }
    } finally {
      this.controller = null;
    }
  }

  cancel(): void {
    if (this.controller) {
      this.controller.abort();
    }
  }
}

// React hook for using SSE
export function useSSEQuery() {
  const clientRef = React.useRef<SSEClient | null>(null);
  const [messages, setMessages] = React.useState<string>('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const startStream = React.useCallback(async (
    message: string,
    conversationId?: string,
    tools?: unknown[]
  ) => {
    if (clientRef.current) {
      clientRef.current.cancel();
    }

    clientRef.current = new SSEClient();
    setMessages('');
    setIsStreaming(true);
    setError(null);

    try {
      for await (const msg of clientRef.current.streamQuery(message, conversationId, tools)) {
        if (msg.type === 'delta' && msg.content) {
          setMessages(prev => prev + msg.content);
        } else if (msg.type === 'error') {
          setError(msg.error || 'Stream error');
          break;
        } else if (msg.type === 'done') {
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const cancelStream = React.useCallback(() => {
    if (clientRef.current) {
      clientRef.current.cancel();
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.cancel();
      }
    };
  }, []);

  return {
    messages,
    isStreaming,
    error,
    startStream,
    cancelStream,
  };
}

// Import React for the hook
import React from 'react';

// Server-side streaming utility
export function streamSSE(callback: (send: (data: unknown) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        const sseData = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(sseData));
      };

      try {
        await callback(send);
      } catch (error) {
        send({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}