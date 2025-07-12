# Testing Guide

This document provides comprehensive information about the testing setup and practices for the Nex7 application.

## Overview

Our testing strategy includes multiple layers of testing to ensure code quality, reliability, and user experience:

- **Unit Tests**: Test individual components, hooks, and utilities in isolation
- **Integration Tests**: Test API routes and services with real dependencies
- **End-to-End Tests**: Test complete user workflows across the application
- **Visual Regression Tests**: Ensure UI consistency across changes
- **Performance Tests**: Monitor application performance metrics

## Test Structure

```
src/
├── __tests__/
│   ├── __mocks__/
│   │   ├── handlers.ts          # MSW request handlers
│   │   └── server.ts            # MSW server setup
│   ├── utils/
│   │   └── test-utils.tsx       # Custom render function and utilities
│   ├── components/              # Component tests
│   ├── hooks/                   # Hook tests
│   ├── lib/                     # Service and utility tests
│   └── api/                     # API route tests
e2e/
├── fixtures/                    # Playwright fixtures
├── auth.spec.ts                 # Authentication flow tests
├── agents.spec.ts               # Agent system tests
├── canvas.spec.ts               # Canvas workflow tests
├── global-setup.ts              # E2E setup
└── global-teardown.ts           # E2E cleanup
```

## Running Tests

### Development Commands

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test types
npm run test:components
npm run test:hooks
npm run test:api
npm run test:services

# Run E2E tests
npm run e2e

# Run E2E tests with UI
npm run e2e:ui

# Run E2E tests in headed mode
npm run e2e:headed
```

### CI/CD Commands

```bash
# Run all tests for CI
npm run test:ci

# Run complete test suite
npm run test:all

# Run tests for specific browsers
npm run test:browsers

# Run mobile tests
npm run test:mobile
```

## Test Configuration

### Jest Configuration

The Jest configuration is in `jest.config.js` and includes:

- TypeScript support via `ts-jest`
- Next.js integration via `next/jest`
- Custom module mapping for absolute imports
- Coverage thresholds (80% minimum)
- MSW integration for API mocking

### Playwright Configuration

The Playwright configuration is in `playwright.config.ts` and includes:

- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile device testing
- Screenshot and video recording on failures
- Automatic server startup for testing
- Custom global setup and teardown

## Writing Tests

### Component Tests

```typescript
import { render, screen, fireEvent } from '@/src/__tests__/utils/test-utils'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('handles user interactions', async () => {
    render(<MyComponent />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Clicked')).toBeVisible()
  })
})
```

### Hook Tests

```typescript
import { renderHook, act } from '@/src/__tests__/utils/test-utils'
import { useMyHook } from '@/hooks/useMyHook'

describe('useMyHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.value).toBe(0)
  })

  it('updates state correctly', () => {
    const { result } = renderHook(() => useMyHook())
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.value).toBe(1)
  })
})
```

### API Route Tests

```typescript
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/my-route/route'

describe('/api/my-route', () => {
  it('handles POST requests correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/my-route', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ success: true })
  })
})
```

### E2E Tests

```typescript
import { test, expect } from './fixtures/auth'

test('user can complete workflow', async ({ page, authenticatedUser }) => {
  await page.goto('/dashboard')
  
  await page.click('[data-testid="create-workflow"]')
  await page.fill('[data-testid="workflow-name"]', 'Test Workflow')
  await page.click('[data-testid="save-workflow"]')
  
  await expect(page).toHaveURL('/workflows/test-workflow')
})
```

## Coverage Requirements

We maintain a minimum of 80% code coverage across:

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

Coverage reports are generated in the `coverage/` directory and uploaded to CI artifacts.

## Mock Service Worker (MSW)

We use MSW to mock API requests in tests. Handlers are defined in:

- `src/__tests__/__mocks__/handlers.ts` - Request handlers
- `src/__tests__/__mocks__/server.ts` - Server setup

### Adding New API Mocks

```typescript
// In handlers.ts
export const handlers = [
  http.get('/api/new-endpoint', () => {
    return HttpResponse.json({ data: 'mocked response' })
  }),
  
  http.post('/api/new-endpoint', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ received: body })
  }),
]
```

## Test Fixtures and Utilities

### Authentication Fixture

The E2E tests use an authentication fixture that automatically creates and logs in test users:

```typescript
import { test, expect } from './fixtures/auth'

test('protected route test', async ({ page, authenticatedUser }) => {
  // User is automatically logged in
  await page.goto('/protected-route')
  // Test protected functionality
})
```

### Test Utilities

Custom render function with providers:

```typescript
import { render } from '@/src/__tests__/utils/test-utils'

// Automatically wraps with necessary providers:
// - NextIntlClientProvider
// - ThemeProvider
// - AuthProvider
render(<MyComponent />)
```

## CI/CD Integration

### GitHub Actions

Our CI pipeline runs on every push and pull request:

1. **Lint and Type Check**: ESLint and TypeScript validation
2. **Unit Tests**: Jest tests with coverage reporting
3. **Integration Tests**: API and service tests with database
4. **E2E Tests**: Playwright tests across multiple browsers
5. **Visual Regression**: Screenshot comparison tests
6. **Performance Tests**: Core Web Vitals monitoring
7. **Security Scan**: Dependency and code security analysis

### Coverage Reporting

- Coverage reports are uploaded to Codecov
- Coverage badges are automatically updated
- Minimum coverage thresholds enforce quality standards
- Pull requests show coverage diffs

## Best Practices

### Test Naming

- Use descriptive test names that explain what is being tested
- Follow the pattern: "should [expected behavior] when [condition]"
- Group related tests using `describe` blocks

### Test Organization

- Keep tests close to the code they test
- Use consistent file naming: `*.test.ts` or `*.spec.ts`
- Group setup and teardown logic in `beforeEach`/`afterEach`

### Mocking Guidelines

- Mock external dependencies and APIs
- Use real implementations for internal utilities when possible
- Keep mocks simple and focused on the test scenario

### E2E Test Guidelines

- Use data attributes (`data-testid`) for reliable element selection
- Test complete user workflows, not individual interactions
- Keep tests independent and able to run in any order
- Clean up test data after each test

### Performance Considerations

- Run unit tests in parallel for faster feedback
- Use `test.only` and `test.skip` for focused testing during development
- Optimize test setup and teardown for faster execution

## Debugging Tests

### Jest Tests

```bash
# Debug specific test
npm run test -- --testNamePattern="specific test name" --verbose

# Run tests with debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Watch mode for development
npm run test:watch
```

### Playwright Tests

```bash
# Debug mode with browser
npm run e2e:debug

# Run with UI mode
npm run e2e:ui

# Run specific test file
npx playwright test auth.spec.ts

# Generate test code
npx playwright codegen http://localhost:3000
```

## Continuous Improvement

### Monitoring

- Track test execution times and optimize slow tests
- Monitor flaky tests and fix reliability issues
- Review coverage reports to identify untested code paths

### Updates

- Keep testing dependencies up to date
- Review and update test strategies as the application evolves
- Add new test cases for bug fixes and new features

### Documentation

- Update this guide when testing practices change
- Document complex test scenarios and their rationale
- Share testing best practices with the team

## Troubleshooting

### Common Issues

1. **Tests failing in CI but passing locally**
   - Check environment variables and configuration
   - Ensure consistent Node.js versions
   - Review timing and race conditions

2. **Flaky E2E tests**
   - Add proper wait conditions
   - Use more specific selectors
   - Check for race conditions in test setup

3. **Low coverage warnings**
   - Add tests for uncovered branches
   - Remove unused code
   - Review coverage exclusions

4. **Mock not working**
   - Verify mock setup in test files
   - Check import paths and module resolution
   - Ensure MSW handlers are properly configured

For additional help, check the test logs and CI artifacts, or consult the team's testing documentation.