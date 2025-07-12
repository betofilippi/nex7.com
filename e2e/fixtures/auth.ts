import { test as base, expect } from '@playwright/test'

// Define the type for our authenticated user
interface AuthenticatedUser {
  email: string
  password: string
  name: string
  token?: string
}

// Extend the base test with authentication
export const test = base.extend<{
  authenticatedUser: AuthenticatedUser
}>({
  authenticatedUser: async ({ page }, use) => {
    // Create a test user
    const user: AuthenticatedUser = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    }

    // Navigate to login page
    await page.goto('/login')
    
    // Check if we need to sign up first
    const signupLink = page.locator('text=Sign up')
    if (await signupLink.isVisible()) {
      await signupLink.click()
      
      // Fill signup form
      await page.fill('[data-testid="name-input"]', user.name)
      await page.fill('[data-testid="email-input"]', user.email)
      await page.fill('[data-testid="password-input"]', user.password)
      await page.click('[data-testid="signup-button"]')
      
      // Wait for redirect to dashboard
      await page.waitForURL('/dashboard')
    } else {
      // Fill login form
      await page.fill('[data-testid="email-input"]', user.email)
      await page.fill('[data-testid="password-input"]', user.password)
      await page.click('[data-testid="login-button"]')
      
      // Wait for redirect to dashboard
      await page.waitForURL('/dashboard')
    }
    
    // Verify we're logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    await use(user)
  },
})

export { expect }