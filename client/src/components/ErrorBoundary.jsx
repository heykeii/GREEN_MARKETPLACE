import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      // Use custom fallback if provided
      if (Fallback) {
        return <Fallback error={this.state.error} retry={this.handleRetry} />;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We apologize for the inconvenience. An unexpected error has occurred.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={this.handleRetry}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 whitespace-pre-wrap">
                  <strong>Error:</strong> {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      <br /><br />
                      <strong>Stack Trace:</strong>
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  return (error) => {
    console.error('Error caught by error handler:', error);
    
    // You can customize error handling here
    throw error; // Re-throw to be caught by Error Boundary
  };
};

// Higher-order component for error handling
export const withErrorHandling = (Component, fallback = null) => {
  return function WithErrorHandling(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Specialized error boundaries for different sections
export const PageErrorBoundary = ({ children }) => {
  const PageErrorFallback = ({ error, retry }) => (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Page Error
        </h2>
        <p className="text-gray-600 mb-4">
          This page encountered an error. Please try refreshing.
        </p>
        <Button onClick={retry} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={PageErrorFallback}>
      {children}
    </ErrorBoundary>
  );
};

export const ComponentErrorBoundary = ({ children, componentName = 'Component' }) => {
  const ComponentErrorFallback = ({ retry }) => (
    <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-center">
      <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
      <p className="text-sm text-red-700 mb-2">
        {componentName} failed to load
      </p>
      <Button onClick={retry} size="sm" variant="outline">
        Retry
      </Button>
    </div>
  );

  return (
    <ErrorBoundary fallback={ComponentErrorFallback}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
