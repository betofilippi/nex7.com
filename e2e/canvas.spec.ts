import { test, expect } from './fixtures/auth'

test.describe('Canvas Workflow System', () => {
  test('should display canvas page correctly', async ({ page, authenticatedUser }) => {
    await page.goto('/canvas')
    
    await expect(page.locator('[data-testid="react-flow"]')).toBeVisible()
    await expect(page.locator('[data-testid="node-palette"]')).toBeVisible()
    await expect(page.locator('[data-testid="workflow-toolbar"]')).toBeVisible()
  })

  test('should show workflow controls', async ({ page, authenticatedUser }) => {
    await page.goto('/canvas')
    
    await expect(page.locator('button:has-text("Execute")')).toBeVisible()
    await expect(page.locator('button:has-text("Save Version")')).toBeVisible()
    await expect(page.locator('button:has-text("Export")')).toBeVisible()
    await expect(page.locator('text=Import')).toBeVisible()
  })

  test('should drag and drop nodes from palette', async ({ page, authenticatedUser }) => {
    await page.goto('/canvas')
    
    // Find a node in the palette
    const githubNode = page.locator('[data-testid="node-github"]')
    await expect(githubNode).toBeVisible()
    
    // Get the canvas area
    const canvas = page.locator('[data-testid="react-flow"]')
    
    // Drag and drop the node
    await githubNode.dragTo(canvas, {
      targetPosition: { x: 300, y: 200 }
    })
    
    // Verify node was added to canvas
    // Note: This test assumes the implementation adds a data-testid to nodes
    await expect(page.locator('[data-node-type="github"]')).toBeVisible()
  })

  test('should connect nodes with edges', async ({ page, authenticatedUser }) => {
    await page.goto('/canvas')
    
    // Add two nodes first
    const githubNode = page.locator('[data-testid="node-github"]')
    const claudeNode = page.locator('[data-testid="node-claude"]')
    const canvas = page.locator('[data-testid="react-flow"]')
    
    await githubNode.dragTo(canvas, { targetPosition: { x: 200, y: 200 } })
    await claudeNode.dragTo(canvas, { targetPosition: { x: 400, y: 200 } })
    
    // Connect nodes by dragging from output to input handle
    const sourceHandle = page.locator('[data-node-type="github"] [data-handlepos="right"]')
    const targetHandle = page.locator('[data-node-type="claude"] [data-handlepos="left"]')
    
    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      await sourceHandle.dragTo(targetHandle)
      
      // Verify edge was created
      await expect(page.locator('[data-testid="rf__edge"]')).toBeVisible()
    }
  })

  test('should execute workflow', async ({ page, authenticatedUser }) => {
    await page.goto('/canvas')
    
    // Need at least one node to execute
    const githubNode = page.locator('[data-testid="node-github"]')
    const canvas = page.locator('[data-testid="react-flow"]')
    
    await githubNode.dragTo(canvas, { targetPosition: { x: 300, y: 200 } })
    
    // Click execute button
    const executeButton = page.locator('button:has-text("Execute")')
    await executeButton.click()
    
    // Should show execution progress
    await expect(page.locator('text=Executing Workflow')).toBeVisible()
    
    // Wait for execution to complete
    await page.waitForSelector('text=Executing Workflow', { state: 'hidden', timeout: 10000 })
  })

  test('should save workflow version', async ({ page, authenticatedUser }) => {
    await page.goto('/canvas')
    
    const saveButton = page.locator('button:has-text("Save Version")')
    await saveButton.click()
    
    // Should show success indication or toast
    // This depends on how the UI provides feedback
    await page.waitForTimeout(1000) // Give time for save operation
  })

  test('should export workflow', async ({ page, authenticatedUser }) => {
    await page.goto('/canvas')
    
    // Start download
    const downloadPromise = page.waitForEvent('download')
    
    const exportButton = page.locator('button:has-text("Export")')
    await exportButton.click()
    
    const download = await downloadPromise
    
    // Verify download started
    expect(download.suggestedFilename()).toMatch(/workflow.*\.json/)
  })

  test('should import workflow', async ({ page, authenticatedUser }) => {
    await page.goto('/canvas')
    
    // Create a test workflow file
    const workflowData = {
      nodes: [
        {
          id: 'test-node',
          type: 'github',
          position: { x: 100, y: 100 },
          data: { label: 'Test Node' }
        }
      ],
      edges: [],
      version: '1.0.0'
    }
    
    // Create a file input
    const fileInput = page.locator('input[type="file"]')
    
    // Upload the file
    await fileInput.setInputFiles({
      name: 'test-workflow.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(workflowData))
    })
    
    // Verify workflow was imported
    await expect(page.locator('[data-node-id="test-node"]')).toBeVisible()
  })

  test('should edit node properties', async ({ page, authenticatedUser }) => {
    await page.goto('/canvas')
    
    // Add a node
    const githubNode = page.locator('[data-testid="node-github"]')
    const canvas = page.locator('[data-testid="react-flow"]')
    
    await githubNode.dragTo(canvas, { targetPosition: { x: 300, y: 200 } })
    
    // Double-click or right-click on node to edit
    const addedNode = page.locator('[data-node-type="github"]')
    await addedNode.dblclick()
    
    // Should open node editor
    await expect(page.locator('[data-testid="node-editor"]')).toBeVisible()
    
    // Close editor
    await page.click('[data-testid="close-editor"]')
    await expect(page.locator('[data-testid="node-editor"]')).not.toBeVisible()
  })

  test('should delete nodes', async ({ page, authenticatedUser }) => {
    await page.goto('/canvas')
    
    // Add a node
    const githubNode = page.locator('[data-testid="node-github"]')
    const canvas = page.locator('[data-testid="react-flow"]')
    
    await githubNode.dragTo(canvas, { targetPosition: { x: 300, y: 200 } })
    
    // Select and delete node
    const addedNode = page.locator('[data-node-type="github"]')
    await addedNode.click()
    
    // Press delete key
    await page.keyboard.press('Delete')
    
    // Node should be removed
    await expect(addedNode).not.toBeVisible()
  })

  test('should show node palette with all node types', async ({ page, authenticatedUser }) => {
    await page.goto('/canvas')
    
    const palette = page.locator('[data-testid="node-palette"]')
    await expect(palette).toBeVisible()
    
    // Check for various node types
    await expect(page.locator('[data-testid="node-github"]')).toBeVisible()
    await expect(page.locator('[data-testid="node-claude"]')).toBeVisible()
    await expect(page.locator('[data-testid="node-vercel"]')).toBeVisible()
    await expect(page.locator('[data-testid="node-api"]')).toBeVisible()
  })

  test('should zoom and pan canvas', async ({ page, authenticatedUser }) => {
    await page.goto('/canvas')
    
    const canvas = page.locator('[data-testid="react-flow"]')
    
    // Test zoom with mouse wheel
    await canvas.hover()
    await page.mouse.wheel(0, 100) // Zoom out
    await page.mouse.wheel(0, -100) // Zoom in
    
    // Test panning
    await canvas.click({ position: { x: 200, y: 200 } })
    await page.mouse.down()
    await page.mouse.move(300, 300)
    await page.mouse.up()
  })

  test('should work on mobile viewport', async ({ page, authenticatedUser }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/canvas')
    
    // Should be responsive
    await expect(page.locator('[data-testid="react-flow"]')).toBeVisible()
    await expect(page.locator('[data-testid="workflow-toolbar"]')).toBeVisible()
    
    // Mobile-specific interactions
    const executeButton = page.locator('button:has-text("Execute")')
    await expect(executeButton).toBeVisible()
  })

  test('should handle workflow execution errors', async ({ page, authenticatedUser }) => {
    await page.goto('/canvas')
    
    // Mock API to return error
    await page.route('**/api/workflow/execute', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Execution failed' })
      })
    })
    
    // Add a node and try to execute
    const githubNode = page.locator('[data-testid="node-github"]')
    const canvas = page.locator('[data-testid="react-flow"]')
    
    await githubNode.dragTo(canvas, { targetPosition: { x: 300, y: 200 } })
    
    const executeButton = page.locator('button:has-text("Execute")')
    await executeButton.click()
    
    // Should show error message
    await expect(page.locator('text=execution failed')).toBeVisible()
  })
})