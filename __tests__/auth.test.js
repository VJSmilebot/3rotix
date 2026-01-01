// __tests__/auth.test.js
import { render, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { createBrowserClient } from '@supabase/ssr'

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn()
}))

// Test component that uses auth
function TestComponent() {
  const { user, loading } = useAuth()
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="user">{user ? user.email : 'No user'}</div>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    createBrowserClient.mockImplementation(() => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({ 
          data: { user: { email: 'test@example.com' } }, 
          error: null 
        }),
        onAuthStateChange: jest.fn().mockReturnValue({ 
          data: { subscription: { unsubscribe: jest.fn() } } 
        })
      }
    }))
  })

  it('provides user and loading state', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initially loading
    expect(getByTestId('loading').textContent).toBe('Loading')
    
    // Wait for auth to resolve
    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('Not loading')
    })
    
    // User should be set
    expect(getByTestId('user').textContent).toBe('test@example.com')
  })
})