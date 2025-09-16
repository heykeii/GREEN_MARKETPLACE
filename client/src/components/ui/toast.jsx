import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setToastInstance } from '@/utils/toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const Toast = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleRemove = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  }, [toast.id, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getContainerColors = () => {
    // Fixed high-contrast scheme (no dark mode variants)
    switch (toast.type) {
      case 'success':
        return 'bg-neutral-900 text-white border-emerald-500';
      case 'error':
        return 'bg-neutral-900 text-white border-red-500';
      case 'warning':
        return 'bg-neutral-900 text-white border-amber-500';
      case 'info':
      default:
        return 'bg-neutral-900 text-white border-blue-500';
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-xl border shadow-xl transition-all duration-300 ease-out transform",
        getContainerColors(),
        isVisible && !isLeaving ? "toast-enter" : "toast-exit"
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-sm font-semibold mb-1">
            {toast.title}
          </h4>
        )}
        <p className="text-sm leading-relaxed">
          {toast.message}
        </p>
      </div>

      <button
        onClick={handleRemove}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/50 transition-colors duration-200"
      >
        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
      </button>

      {/* Progress bar for timed toasts */}
      {toast.duration && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-xl overflow-hidden">
          <div 
            className="h-full bg-white toast-progress"
            style={{ 
              animationDuration: `${toast.duration}ms`,
              animationTimingFunction: 'linear'
            }}
          />
        </div>
      )}
    </div>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast,
    };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message, options = {}) => {
    return addToast({ type: 'success', message, ...options });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({ type: 'error', message, ...options });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({ type: 'warning', message, ...options });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({ type: 'info', message, ...options });
  }, [addToast]);

  const value = {
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  // Set up global toast instance for backward compatibility
  useEffect(() => {
    setToastInstance(value);
  }, [value]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// Convenience functions for backward compatibility
export const toast = {
  success: (message, options = {}) => {
    // This will be set by the provider
    if (window.__toast) {
      return window.__toast.success(message, options);
    }
    console.log('Toast success:', message);
  },
  error: (message, options = {}) => {
    if (window.__toast) {
      return window.__toast.error(message, options);
    }
    console.log('Toast error:', message);
  },
  warning: (message, options = {}) => {
    if (window.__toast) {
      return window.__toast.warning(message, options);
    }
    console.log('Toast warning:', message);
  },
  info: (message, options = {}) => {
    if (window.__toast) {
      return window.__toast.info(message, options);
    }
    console.log('Toast info:', message);
  },
};
