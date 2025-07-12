import { NextRequest, NextResponse } from 'next/server';
import { getClaudeClient } from '../../../../lib/claude-client';
import { CLAUDE_TOOLS, TOOL_IMPLEMENTATIONS } from '../../../../lib/claude-tools';
import { apiRateLimiter } from '../../../../lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    const { allowed, retryAfter } = await apiRateLimiter.checkLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter?.toString() || '60',
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message, conversationId, enableTools = true } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Get or create Claude client
    const client = getClaudeClient(apiKey);

    // Send message with tools
    const response = await client.sendMessage(
      message, 
      conversationId, 
      enableTools ? CLAUDE_TOOLS : undefined
    );

    // Handle tool calls if any
    const toolCalls: unknown[] = [];
    let finalContent = '';

    for (const content of response.content) {
      if (content.type === 'text') {
        finalContent += content.text;
      } else if (content.type === 'tool_use') {
        // Execute tool
        const toolName = content.name;
        const toolInput = content.input;
        
        try {
          const result = await client.executeToolCall(
            toolName,
            toolInput,
            TOOL_IMPLEMENTATIONS
          );
          
          toolCalls.push({
            id: content.id,
            name: toolName,
            input: toolInput,
            result,
          });
        } catch (error) {
          toolCalls.push({
            id: content.id,
            name: toolName,
            input: toolInput,
            error: error instanceof Error ? error.message : 'Tool execution failed',
          });
        }
      }
    }

    // If there were tool calls, send the results back to Claude
    if (toolCalls.length > 0) {
      // Add assistant's message with tool calls to conversation
      const conversation = client.getConversation(conversationId || '');
      if (conversation) {
        conversation.messages.push({
          role: 'assistant',
          content: response.content.map(c => 
            c.type === 'text' ? c.text : JSON.stringify(c)
          ).join('\n'),
        });
      }

      // Create tool results message
      const toolResultsMessage = toolCalls.map(tc => ({
        type: 'tool_result',
        tool_use_id: tc.id,
        content: tc.error ? `Error: ${tc.error}` : JSON.stringify(tc.result),
      }));

      // Send follow-up message with tool results
      const followUpResponse = await client.sendMessage(
        JSON.stringify(toolResultsMessage),
        conversationId
      );

      // Extract final response
      const followUpContent = followUpResponse.content[0];
      finalContent = followUpContent.type === 'text' ? followUpContent.text : '';
    }

    const responseData = {
      content: finalContent,
      toolCalls,
      usage: response.usage,
      model: response.model,
      conversationId,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Claude tools API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get available tools
export async function GET() {
  return NextResponse.json({
    tools: CLAUDE_TOOLS.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema.properties,
      required: tool.input_schema.required,
    })),
  });
}