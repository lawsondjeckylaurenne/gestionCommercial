const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  // Only add Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = data.message || 'Something went wrong';
      
      // Try to extract more specific validation error details
      if (data.content) {
        if (Array.isArray(data.content)) {
             // Zod errors often come as an array in content directly or nested
             const firstError = data.content[0];
             if (firstError && firstError.message) {
                 errorMessage += `: ${firstError.message}`;
             }
        } else if (data.content.error && Array.isArray(data.content.error)) {
             const firstError = data.content.error[0];
             if (firstError && firstError.message) {
                 errorMessage += `: ${firstError.message} (${firstError.path?.join('.')})`;
             }
        } else if (typeof data.content === 'string') {
            errorMessage += `: ${data.content}`;
        }
      }

      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    console.error('API Request Error:', error);
    throw error;
  }
}
