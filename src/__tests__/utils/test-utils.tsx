import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/components/theme-provider'
import { NextIntlClientProvider } from 'next-intl'

// Mock messages for testing
const messages = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
  },
  auth: {
    login: 'Login',
    logout: 'Logout',
    signup: 'Sign Up',
    email: 'Email',
    password: 'Password',
    name: 'Name',
  },
  dashboard: {
    title: 'Dashboard',
    welcome: 'Welcome',
  },
  agents: {
    title: 'Agents',
    chat: 'Chat',
    nexy: 'Nexy',
    designer: 'Designer',
    developer: 'Developer',
  },
  canvas: {
    title: 'Canvas',
    workflow: 'Workflow',
    nodes: 'Nodes',
  },
}

interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Create a mock user for testing
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// Create mock conversation data
export const mockConversation = {
  id: '1',
  title: 'Test Conversation',
  agent: 'nexy' as const,
  userId: '1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [
    {
      id: '1',
      content: 'Hello, how can I help you?',
      role: 'assistant' as const,
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      content: 'I need help with my project',
      role: 'user' as const,
      timestamp: new Date().toISOString(),
    },
  ],
}

// Create mock workflow data
export const mockWorkflow = {
  id: '1',
  name: 'Test Workflow',
  description: 'A test workflow',
  nodes: [
    {
      id: '1',
      type: 'input',
      position: { x: 0, y: 0 },
      data: { label: 'Input' },
    },
    {
      id: '2',
      type: 'output',
      position: { x: 200, y: 0 },
      data: { label: 'Output' },
    },
  ],
  edges: [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      type: 'default',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// Create mock deployment data
export const mockDeployment = {
  id: 'dpl_123',
  url: 'https://test-project-123.vercel.app',
  state: 'READY' as const,
  createdAt: new Date().toISOString(),
  projectId: 'proj_123',
}

// Utility function to wait for async operations
export const waitFor = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms))

// Utility function to create mock fetch responses
export const createMockResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
})

// Utility to mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
  }
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }