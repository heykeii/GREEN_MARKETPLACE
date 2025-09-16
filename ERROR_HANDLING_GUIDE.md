# Enhanced Error Handling Guide

This guide explains the improved error handling system implemented across the frontend and backend.

## Backend Error Handling

### Custom Error Classes

The backend now uses standardized error classes in `server/utils/errorClasses.js`:

- `AppError` - Base error class with statusCode, errorCode, and details
- `ValidationError` - For validation failures (400)
- `AuthenticationError` - For authentication failures (401)
- `AuthorizationError` - For authorization failures (403)
- `NotFoundError` - For resource not found (404)
- `ConflictError` - For resource conflicts (409)
- `DatabaseError` - For database operation failures (500)
- `ExternalServiceError` - For third-party service failures (502)

### Enhanced Middleware

The error middleware (`server/middleware/error.middleware.js`) now:

- Provides detailed error logging with request context
- Handles specific error types (MongoDB, JWT, Multer, etc.)
- Returns standardized error responses with timestamps and error codes
- Includes stack traces in development mode
- Provides an `asyncHandler` wrapper for automatic error catching

### Usage in Controllers

```javascript
import { 
  ValidationError, 
  NotFoundError, 
  asyncHandler,
  validateRequired 
} from "../utils/errorClasses.js";

export const someController = asyncHandler(async (req, res) => {
  // Validation
  validateRequired(['field1', 'field2'], req.body);
  
  // Business logic
  const resource = await Model.findById(id);
  if (!resource) {
    throw new NotFoundError('Resource not found');
  }
  
  // Success response
  res.json({ success: true, data: resource });
});
```

### Error Response Format

All errors now return a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_TYPE",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "details": { /* additional error details */ }
}
```

## Frontend Error Handling

### Error Utilities

The frontend includes comprehensive error handling utilities in `client/src/utils/errorHandling.js`:

- `parseApiError()` - Converts API errors to structured AppError objects
- `showErrorToast()` - Displays user-friendly error messages
- `handleAuthError()` - Handles authentication errors globally
- `withRetry()` - Implements retry logic for failed requests
- `setupGlobalErrorHandling()` - Sets up global error handlers

### Enhanced API Client

The API client (`client/src/utils/apiClient.js`) provides:

- Automatic token injection
- Request/response interceptors
- Enhanced error parsing
- Retry mechanisms
- Network status monitoring
- File upload with progress
- Safe API methods that don't throw errors

### Error Boundaries

React Error Boundaries are implemented in `client/src/components/ErrorBoundary.jsx`:

- `ErrorBoundary` - Main error boundary component
- `PageErrorBoundary` - For page-level errors
- `ComponentErrorBoundary` - For component-level errors
- `withErrorHandling()` - HOC for wrapping components

### Form Validation

Comprehensive form validation is available in `client/src/utils/validation.js`:

- Pre-defined validation rules for common fields
- Form schemas for different use cases
- Real-time validation with `useFormValidation` hook
- File validation utilities

### Loading States

Loading and error states are standardized in `client/src/components/LoadingStates.jsx`:

- `LoadingSpinner` - Configurable spinner component
- `PageLoading` - Full page loading state
- `ErrorState` - Error display with retry options
- `NetworkErrorState` - Network-specific error handling
- `EmptyState` - No data state
- `SkeletonLoader` - Skeleton loading animations

## Usage Examples

### Backend Controller

```javascript
export const createProduct = asyncHandler(async (req, res) => {
  // Validate required fields
  validateRequired(['name', 'price', 'description'], req.body);
  
  // Validate email format if present
  if (req.body.email) {
    validateEmail(req.body.email);
  }
  
  // Check if product already exists
  const existingProduct = await Product.findOne({ name: req.body.name });
  if (existingProduct) {
    throw new ConflictError('Product with this name already exists');
  }
  
  // Create product
  const product = new Product(req.body);
  await product.save();
  
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
});
```

### Frontend Component

```javascript
import { useLoadingState } from '@/components/LoadingStates';
import { api } from '@/utils/apiClient';
import { showErrorToast } from '@/utils/errorHandling';
import { validateFormWithSchema } from '@/utils/validation';

const ProductForm = () => {
  const { isLoading, error, withLoading } = useLoadingState();
  const [formData, setFormData] = useState({});
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateFormWithSchema(formData, 'product');
    if (Object.keys(errors).length > 0) {
      showValidationErrors(errors);
      return;
    }
    
    try {
      await withLoading(async () => {
        const result = await api.post('/api/v1/products', formData);
        toast.success('Product created successfully!');
        navigate('/products');
      });
    } catch (error) {
      showErrorToast(error);
    }
  };
  
  if (error) {
    return (
      <ErrorState 
        message="Failed to load product form"
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  // Form JSX with loading states
};
```

### API Call with Retry

```javascript
import { api } from '@/utils/apiClient';

// Automatic retry for transient failures
const fetchProducts = async () => {
  return api.withRetry(
    () => api.get('/api/v1/products'),
    3 // max retries
  );
};

// Safe API call that won't throw
const fetchUserProfile = async () => {
  const result = await api.safe.get('/api/v1/users/profile');
  if (!result) {
    // Handle null result (error occurred)
    return defaultProfileData;
  }
  return result;
};
```

## Best Practices

### Backend

1. Always use `asyncHandler` for async route handlers
2. Use specific error classes instead of generic errors
3. Validate input data early in controllers
4. Don't expose sensitive information in error messages
5. Log errors with sufficient context for debugging
6. Use error codes for client-side error handling

### Frontend

1. Wrap major components in Error Boundaries
2. Use the enhanced API client instead of raw axios
3. Implement proper loading states for async operations
4. Show user-friendly error messages
5. Implement retry mechanisms for transient failures
6. Validate forms before submitting
7. Handle offline/network scenarios

### Security Considerations

1. Never expose stack traces in production
2. Sanitize error messages to prevent information leakage
3. Log security-related errors for monitoring
4. Implement rate limiting for error-prone endpoints
5. Use proper HTTP status codes

## Migration Guide

### Updating Existing Controllers

1. Import error classes and utilities
2. Replace try-catch blocks with `asyncHandler`
3. Replace manual validations with utility functions
4. Use specific error classes instead of generic responses
5. Test error scenarios thoroughly

### Updating Frontend Components

1. Replace manual error handling with utilities
2. Add Error Boundaries around major sections
3. Use the enhanced API client
4. Implement proper loading states
5. Add form validation where needed

This enhanced error handling system provides better user experience, easier debugging, and more maintainable code across the application.
