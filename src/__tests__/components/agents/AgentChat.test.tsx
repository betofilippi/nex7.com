import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/src/__tests__/utils/test-utils'
import { AgentChat } from '@/components/agents/AgentChat'
import { Agent } from '@/lib/agents/definitions'
import { AgentMessage } from '@/lib/agents/manager'

// Mock the agent definitions
jest.mock('@/lib/agents/definitions', () => ({
  agents: {
    nexy: {
      id: 'nexy',
      name: 'Nexy',
      role: 'AI Assistant',
      color: '#3B82F6',
      capabilities: [
        {
          name: 'chat',
          description: 'Chat with me',
          triggers: ['help', 'chat'],
        },
      ],
    },
  },
}))

const mockAgent: Agent = {
  id: 'nexy',
  name: 'Nexy',
  role: 'AI Assistant',
  color: '#3B82F6',
  avatar: '🤖',
  personality: {
    traits: ['helpful', 'friendly'],
    tone: 'professional',
    communicationStyle: 'clear',
  },
  capabilities: [
    {
      name: 'chat',
      description: 'Chat with me',
      triggers: ['help', 'chat'],
      handler: jest.fn(),
    },
  ],
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

const mockMessages: AgentMessage[] = [
  {
    id: '1',
    conversationId: 'conv-1',
    agentId: 'nexy',
    role: 'assistant',
    content: 'Hello! How can I help you today?',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    conversationId: 'conv-1',
    agentId: 'user',
    role: 'user',
    content: 'I need help with my project',
    timestamp: new Date().toISOString(),
  },
]

const defaultProps = {
  conversationId: 'conv-1',
  activeAgent: mockAgent,
  messages: mockMessages,
  onSendMessage: jest.fn(),
  onSwitchAgent: jest.fn(),
  isLoading: false,
}

describe('AgentChat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the agent chat interface correctly', () => {
    render(<AgentChat {...defaultProps} />)
    
    expect(screen.getByText('Nexy')).toBeInTheDocument()
    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ask Nexy anything...')).toBeInTheDocument()
  })

  it('displays messages correctly', () => {
    render(<AgentChat {...defaultProps} />)
    
    expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
    expect(screen.getByText('I need help with my project')).toBeInTheDocument()
  })

  it('sends message when send button is clicked', async () => {
    const mockOnSendMessage = jest.fn().mockResolvedValue(undefined)
    
    render(<AgentChat {...defaultProps} onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByPlaceholderText('Ask Nexy anything...')
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message')
    })
  })

  it('sends message when Enter key is pressed', async () => {
    const mockOnSendMessage = jest.fn().mockResolvedValue(undefined)
    
    render(<AgentChat {...defaultProps} onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByPlaceholderText('Ask Nexy anything...')
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    
    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message')
    })
  })

  it('disables send button when input is empty', () => {
    render(<AgentChat {...defaultProps} />)
    
    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).toBeDisabled()
  })

  it('disables input and send button when loading', () => {
    render(<AgentChat {...defaultProps} isLoading={true} />)
    
    const input = screen.getByPlaceholderText('Ask Nexy anything...')
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    expect(input).toBeDisabled()
    expect(sendButton).toBeDisabled()
  })

  it('shows typing indicator when loading', () => {
    render(<AgentChat {...defaultProps} isLoading={true} />)
    
    // The typing indicator should be visible
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('shows agent switch suggestion when provided', () => {
    render(
      <AgentChat 
        {...defaultProps} 
        suggestedAgent="designer"
        onSwitchAgent={jest.fn()}
      />
    )
    
    expect(screen.getByText('Suggested:')).toBeInTheDocument()
    expect(screen.getByText('Switch to designer')).toBeInTheDocument()
  })

  it('calls onSwitchAgent when switch button is clicked', () => {
    const mockOnSwitchAgent = jest.fn()
    
    render(
      <AgentChat 
        {...defaultProps} 
        suggestedAgent="designer"
        onSwitchAgent={mockOnSwitchAgent}
      />
    )
    
    const switchButton = screen.getByText('Switch to designer')
    fireEvent.click(switchButton)
    
    expect(mockOnSwitchAgent).toHaveBeenCalledWith('designer')
  })

  it('displays quick action buttons for agent capabilities', () => {
    render(<AgentChat {...defaultProps} />)
    
    expect(screen.getByText('Chat with me')).toBeInTheDocument()
  })

  it('fills input when quick action button is clicked', () => {
    render(<AgentChat {...defaultProps} />)
    
    const quickActionButton = screen.getByText('Chat with me')
    fireEvent.click(quickActionButton)
    
    const input = screen.getByPlaceholderText('Ask Nexy anything...')
    expect(input).toHaveValue('help')
  })

  it('clears input after sending message', async () => {
    const mockOnSendMessage = jest.fn().mockResolvedValue(undefined)
    
    render(<AgentChat {...defaultProps} onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByPlaceholderText('Ask Nexy anything...')
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('handles message sending errors gracefully', async () => {
    const mockOnSendMessage = jest.fn().mockRejectedValue(new Error('Network error'))
    
    render(<AgentChat {...defaultProps} onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByPlaceholderText('Ask Nexy anything...')
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message')
    })
    
    // Input should still be cleared even on error
    expect(input).toHaveValue('')
  })

  it('prevents sending empty or whitespace-only messages', () => {
    const mockOnSendMessage = jest.fn()
    
    render(<AgentChat {...defaultProps} onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByPlaceholderText('Ask Nexy anything...')
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    // Try sending empty message
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.click(sendButton)
    
    expect(mockOnSendMessage).not.toHaveBeenCalled()
    
    // Try sending whitespace-only message
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.click(sendButton)
    
    expect(mockOnSendMessage).not.toHaveBeenCalled()
  })

  it('formats message timestamps correctly', () => {
    const testDate = new Date('2024-01-01T12:00:00Z')
    const messagesWithTimestamp: AgentMessage[] = [
      {
        id: '1',
        conversationId: 'conv-1',
        agentId: 'nexy',
        role: 'assistant',
        content: 'Test message',
        timestamp: testDate.toISOString(),
      },
    ]
    
    render(<AgentChat {...defaultProps} messages={messagesWithTimestamp} />)
    
    expect(screen.getByText(testDate.toLocaleTimeString())).toBeInTheDocument()
  })
})