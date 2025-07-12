import { test, expect } from './fixtures/auth'

test.describe('Agent System', () => {
  test('should display agents page correctly', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    await expect(page.locator('h1')).toContainText('Agents')
    await expect(page.locator('[data-testid="agent-chat"]')).toBeVisible()
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible()
  })

  test('should show default agent (Nexy) on load', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    await expect(page.locator('[data-testid="active-agent-name"]')).toContainText('Nexy')
    await expect(page.locator('[data-testid="agent-greeting"]')).toBeVisible()
    await expect(page.locator('[data-testid="message-input"]')).toHaveAttribute('placeholder', /Ask Nexy/)
  })

  test('should send message to agent', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    const messageInput = page.locator('[data-testid="message-input"]')
    const sendButton = page.locator('[data-testid="send-button"]')
    
    await messageInput.fill('Hello, can you help me with my project?')
    await sendButton.click()
    
    // Should see user message in chat
    await expect(page.locator('[data-testid="user-message"]').last()).toContainText('Hello, can you help me with my project?')
    
    // Should see agent response
    await expect(page.locator('[data-testid="agent-message"]').last()).toBeVisible()
    
    // Input should be cleared
    await expect(messageInput).toHaveValue('')
  })

  test('should send message with Enter key', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    const messageInput = page.locator('[data-testid="message-input"]')
    
    await messageInput.fill('Test message with Enter')
    await messageInput.press('Enter')
    
    await expect(page.locator('[data-testid="user-message"]').last()).toContainText('Test message with Enter')
  })

  test('should not send empty messages', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    const sendButton = page.locator('[data-testid="send-button"]')
    
    // Send button should be disabled when input is empty
    await expect(sendButton).toBeDisabled()
    
    // Fill with spaces only
    await page.locator('[data-testid="message-input"]').fill('   ')
    await expect(sendButton).toBeDisabled()
  })

  test('should switch between agents', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    // Click on designer agent
    await page.click('[data-testid="agent-designer"]')
    
    await expect(page.locator('[data-testid="active-agent-name"]')).toContainText('Designer')
    await expect(page.locator('[data-testid="message-input"]')).toHaveAttribute('placeholder', /Ask Designer/)
    
    // Should see switch message in chat
    await expect(page.locator('[data-testid="system-message"]').last()).toContainText('Switched to Designer')
  })

  test('should show agent capabilities', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    // Should show quick action buttons for agent capabilities
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible()
    await expect(page.locator('[data-testid="capability-button"]').first()).toBeVisible()
  })

  test('should use quick action buttons', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    const messageInput = page.locator('[data-testid="message-input"]')
    const firstCapabilityButton = page.locator('[data-testid="capability-button"]').first()
    
    await firstCapabilityButton.click()
    
    // Should fill input with capability trigger
    await expect(messageInput).not.toHaveValue('')
  })

  test('should show agent suggestion when appropriate', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    // Send a message that might trigger agent suggestion
    await page.fill('[data-testid="message-input"]', 'I need help designing a UI component')
    await page.click('[data-testid="send-button"]')
    
    // Wait for response and check for suggestion
    await page.waitForSelector('[data-testid="agent-message"]', { timeout: 10000 })
    
    // Check if agent suggestion appears
    const suggestion = page.locator('[data-testid="agent-suggestion"]')
    if (await suggestion.isVisible()) {
      await expect(suggestion).toContainText('Switch to')
    }
  })

  test('should accept agent suggestion', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    // Send a message that might trigger agent suggestion
    await page.fill('[data-testid="message-input"]', 'Help me design a landing page')
    await page.click('[data-testid="send-button"]')
    
    // Wait for response
    await page.waitForSelector('[data-testid="agent-message"]', { timeout: 10000 })
    
    // Check if agent suggestion appears and click it
    const suggestionButton = page.locator('[data-testid="switch-agent-button"]')
    if (await suggestionButton.isVisible()) {
      await suggestionButton.click()
      
      // Should switch to suggested agent
      await expect(page.locator('[data-testid="active-agent-name"]')).not.toContainText('Nexy')
    }
  })

  test('should maintain conversation history when switching agents', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    // Send a message
    await page.fill('[data-testid="message-input"]', 'First message')
    await page.click('[data-testid="send-button"]')
    
    await page.waitForSelector('[data-testid="agent-message"]')
    
    // Switch agent
    await page.click('[data-testid="agent-developer"]')
    
    // Previous messages should still be visible
    await expect(page.locator('[data-testid="user-message"]')).toContainText('First message')
  })

  test('should show typing indicator during response', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    await page.fill('[data-testid="message-input"]', 'Tell me about your capabilities')
    await page.click('[data-testid="send-button"]')
    
    // Should show typing indicator while waiting for response
    await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible()
    
    // Wait for response
    await page.waitForSelector('[data-testid="agent-message"]', { timeout: 10000 })
    
    // Typing indicator should be gone
    await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible()
  })

  test('should display message timestamps', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    await page.fill('[data-testid="message-input"]', 'Test message')
    await page.click('[data-testid="send-button"]')
    
    // Should see timestamp on user message
    await expect(page.locator('[data-testid="message-timestamp"]').first()).toBeVisible()
  })

  test('should handle agent errors gracefully', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    // Mock an API error response
    await page.route('**/api/agents/chat', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    await page.fill('[data-testid="message-input"]', 'This will cause an error')
    await page.click('[data-testid="send-button"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })

  test('should save conversation history', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    // Send multiple messages
    await page.fill('[data-testid="message-input"]', 'First message')
    await page.click('[data-testid="send-button"]')
    
    await page.waitForSelector('[data-testid="agent-message"]')
    
    await page.fill('[data-testid="message-input"]', 'Second message')
    await page.click('[data-testid="send-button"]')
    
    await page.waitForSelector('[data-testid="agent-message"]')
    
    // Reload page
    await page.reload()
    
    // Messages should still be there
    await expect(page.locator('[data-testid="user-message"]')).toHaveCount(2)
  })

  test('should clear conversation when requested', async ({ page, authenticatedUser }) => {
    await page.goto('/agents')
    
    // Send a message
    await page.fill('[data-testid="message-input"]', 'Test message')
    await page.click('[data-testid="send-button"]')
    
    await page.waitForSelector('[data-testid="agent-message"]')
    
    // Clear conversation
    await page.click('[data-testid="clear-conversation"]')
    
    // Should only see greeting message
    await expect(page.locator('[data-testid="user-message"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="agent-greeting"]')).toBeVisible()
  })

  test('should work on mobile viewport', async ({ page, authenticatedUser }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/agents')
    
    // Should be responsive
    await expect(page.locator('[data-testid="agent-chat"]')).toBeVisible()
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible()
    
    // Should be able to send messages
    await page.fill('[data-testid="message-input"]', 'Mobile test')
    await page.click('[data-testid="send-button"]')
    
    await expect(page.locator('[data-testid="user-message"]').last()).toContainText('Mobile test')
  })
})