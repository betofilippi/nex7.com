import { useState, useEffect, useCallback } from 'react';
import { getCSRFToken } from '../lib/security/csrf';

// Hook for CSRF token management
export function useCSRFToken() {
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    // Get CSRF token on mount
    const csrfToken = getCSRFToken();
    setToken(csrfToken);
  }, []);
  
  // Headers object with CSRF token
  const headers = token ? { 'X-CSRF-Token': token } : {};
  
  // Helper function to refresh CSRF token
  const refreshToken = useCallback(async () => {
    try {
      // Make a GET request to get a new CSRF token
      const response = await fetch('/api/auth/csrf');
      if (response.ok) {
        const newToken = response.headers.get('X-CSRF-Token');
        if (newToken) {
          setToken(newToken);
        }
      }
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error);
    }
  }, []);
  
  return { token, headers, refreshToken };
}

// Hook for secure API requests
export function useSecureApi() {
  const { headers: csrfHeaders } = useCSRFToken();
  
  // Secure fetch wrapper
  const secureFetch = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...csrfHeaders,
    };
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Include cookies
    });
    
    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const error = await response.json();
      throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
    }
    
    // Handle CSRF errors
    if (response.status === 403) {
      const error = await response.json();
      if (error.error === 'CSRF token missing' || error.error === 'Invalid CSRF token') {
        // Try to refresh CSRF token
        console.error('CSRF token error, refreshing...');
        window.location.reload(); // Simple solution, could be improved
      }
    }
    
    return response;
  }, [csrfHeaders]);
  
  // Convenience methods
  const get = useCallback((url: string, options?: RequestInit) => {
    return secureFetch(url, { ...options, method: 'GET' });
  }, [secureFetch]);
  
  const post = useCallback((url: string, body?: any, options?: RequestInit) => {
    return secureFetch(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }, [secureFetch]);
  
  const put = useCallback((url: string, body?: any, options?: RequestInit) => {
    return secureFetch(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }, [secureFetch]);
  
  const del = useCallback((url: string, options?: RequestInit) => {
    return secureFetch(url, { ...options, method: 'DELETE' });
  }, [secureFetch]);
  
  return { fetch: secureFetch, get, post, put, delete: del };
}

// Hook for API key management
export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  // Load API key from localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('api-key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);
  
  // Save API key
  const saveApiKey = useCallback((key: string) => {
    localStorage.setItem('api-key', key);
    setApiKey(key);
  }, []);
  
  // Remove API key
  const removeApiKey = useCallback(() => {
    localStorage.removeItem('api-key');
    setApiKey(null);
  }, []);
  
  // Headers with API key
  const headers = apiKey ? { 'X-API-Key': apiKey } : {};
  
  return { apiKey, headers, saveApiKey, removeApiKey };
}

// Hook for webhook signature verification (for testing)
export function useWebhookVerification(secret: string) {
  const generateSignature = useCallback((payload: any, timestamp?: number) => {
    const ts = timestamp || Date.now();
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    // This would need to be done server-side in production
    // This is just for testing/demonstration
    return {
      timestamp: ts,
      payload: payloadString,
      headers: {
        'X-Webhook-Timestamp': ts.toString(),
        'X-Webhook-Event': payload.event || 'test.event',
        'X-Webhook-Id': payload.id || 'test-id',
      },
    };
  }, [secret]);
  
  return { generateSignature };
}