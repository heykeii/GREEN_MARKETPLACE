import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { toast } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';

const NotificationIcon = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('admin_token') || '';

  const getTokenSource = () => {
    if (localStorage.getItem('token')) return 'user';
    if (localStorage.getItem('admin_token')) return 'admin';
    return 'none';
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      } else {
        const text = await response.text();
        console.error('[Notifications] Unread count error', {
          status: response.status,
          statusText: response.statusText,
          tokenSource: getTokenSource(),
          hasToken: !!getAuthToken(),
          url: `${import.meta.env.VITE_API_URL}/api/v1/notifications/unread-count`,
          body: text
        });
        if (response.status === 401) {
          // Surface a small, non-intrusive hint once
          console.warn('Unauthorized fetching unread count. Check token validity and backend auth.');
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications?limit=10`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      } else {
        const text = await response.text();
        console.error('[Notifications] List error', {
          status: response.status,
          statusText: response.statusText,
          tokenSource: getTokenSource(),
          hasToken: !!getAuthToken(),
          url: `${import.meta.env.VITE_API_URL}/api/v1/notifications?limit=10`,
          body: text
        });
        if (response.status === 401) {
          toast.error('Unauthorized. Please re-login.');
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        const text = await response.text();
        console.error('[Notifications] Mark read error', {
          status: response.status,
          statusText: response.statusText,
          tokenSource: getTokenSource(),
          hasToken: !!getAuthToken(),
          url: `${import.meta.env.VITE_API_URL}/api/v1/notifications/${notificationId}/read`,
          body: text
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      } else {
        const text = await response.text();
        console.error('[Notifications] Mark all read error', {
          status: response.status,
          statusText: response.statusText,
          tokenSource: getTokenSource(),
          hasToken: !!getAuthToken(),
          url: `${import.meta.env.VITE_API_URL}/api/v1/notifications/mark-all-read`,
          body: text
        });
        if (response.status === 401) {
          toast.error('Unauthorized. Please re-login.');
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate to the action URL if available
    if (notification.actionUrl) {
      // Handle seller order notifications - redirect to main seller orders page
      if (notification.type === 'new_order' || notification.type === 'order_cancelled_by_customer') {
        if (notification.actionUrl.includes('/seller/orders/')) {
          navigate('/seller/orders');
        } else {
          navigate(notification.actionUrl);
        }
      } else {
        navigate(notification.actionUrl);
      }
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
        return '🛒';
      case 'new_review':
        return '⭐';
      case 'order_status_updated':
      case 'order_confirmed':
      case 'order_ready':
      case 'order_completed':
        return '📦';
      case 'order_cancelled':
      case 'order_cancelled_by_customer':
        return '❌';
      case 'report_status_updated':
        return '📋';
      case 'system_message':
        return '🔔';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_order':
      case 'order_completed':
        return 'text-green-600';
      case 'order_cancelled':
      case 'order_cancelled_by_customer':
        return 'text-red-600';
      case 'new_review':
        return 'text-yellow-600';
      case 'report_status_updated':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up polling for new notifications
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px]"
        >
          <FaBell className="text-xl sm:text-2xl text-emerald-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold shadow">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto mx-4 sm:mx-0">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-3 cursor-pointer hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-start gap-3 w-full">
                <div className={`text-xl ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400">
                    {notification.age}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                navigate('/notifications');
                setIsOpen(false);
              }}
              className="text-center text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationIcon;
