import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use
  
  // Create a browser instance for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for the server to be ready
    console.log('Waiting for server to be ready...')
    await page.goto(baseURL!)
    await page.waitForLoadState('networkidle')
    
    // Perform any global setup tasks here
    // For example, create test data, authenticate admin user, etc.
    
    // Create a test user if needed
    await page.evaluate(() => {
      // Clear any existing data
      localStorage.clear()
      sessionStorage.clear()
    })
    
    console.log('Global setup completed successfully')
  } catch (error) {
    console.error('Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup