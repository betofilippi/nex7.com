import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login')
    
    await expect(page.locator('h1')).toContainText(['Login', 'Sign In'])
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible()
  })

  test('should display signup page correctly', async ({ page }) => {
    await page.goto('/signup')
    
    await expect(page.locator('h1')).toContainText(['Sign Up', 'Register'])
    await expect(page.locator('[data-testid="name-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="signup-button"]')).toBeVisible()
  })

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login')
    
    await page.click('[data-testid="login-button"]')
    
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email-input"]', 'invalid-email')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="login-button"]')
    
    await expect(page.locator('text=Invalid email format')).toBeVisible()
  })

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/signup')
    
    const timestamp = Date.now()
    const testEmail = `test-${timestamp}@example.com`
    
    await page.fill('[data-testid="name-input"]', 'Test User')
    await page.fill('[data-testid="email-input"]', testEmail)
    await page.fill('[data-testid="password-input"]', 'password123')
    
    await page.click('[data-testid="signup-button"]')
    
    // Should redirect to dashboard after successful signup
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should login existing user successfully', async ({ page }) => {
    // First, create a user by signing up
    await page.goto('/signup')
    
    const timestamp = Date.now()
    const testEmail = `test-${timestamp}@example.com`
    
    await page.fill('[data-testid="name-input"]', 'Test User')
    await page.fill('[data-testid="email-input"]', testEmail)
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signup-button"]')
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    
    // Now test login
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', testEmail)
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email-input"]', 'nonexistent@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('should logout user successfully', async ({ page }) => {
    // First login
    await page.goto('/signup')
    
    const timestamp = Date.now()
    const testEmail = `test-${timestamp}@example.com`
    
    await page.fill('[data-testid="name-input"]', 'Test User')
    await page.fill('[data-testid="email-input"]', testEmail)
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signup-button"]')
    
    await expect(page).toHaveURL('/dashboard')
    
    // Now logout
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login')
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible()
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login')
  })

  test('should preserve redirect URL after login', async ({ page }) => {
    // Try to access protected page
    await page.goto('/canvas')
    
    // Should redirect to login with redirect URL
    await expect(page).toHaveURL(/\/login\?.*redirect/)
    
    // Sign up/login
    const timestamp = Date.now()
    const testEmail = `test-${timestamp}@example.com`
    
    await page.click('text=Sign up')
    await page.fill('[data-testid="name-input"]', 'Test User')
    await page.fill('[data-testid="email-input"]', testEmail)
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signup-button"]')
    
    // Should redirect back to originally requested page
    await expect(page).toHaveURL('/canvas')
  })

  test('should handle OAuth login buttons', async ({ page }) => {
    await page.goto('/login')
    
    await expect(page.locator('[data-testid="google-oauth-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="github-oauth-button"]')).toBeVisible()
    
    // Test that clicking OAuth buttons triggers navigation
    const [googlePopup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('[data-testid="google-oauth-button"]')
    ])
    
    expect(googlePopup.url()).toContain('google')
  })

  test('should remember user session across page reloads', async ({ page }) => {
    // Login
    await page.goto('/signup')
    
    const timestamp = Date.now()
    const testEmail = `test-${timestamp}@example.com`
    
    await page.fill('[data-testid="name-input"]', 'Test User')
    await page.fill('[data-testid="email-input"]', testEmail)
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signup-button"]')
    
    await expect(page).toHaveURL('/dashboard')
    
    // Reload page
    await page.reload()
    
    // Should still be logged in
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should handle password visibility toggle', async ({ page }) => {
    await page.goto('/login')
    
    const passwordInput = page.locator('[data-testid="password-input"]')
    const toggleButton = page.locator('[data-testid="password-toggle"]')
    
    // Initially should be password type
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click toggle to show password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click toggle again to hide password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })
})