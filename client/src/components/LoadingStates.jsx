import React from 'react';
import { Loader2, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from './ui/button';

// Loading spinner component
export const LoadingSpinner = ({ size = 'default', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

// Full page loading
export const PageLoading = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="xl" className="text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
};

// Component loading state
export const ComponentLoading = ({ message = 'Loading...', className = '' }) => {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="text-blue-600 mx-auto mb-2" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

// Inline loading (for buttons, etc.)
export const InlineLoading = ({ message = '', className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LoadingSpinner size="sm" />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
};

// Error state component
export const ErrorState = ({ 
  title = 'Something went wrong',
  message = 'An error occurred while loading this content.',
  onRetry = null,
  onGoBack = null,
  className = ''
}) => {
  return (
    <div className={`text-center p-8 ${className}`}>
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{message}</p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        {onGoBack && (
          <Button onClick={onGoBack} variant="outline">
            Go Back
          </Button>
        )}
      </div>
    </div>
  );
};

// Network error state
export const NetworkErrorState = ({ onRetry = null, className = '' }) => {
  return (
    <div className={`text-center p-8 ${className}`}>
      <WifiOff className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Problem</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Please check your internet connection and try again.
      </p>
      
      {onRetry && (
        <Button onClick={onRetry} variant="default">
          <Wifi className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>
      )}
    </div>
  );
};

// Empty state component
export const EmptyState = ({ 
  title = 'No data found',
  message = 'There is no content to display.',
  action = null,
  icon = null,
  className = ''
}) => {
  return (
    <div className={`text-center p-8 ${className}`}>
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{message}</p>
      {action && action}
    </div>
  );
};

// Loading overlay for existing content
export const LoadingOverlay = ({ isLoading, children, message = 'Loading...' }) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <LoadingSpinner size="lg" className="text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Skeleton loading for lists
export const SkeletonLoader = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Card skeleton
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
};

// Progress indicator
export const ProgressIndicator = ({ 
  value, 
  max = 100, 
  message = '', 
  className = '' 
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className={`w-full ${className}`}>
      {message && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">{message}</span>
          <span className="text-sm text-gray-600">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// Hook for managing loading states
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [error, setError] = React.useState(null);

  const startLoading = () => {
    setIsLoading(true);
    setError(null);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const setLoadingError = (error) => {
    setIsLoading(false);
    setError(error);
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
  };

  const withLoading = async (asyncFn) => {
    try {
      startLoading();
      const result = await asyncFn();
      stopLoading();
      return result;
    } catch (error) {
      setLoadingError(error);
      throw error;
    }
  };

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    reset,
    withLoading
  };
};

export default {
  LoadingSpinner,
  PageLoading,
  ComponentLoading,
  InlineLoading,
  ErrorState,
  NetworkErrorState,
  EmptyState,
  LoadingOverlay,
  SkeletonLoader,
  CardSkeleton,
  ProgressIndicator,
  useLoadingState
};
