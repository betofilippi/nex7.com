import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('Starting global teardown...')
  
  try {
    // Perform any cleanup tasks here
    // For example, delete test data, cleanup files, etc.
    
    console.log('Global teardown completed successfully')
  } catch (error) {
    console.error('Global teardown failed:', error)
    // Don't throw here as it might mask test failures
  }
}

export default globalTeardown