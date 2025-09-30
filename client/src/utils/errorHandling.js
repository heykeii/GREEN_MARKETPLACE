// Frontend error handling utilities
import { toast } from './toast';

// Error types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  OFFLINE: 'OFFLINE_ERROR'
};

// Enhanced error class for frontend
export class AppError extends Error {
  constructor(message, type, statusCode = null, details = null, retryable = false) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.retryable = retryable;
    this.timestamp = new Date().toISOString();
  }
}

// Parse API error response
export const parseApiError = (error) => {
  // Network errors (no response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new AppError(
        'Request timeout. Please try again.',
        ERROR_TYPES.TIMEOUT,
        null,
        null,
        true
      );
    }
    
    if (!navigator.onLine) {
      return new AppError(
        'No internet connection. Please check your connection and try again.',
        ERROR_TYPES.OFFLINE,
        null,
        null,
        true
      );
    }
    
    return new AppError(
      'Network error. Please check your connection and try again.',
      ERROR_TYPES.NETWORK,
      null,
      null,
      true
    );
  }

  const { status, data } = error.response;
  const message = data?.message || 'An error occurred';
  const errorCode = data?.errorCode;
  const details = data?.details || data; // Include the entire response data as details

  // Determine error type based on status code
  let errorType;
  let retryable = false;

  switch (status) {
    case 400:
      errorType = errorCode === 'VALIDATION_ERROR' ? ERROR_TYPES.VALIDATION : ERROR_TYPES.SERVER;
      break;
    case 401:
      errorType = ERROR_TYPES.AUTHENTICATION;
      break;
    case 403:
      errorType = ERROR_TYPES.AUTHORIZATION;
      break;
    case 404:
      errorType = ERROR_TYPES.NOT_FOUND;
      break;
    case 429:
      errorType = ERROR_TYPES.SERVER;
      retryable = true;
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      errorType = ERROR_TYPES.SERVER;
      retryable = true;
      break;
    default:
      errorType = ERROR_TYPES.SERVER;
  }

  return new AppError(message, errorType, status, details, retryable);
};

// Show user-friendly error messages
export const showErrorToast = (error, customMessage = null) => {
  let message = customMessage;
  
  if (!message) {
    if (error instanceof AppError) {
      message = error.message;
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    } else {
      message = 'An unexpected error occurred';
    }
  }

  // Add retry suggestion for retryable errors
  if (error instanceof AppError && error.retryable) {
    message += ' You can try again.';
  }

  toast.error(message);
};

// Handle authentication errors globally
export const handleAuthError = (error) => {
  const appError = parseApiError(error);
  
  // Check for specific account deletion/deactivation errors
  const responseData = error.response?.data || error.details;
  const shouldLogout = responseData?.shouldLogout;
  const errorCode = responseData?.code;
  
  if (appError.type === ERROR_TYPES.AUTHENTICATION || shouldLogout) {
    // Clear all tokens and user data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    
    // Show appropriate error message based on the error code
    let errorMessage = 'Your session has expired. Please log in again.';
    
    if (errorCode === 'ACCOUNT_DELETED') {
      errorMessage = 'Your account has been deleted by an administrator. Please contact support if you believe this is an error.';
    } else if (errorCode === 'ACCOUNT_DEACTIVATED') {
      errorMessage = 'Your account has been deactivated. Please contact support for assistance.';
    }
    
    toast.error(errorMessage);
    
    // Redirect to login after a short delay
    setTimeout(() => {
      const isAdmin = window.location.pathname.startsWith('/admin');
      window.location.href = isAdmin ? '/admin/login' : '/login';
    }, 3000); // Increased delay for account deletion messages
    
    return true; // Handled
  }
  
  return false; // Not handled
};

// Validation error formatter
export const formatValidationErrors = (errors) => {
  if (!errors || !Array.isArray(errors)) return '';
  
  return errors.map(err => `${err.field}: ${err.message}`).join(', ');
};

// Retry mechanism for failed requests
export const withRetry = async (apiCall, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      const appError = parseApiError(error);
      
      // Don't retry non-retryable errors
      if (!appError.retryable || attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

// Global error handler for uncaught errors
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Check if this is an authentication error that should trigger logout
    if (event.reason && typeof event.reason === 'object') {
      const error = event.reason;
      if (handleAuthError(error)) {
        event.preventDefault();
        return;
      }
    }
    
    // Don't show toast for development errors
    if (process.env.NODE_ENV === 'production') {
      toast.error('An unexpected error occurred. Please refresh the page.');
    }
    
    // Prevent the default browser error handling
    event.preventDefault();
  });

  // Handle JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
    
    if (process.env.NODE_ENV === 'production') {
      toast.error('An unexpected error occurred. Please refresh the page.');
    }
  });
};

// Account validation utility
export const validateUserAccount = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return true; // No token, user is not logged in
    
    // Make a simple API call to check if user account is still valid
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Check if account was deleted or deactivated
      if (errorData.shouldLogout || errorData.code === 'ACCOUNT_DELETED' || errorData.code === 'ACCOUNT_DEACTIVATED') {
        handleAuthError({ response: { data: errorData } });
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Account validation error:', error);
    return true; // Don't logout on network errors
  }
};

// Set up periodic account validation
export const setupAccountValidation = () => {
  // Check account validity every 5 minutes
  setInterval(async () => {
    await validateUserAccount();
  }, 5 * 60 * 1000); // 5 minutes
  
  // Also check when the page becomes visible (user switches back to tab)
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      await validateUserAccount();
    }
  });
};

// Form validation helpers
export const validateForm = (data, rules) => {
  const errors = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    // Required validation
    if (fieldRules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field] = `${fieldRules.label || field} is required`;
      continue;
    }
    
    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && !value.trim())) {
      continue;
    }
    
    // Email validation
    if (fieldRules.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[field] = 'Invalid email format';
      }
    }
    
    // Length validation
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `${fieldRules.label || field} must be at least ${fieldRules.minLength} characters`;
    }
    
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `${fieldRules.label || field} must be no more than ${fieldRules.maxLength} characters`;
    }
    
    // Pattern validation
    if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
      errors[field] = fieldRules.patternMessage || `Invalid ${fieldRules.label || field} format`;
    }
    
    // Custom validation
    if (fieldRules.validate) {
      const customError = fieldRules.validate(value, data);
      if (customError) {
        errors[field] = customError;
      }
    }
  }
  
  return errors;
};

// Show validation errors
export const showValidationErrors = (errors) => {
  const errorMessages = Object.values(errors);
  if (errorMessages.length > 0) {
    toast.error(errorMessages[0]); // Show first error
  }
};

export default {
  AppError,
  parseApiError,
  showErrorToast,
  handleAuthError,
  formatValidationErrors,
  withRetry,
  setupGlobalErrorHandling,
  validateForm,
  showValidationErrors,
  validateUserAccount,
  setupAccountValidation,
  ERROR_TYPES
};
