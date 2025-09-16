import { AppError, formatErrorResponse } from '../utils/errorClasses.js';

// Enhanced error handling middleware
export const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Log error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: isDevelopment ? err.stack : 'Stack trace hidden in production',
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle operational errors (known errors)
  if (err.isOperational) {
    const response = formatErrorResponse(err, isDevelopment);
    return res.status(err.statusCode).json(response);
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      details: { errors },
      timestamp: new Date().toISOString()
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      errorCode: 'DUPLICATE_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      errorCode: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      errorCode: 'TOKEN_EXPIRED',
      timestamp: new Date().toISOString()
    });
  }

  // Handle Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large',
      errorCode: 'FILE_TOO_LARGE',
      timestamp: new Date().toISOString()
    });
  }

  // Default error response for unknown errors
  res.status(500).json({
    success: false,
    message: isDevelopment ? err.message : 'Internal server error',
    errorCode: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: err.stack })
  });
};

// Handle 404 routes
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    errorCode: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString()
  });
};

// Helper function for standardized error responses
export const errorResponse = (res, status, message, errorCode = null, details = null) => {
  const response = {
    success: false,
    message: message,
    timestamp: new Date().toISOString()
  };

  if (errorCode) {
    response.errorCode = errorCode;
  }

  if (details) {
    response.details = details;
  }

  return res.status(status).json(response);
};

// Async wrapper to catch errors in async route handlers
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 