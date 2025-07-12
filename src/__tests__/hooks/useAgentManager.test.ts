import { renderHook, act, waitFor } from '@/src/__tests__/utils/test-utils'
import { useAgentManager } from '@/hooks/useAgentManager'
import { getClaudeClient } from '@/lib/claude-client'
import { getAgentManager } from '@/lib/agents/manager'
import { getAgent } from '@/lib/agents/definitions'

// Mock dependencies
jest.mock('@/lib/claude-client')
jest.mock('@/lib/agents/manager')
jest.mock('@/lib/agents/definitions')

const mockGetClaudeClient = getClaudeClient as jest.MockedFunction<typeof getClaudeClient>
const mockGetAgentManager = getAgentManager as jest.MockedFunction<typeof getAgentManager>
const mockGetAgent = getAgent as jest.MockedFunction<typeof getAgent>

describe('useAgentManager', () => {
  const mockApiKey = 'test-api-key'
  const mockConversationId = 'conv-123'
  
  const mockAgent = {
    id: 'nexy',
    name: 'Nexy',
    role: 'AI Assistant',
    greeting: 'Hello! How can I help you today?',
    color: '#3B82F6',
    avatar: '🤖',
    personality: {
      traits: ['helpful', 'friendly'],
      tone: 'professional',
      communicationStyle: 'clear',
    },
    capabilities: [],
    context: {
      systemPrompt: 'You are Nexy, a helpful AI assistant.',
      tools: [],
      memorySize: 1000,
    },
    metadata: {
      version: '1.0.0',
      author: 'Nex7',
      description: 'AI Assistant',
      tags: ['chat', 'assistant'],
    },
  }

  const mockAgentManager = {
    createConversation: jest.fn().mockReturnValue(mockConversationId),
    sendMessage: jest.fn(),
    switchAgent: jest.fn().mockReturnValue(true),
    clearConversation: jest.fn(),
    getConversationHistory: jest.fn().mockReturnValue([]),
    setContext: jest.fn(),
    getContext: jest.fn(),
  }

  const mockClaudeClient = {
    messages: {
      create: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetClaudeClient.mockReturnValue(mockClaudeClient as any)
    mockGetAgentManager.mockReturnValue(mockAgentManager as any)
    mockGetAgent.mockReturnValue(mockAgent as any)
  })

  it('initializes correctly with default agent', async () => {
    const { result } = renderHook(() =>
      useAgentManager({ apiKey: mockApiKey })
    )

    await waitFor(() => {
      expect(result.current.conversationId).toBe(mockConversationId)
      expect(result.current.activeAgent).toEqual(mockAgent)
      expect(result.current.messages).toHaveLength(1)
      expect(result.current.messages[0].content).toBe(mockAgent.greeting)
    })

    expect(mockGetClaudeClient).toHaveBeenCalledWith(mockApiKey)
    expect(mockGetAgentManager).toHaveBeenCalledWith(mockClaudeClient)
    expect(mockAgentManager.createConversation).toHaveBeenCalledWith('nexy')
  })

  it('initializes with custom initial agent', async () => {
    const customAgent = { ...mockAgent, id: 'designer', greeting: 'Hello from Designer!' }
    mockGetAgent.mockReturnValue(customAgent as any)

    const { result } = renderHook(() =>
      useAgentManager({ apiKey: mockApiKey, initialAgentId: 'designer' })
    )

    await waitFor(() => {
      expect(result.current.activeAgent).toEqual(customAgent)
      expect(result.current.messages[0].content).toBe('Hello from Designer!')
    })

    expect(mockAgentManager.createConversation).toHaveBeenCalledWith('designer')
  })

  it('sends message successfully', async () => {
    const mockResponse = {
      role: 'assistant' as const,
      content: 'This is a response',
      agentId: 'nexy',
      timestamp: new Date(),
    }

    mockAgentManager.sendMessage.mockResolvedValue(mockResponse)
    mockAgentManager.getConversationHistory.mockReturnValue([mockResponse])

    const { result } = renderHook(() =>
      useAgentManager({ apiKey: mockApiKey })
    )

    await waitFor(() => {
      expect(result.current.conversationId).toBeTruthy()
    })

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    expect(mockAgentManager.sendMessage).toHaveBeenCalledWith(
      mockConversationId,
      'Hello',
      'nexy'
    )
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('handles message sending errors', async () => {
    const error = new Error('Failed to send message')
    mockAgentManager.sendMessage.mockRejectedValue(error)

    const { result } = renderHook(() =>
      useAgentManager({ apiKey: mockApiKey })
    )

    await waitFor(() => {
      expect(result.current.conversationId).toBeTruthy()
    })

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    expect(result.current.error).toBe('Failed to send message')
    expect(result.current.isLoading).toBe(false)
  })

  it('switches agent successfully', async () => {
    const onAgentSwitch = jest.fn()
    const { result } = renderHook(() =>
      useAgentManager({ apiKey: mockApiKey, onAgentSwitch })
    )

    await waitFor(() => {
      expect(result.current.conversationId).toBeTruthy()
    })

    const newAgent = { ...mockAgent, id: 'designer' }
    mockGetAgent.mockReturnValue(newAgent as any)

    act(() => {
      result.current.switchAgent('designer')
    })

    expect(mockAgentManager.switchAgent).toHaveBeenCalledWith(
      mockConversationId,
      'designer'
    )
    expect(onAgentSwitch).toHaveBeenCalledWith('nexy', 'designer')
    expect(result.current.activeAgent).toEqual(newAgent)
    expect(result.current.suggestedAgent).toBeNull()
  })

  it('handles agent switch failure', async () => {
    mockAgentManager.switchAgent.mockReturnValue(false)

    const { result } = renderHook(() =>
      useAgentManager({ apiKey: mockApiKey })
    )

    await waitFor(() => {
      expect(result.current.conversationId).toBeTruthy()
    })

    const originalAgent = result.current.activeAgent

    act(() => {
      result.current.switchAgent('designer')
    })

    expect(result.current.activeAgent).toEqual(originalAgent)
  })

  it('clears conversation successfully', async () => {
    const { result } = renderHook(() =>
      useAgentManager({ apiKey: mockApiKey })
    )

    await waitFor(() => {
      expect(result.current.conversationId).toBeTruthy()
    })

    act(() => {
      result.current.clearConversation()
    })

    expect(mockAgentManager.clearConversation).toHaveBeenCalledWith(mockConversationId)
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].content).toBe(mockAgent.greeting)
    expect(result.current.suggestedAgent).toBeNull()
  })

  it('manages context correctly', async () => {
    const { result } = renderHook(() =>
      useAgentManager({ apiKey: mockApiKey })
    )

    await waitFor(() => {
      expect(result.current.conversationId).toBeTruthy()
    })

    act(() => {
      result.current.setContext('key', 'value')
    })

    expect(mockAgentManager.setContext).toHaveBeenCalledWith(
      mockConversationId,
      'key',
      'value'
    )

    mockAgentManager.getContext.mockReturnValue('value')

    const value = result.current.getContext('key')
    expect(value).toBe('value')
    expect(mockAgentManager.getContext).toHaveBeenCalledWith(mockConversationId, 'key')
  })

  it('handles suggested agent from response', async () => {
    const mockResponse = {
      role: 'assistant' as const,
      content: 'You might want to switch to the designer',
      agentId: 'nexy',
      timestamp: new Date(),
      metadata: { suggestedNextAgent: 'designer' },
    }

    mockAgentManager.sendMessage.mockResolvedValue(mockResponse)

    const { result } = renderHook(() =>
      useAgentManager({ apiKey: mockApiKey })
    )

    await waitFor(() => {
      expect(result.current.conversationId).toBeTruthy()
    })

    await act(async () => {
      await result.current.sendMessage('I need help with design')
    })

    expect(result.current.suggestedAgent).toBe('designer')
  })

  it('calls onMessage callback when provided', async () => {
    const onMessage = jest.fn()
    const mockResponse = {
      role: 'assistant' as const,
      content: 'Response',
      agentId: 'nexy',
      timestamp: new Date(),
    }

    mockAgentManager.sendMessage.mockResolvedValue(mockResponse)

    const { result } = renderHook(() =>
      useAgentManager({ apiKey: mockApiKey, onMessage })
    )

    await waitFor(() => {
      expect(result.current.conversationId).toBeTruthy()
    })

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    expect(onMessage).toHaveBeenCalledWith(mockResponse)
  })

  it('handles initialization errors', async () => {
    const error = new Error('Initialization failed')
    mockGetClaudeClient.mockImplementation(() => {
      throw error
    })

    const { result } = renderHook(() =>
      useAgentManager({ apiKey: 'invalid-key' })
    )

    await waitFor(() => {
      expect(result.current.error).toBe('Initialization failed')
    })
  })

  it('returns undefined for context operations when not initialized', () => {
    mockGetClaudeClient.mockImplementation(() => {
      throw new Error('Failed')
    })

    const { result } = renderHook(() =>
      useAgentManager({ apiKey: 'invalid-key' })
    )

    const value = result.current.getContext('key')
    expect(value).toBeUndefined()

    act(() => {
      result.current.setContext('key', 'value')
    })

    // Should not throw or cause issues
    expect(mockAgentManager.setContext).not.toHaveBeenCalled()
  })

  it('handles sendMessage when not initialized', async () => {
    mockGetClaudeClient.mockImplementation(() => {
      throw new Error('Failed')
    })

    const { result } = renderHook(() =>
      useAgentManager({ apiKey: 'invalid-key' })
    )

    await act(async () => {
      await result.current.sendMessage('Hello')
    })

    expect(result.current.error).toBe('Agent manager not initialized')
  })
})