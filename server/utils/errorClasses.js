// Custom error classes for better error handling

export class AppError extends Error {
  constructor(message, statusCode, errorCode = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details = null) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, message = 'External service error', details = null) {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

// Error response formatter
export const formatErrorResponse = (error, isDevelopment = false) => {
  const response = {
    success: false,
    message: error.message || 'An error occurred',
    timestamp: error.timestamp || new Date().toISOString(),
  };

  // Add error code if available
  if (error.errorCode) {
    response.errorCode = error.errorCode;
  }

  // Add details if available
  if (error.details) {
    response.details = error.details;
  }

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    response.stack = error.stack;
  }

  return response;
};

// Validation helpers
export const validateRequired = (fields, data) => {
  const missing = [];
  const invalid = [];
  
  for (const field of fields) {
    if (!(field in data) || data[field] === null || data[field] === undefined) {
      missing.push(field);
    } else if (typeof data[field] === 'string' && data[field].trim() === '') {
      invalid.push({ field, reason: 'Cannot be empty' });
    }
  }
  
  if (missing.length > 0 || invalid.length > 0) {
    throw new ValidationError('Validation failed', { missing, invalid });
  }
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

export const validateLength = (value, field, min, max) => {
  if (value.length < min || value.length > max) {
    throw new ValidationError(`${field} must be between ${min} and ${max} characters`);
  }
};
