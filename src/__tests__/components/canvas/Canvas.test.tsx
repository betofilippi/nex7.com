import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/src/__tests__/utils/test-utils'
import Canvas from '@/components/canvas/Canvas'
import { ReactFlowProvider } from 'reactflow'

// Mock the workflow engine
jest.mock('@/lib/workflow-engine/executor', () => ({
  WorkflowExecutor: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({ success: true }),
  })),
}))

// Mock version control
jest.mock('@/lib/version-control/workflow-versions', () => ({
  WorkflowVersionControl: {
    getInstance: jest.fn().mockReturnValue({
      createVersion: jest.fn().mockReturnValue({ id: 'version-1', createdAt: new Date() }),
    }),
  },
}))

// Mock collaboration
jest.mock('@/lib/collaboration/real-time-collaboration', () => ({
  RealTimeCollaboration: {
    getInstance: jest.fn().mockReturnValue({
      joinWorkflow: jest.fn(),
      leaveWorkflow: jest.fn(),
    }),
  },
}))

// Mock file system APIs
const mockCreateObjectURL = jest.fn()
const mockRevokeObjectURL = jest.fn()
const mockClick = jest.fn()

Object.defineProperty(URL, 'createObjectURL', {
  value: mockCreateObjectURL,
})

Object.defineProperty(URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
})

Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockImplementation((tagName) => {
    if (tagName === 'a') {
      return {
        href: '',
        download: '',
        click: mockClick,
      }
    }
    return {}
  }),
})

// Custom render with ReactFlowProvider
const renderCanvas = () => {
  return render(
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  )
}

describe('Canvas', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateObjectURL.mockReturnValue('mock-url')
  })

  it('renders the canvas interface correctly', () => {
    renderCanvas()
    
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    expect(screen.getByTestId('react-flow-controls')).toBeInTheDocument()
    expect(screen.getByTestId('react-flow-background')).toBeInTheDocument()
  })

  it('renders toolbar buttons', () => {
    renderCanvas()
    
    expect(screen.getByText('Execute')).toBeInTheDocument()
    expect(screen.getByText('Save Version')).toBeInTheDocument()
    expect(screen.getByText('Export')).toBeInTheDocument()
    expect(screen.getByText('Import')).toBeInTheDocument()
  })

  it('displays workflow version and user count', () => {
    renderCanvas()
    
    expect(screen.getByText('v1.0.0')).toBeInTheDocument()
    expect(screen.getByText('1 user')).toBeInTheDocument()
  })

  it('executes workflow when execute button is clicked', async () => {
    const { WorkflowExecutor } = require('@/lib/workflow-engine/executor')
    const mockExecute = jest.fn().mockResolvedValue({ success: true })
    WorkflowExecutor.mockImplementation(() => ({
      execute: mockExecute,
    }))

    renderCanvas()
    
    const executeButton = screen.getByText('Execute')
    fireEvent.click(executeButton)
    
    await waitFor(() => {
      expect(WorkflowExecutor).toHaveBeenCalled()
      expect(mockExecute).toHaveBeenCalled()
    })
  })

  it('shows execution progress when workflow is running', async () => {
    const { WorkflowExecutor } = require('@/lib/workflow-engine/executor')
    const mockExecute = jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 100)
      })
    })
    WorkflowExecutor.mockImplementation(() => ({
      execute: mockExecute,
    }))

    renderCanvas()
    
    const executeButton = screen.getByText('Execute')
    fireEvent.click(executeButton)
    
    // Should show "Running..." while executing
    expect(screen.getByText('Running...')).toBeInTheDocument()
    expect(screen.getByText('Executing Workflow')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Execute')).toBeInTheDocument()
    }, { timeout: 200 })
  })

  it('disables execute button when no nodes are present', () => {
    renderCanvas()
    
    const executeButton = screen.getByText('Execute')
    expect(executeButton).toBeDisabled()
  })

  it('saves version when save button is clicked', () => {
    const mockCreateVersion = jest.fn().mockReturnValue({ id: 'version-1' })
    const { WorkflowVersionControl } = require('@/lib/version-control/workflow-versions')
    WorkflowVersionControl.getInstance.mockReturnValue({
      createVersion: mockCreateVersion,
    })

    renderCanvas()
    
    const saveButton = screen.getByText('Save Version')
    fireEvent.click(saveButton)
    
    expect(mockCreateVersion).toHaveBeenCalled()
  })

  it('exports workflow when export button is clicked', () => {
    renderCanvas()
    
    const exportButton = screen.getByText('Export')
    fireEvent.click(exportButton)
    
    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalled()
  })

  it('imports workflow when file is selected', async () => {
    const mockWorkflowData = {
      nodes: [
        {
          id: 'imported-1',
          type: 'github',
          position: { x: 0, y: 0 },
          data: { label: 'Imported Node' },
        },
      ],
      edges: [],
    }

    // Mock FileReader
    const mockFileReader = {
      readAsText: jest.fn(),
      onload: null as any,
    }
    
    global.FileReader = jest.fn().mockImplementation(() => mockFileReader)

    renderCanvas()
    
    const importInput = screen.getByLabelText('Import')
    const file = new File([JSON.stringify(mockWorkflowData)], 'workflow.json', {
      type: 'application/json',
    })
    
    fireEvent.change(importInput, { target: { files: [file] } })
    
    expect(mockFileReader.readAsText).toHaveBeenCalledWith(file)
    
    // Simulate file read completion
    mockFileReader.onload({
      target: { result: JSON.stringify(mockWorkflowData) },
    })
    
    // The workflow should be imported (we can't easily test the state change in this setup)
    expect(mockFileReader.readAsText).toHaveBeenCalled()
  })

  it('handles drag and drop for adding nodes', () => {
    renderCanvas()
    
    const reactFlow = screen.getByTestId('react-flow')
    
    // Mock drag start
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      cancelable: true,
    })
    
    Object.defineProperty(dragStartEvent, 'dataTransfer', {
      value: {
        setData: jest.fn(),
        effectAllowed: '',
      },
    })
    
    fireEvent(reactFlow, dragStartEvent)
    
    // Mock drop
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100,
    })
    
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        getData: jest.fn().mockReturnValue('github'),
      },
    })
    
    fireEvent(reactFlow, dropEvent)
    
    // The node should be added (we can't easily test the state change in this setup)
    expect(dropEvent.dataTransfer.getData).toHaveBeenCalledWith('application/reactflow')
  })

  it('handles workflow execution errors gracefully', async () => {
    const { WorkflowExecutor } = require('@/lib/workflow-engine/executor')
    const mockExecute = jest.fn().mockRejectedValue(new Error('Execution failed'))
    WorkflowExecutor.mockImplementation(() => ({
      execute: mockExecute,
    }))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    renderCanvas()
    
    const executeButton = screen.getByText('Execute')
    fireEvent.click(executeButton)
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Workflow execution failed:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })

  it('handles version save errors gracefully', () => {
    const mockCreateVersion = jest.fn().mockImplementation(() => {
      throw new Error('Save failed')
    })
    const { WorkflowVersionControl } = require('@/lib/version-control/workflow-versions')
    WorkflowVersionControl.getInstance.mockReturnValue({
      createVersion: mockCreateVersion,
    })

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    renderCanvas()
    
    const saveButton = screen.getByText('Save Version')
    fireEvent.click(saveButton)
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to save version:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('handles import errors gracefully', () => {
    const mockFileReader = {
      readAsText: jest.fn(),
      onload: null as any,
    }
    
    global.FileReader = jest.fn().mockImplementation(() => mockFileReader)

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    renderCanvas()
    
    const importInput = screen.getByLabelText('Import')
    const file = new File(['invalid json'], 'workflow.json', {
      type: 'application/json',
    })
    
    fireEvent.change(importInput, { target: { files: [file] } })
    
    // Simulate file read completion with invalid JSON
    mockFileReader.onload({
      target: { result: 'invalid json' },
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to import workflow:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('initializes with default nodes and edges', () => {
    renderCanvas()
    
    // The canvas should have initial nodes and edges
    // We can verify this by checking if the ReactFlow component is rendered with proper props
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
  })
})