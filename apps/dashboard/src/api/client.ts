/**
 * Global API Client configuration.
 * Swapped from Axios to native Fetch to reduce bundle size and dependency overhead.
 */

export const API_BASE_URL = 'http://localhost:3000';

export const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-api-key': 'garavi-sokak-2026',
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
});

// Generic fetch wrapper for future use
export const apiFetch = (endpoint: string, options: RequestInit = {}) => {
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });
};

export default apiFetch;