import axios from 'axios';
import { parseApiError, handleAuthError, withRetry } from './errorHandling';
import { toast } from './toast';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('admin_token');
    
    if (token && !config.url?.includes('/admin/')) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (adminToken && config.url?.includes('/admin/')) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration for debugging
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`API Request completed in ${duration}ms: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    
    return response;
  },
  (error) => {
    // Calculate request duration even for errors
    if (error.config?.metadata?.startTime) {
      const duration = new Date() - error.config.metadata.startTime;
      console.log(`API Request failed after ${duration}ms: ${error.config.method?.toUpperCase()} ${error.config.url}`);
    }

    // Handle authentication errors globally
    if (handleAuthError(error)) {
      return Promise.reject(error);
    }

    // Parse and enhance error
    const appError = parseApiError(error);
    
    // Log error details
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: appError.message,
      type: appError.type,
      timestamp: appError.timestamp
    });

    return Promise.reject(appError);
  }
);

// Enhanced API methods with error handling
export const api = {
  // GET request
  get: async (url, config = {}) => {
    try {
      const response = await apiClient.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await apiClient.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // File upload with progress
  upload: async (url, formData, onProgress = null) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      };

      const response = await apiClient.post(url, formData, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Request with retry logic
  withRetry: async (apiCall, maxRetries = 3) => {
    return withRetry(apiCall, maxRetries);
  },

  // Safe request that won't throw errors (returns null on error)
  safe: {
    get: async (url, config = {}) => {
      try {
        return await api.get(url, config);
      } catch (error) {
        console.warn(`Safe GET request failed: ${url}`, error.message);
        return null;
      }
    },

    post: async (url, data = {}, config = {}) => {
      try {
        return await api.post(url, data, config);
      } catch (error) {
        console.warn(`Safe POST request failed: ${url}`, error.message);
        return null;
      }
    },

    put: async (url, data = {}, config = {}) => {
      try {
        return await api.put(url, data, config);
      } catch (error) {
        console.warn(`Safe PUT request failed: ${url}`, error.message);
        return null;
      }
    },

    delete: async (url, config = {}) => {
      try {
        return await api.delete(url, config);
      } catch (error) {
        console.warn(`Safe DELETE request failed: ${url}`, error.message);
        return null;
      }
    },
  },
};

// Specialized API methods for common operations
export const authApi = {
  login: (credentials) => api.post('/api/v1/users/login', credentials),
  register: (userData) => api.post('/api/v1/users/register', userData),
  logout: () => api.post('/api/v1/users/logout'),
  refreshToken: () => api.post('/api/v1/users/refresh-token'),
  forgotPassword: (email) => api.post('/api/v1/users/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/api/v1/users/reset-password', { token, password }),
};

export const userApi = {
  getProfile: () => api.get('/api/v1/users/profile'),
  updateProfile: (data) => api.put('/api/v1/users/profile', data),
  uploadAvatar: (formData, onProgress) => api.upload('/api/v1/users/avatar', formData, onProgress),
  deleteAccount: () => api.delete('/api/v1/users/account'),
};

export const productApi = {
  getAll: (params = {}) => api.get('/api/v1/products', { params }),
  getById: (id) => api.get(`/api/v1/products/${id}`),
  create: (data) => api.post('/api/v1/products', data),
  update: (id, data) => api.put(`/api/v1/products/${id}`, data),
  delete: (id) => api.delete(`/api/v1/products/${id}`),
  search: (query) => api.get('/api/v1/products/search', { params: { q: query } }),
};

// Error handling utilities for components
export const useApiError = () => {
  const handleError = (error, customMessage = null, showToast = true) => {
    if (showToast) {
      const message = customMessage || error.message || 'An error occurred';
      toast.error(message);
    }
    
    console.error('Component API Error:', error);
    return error;
  };

  return { handleError };
};

// Network status monitoring
export const networkMonitor = {
  isOnline: () => navigator.onLine,
  
  onOffline: (callback) => {
    window.addEventListener('offline', callback);
    return () => window.removeEventListener('offline', callback);
  },
  
  onOnline: (callback) => {
    window.addEventListener('online', callback);
    return () => window.removeEventListener('online', callback);
  },
};

export default apiClient;
