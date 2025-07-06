import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const ProtectedAdminRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('admin_token');
      const user = JSON.parse(localStorage.getItem('admin_user') || '{}');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Verify token and check admin role
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.user.role === 'admin') {
          setIsAuthenticated(true);
          setIsAdmin(true);
        } else {
          toast.error('Access denied. Admin privileges required.');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        
        // Handle different types of errors
        if (error.response) {
          // Server responded with error status
          if (error.response.status === 401) {
            toast.error('Authentication expired. Please login again.');
          } else if (error.response.status === 403) {
            toast.error('Access denied. Admin privileges required.');
          } else {
            toast.error('Authentication check failed.');
          }
        } else if (error.request) {
          // Network error - server not reachable
          toast.error('Cannot connect to server. Please check if the backend is running.');
        } else {
          // Other error
          toast.error('Authentication check failed.');
        }
        
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedAdminRoute; 