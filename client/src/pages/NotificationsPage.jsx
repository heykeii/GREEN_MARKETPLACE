import React, { useState, useEffect } from 'react';
import { toast } from '@/utils/toast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaBell, FaTrash, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    isRead: 'all',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [filters]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const queryFilters = { ...filters };
      if (queryFilters.type === 'all') delete queryFilters.type;
      if (queryFilters.isRead === 'all') delete queryFilters.isRead;
      
      const queryParams = new URLSearchParams(queryFilters).toString();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
        setPagination(data.pagination);
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
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        toast.success('Notification marked as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const deleteReadNotifications = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/notifications/delete-read`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => !notif.isRead));
        toast.success('Read notifications deleted');
      }
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      toast.error('Failed to delete notifications');
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
        return '🛒';
      case 'new_review':
        return '⭐';
      case 'user_followed_you':
        return '👥';
      case 'campaign_liked':
        return '❤️';
      case 'campaign_commented':
        return '💬';
      case 'campaign_joined':
        return '🤝';
      case 'review_reply':
        return '↩️';
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
      case 'seller_application_approved':
        return '✅';
      case 'seller_application_rejected':
        return '❗';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_order':
      case 'order_completed':
        return 'text-green-600';
      case 'user_followed_you':
      case 'campaign_joined':
        return 'text-emerald-600';
      case 'campaign_liked':
        return 'text-red-600';
      case 'campaign_commented':
      case 'review_reply':
        return 'text-blue-600';
      case 'order_cancelled':
      case 'order_cancelled_by_customer':
        return 'text-red-600';
      case 'new_review':
        return 'text-yellow-600';
      case 'report_status_updated':
        return 'text-blue-600';
      case 'seller_application_approved':
        return 'text-emerald-600';
      case 'seller_application_rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeLabel = (type) => {
    const typeMap = {
      'new_order': 'New Order',
      'new_review': 'New Review',
      'user_followed_you': 'New Follower',
      'campaign_liked': 'Campaign Liked',
      'campaign_commented': 'Campaign Comment',
      'campaign_joined': 'Campaign Joined',
      'review_reply': 'Review Reply',
      'order_status_updated': 'Order Status Update',
      'order_confirmed': 'Order Confirmed',
      'order_ready': 'Order Ready',
      'order_completed': 'Order Completed',
      'order_cancelled': 'Order Cancelled',
      'order_cancelled_by_customer': 'Order Cancelled by Customer',
      'report_status_updated': 'Report Status Update',
      'system_message': 'System Message',
      'seller_application_approved': 'Seller Application Approved',
      'seller_application_rejected': 'Seller Application Rejected'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-[#f5fdfb] via-[#e7f7f4] to-[#daf2ef] py-16 px-4 pt-24">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-center items-center py-20">
              <div className="text-2xl text-emerald-600">Loading notifications...</div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#f5fdfb] via-[#e7f7f4] to-[#daf2ef] py-14 sm:py-16 px-3 sm:px-4 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-emerald-800 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
              <FaBell className="text-emerald-600 text-3xl" />
              Notifications
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">Stay updated with your latest activities</p>
          </div>

          {/* Filters and Actions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters & Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-48">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value, page: 1 }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="new_order">New Orders</SelectItem>
                      <SelectItem value="new_review">New Reviews</SelectItem>
                      <SelectItem value="order_status_updated">Order Updates</SelectItem>
                      <SelectItem value="order_cancelled">Order Cancellations</SelectItem>
                      <SelectItem value="report_status_updated">Report Updates</SelectItem>
                      <SelectItem value="system_message">System Messages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 min-w-48">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filters.isRead} onValueChange={(value) => setFilters(prev => ({ ...prev, isRead: value, page: 1 }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="false">Unread</SelectItem>
                      <SelectItem value="true">Read</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={markAllAsRead}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FaCheckDouble />
                    Mark All Read
                  </Button>
                  <Button
                    onClick={deleteReadNotifications}
                    variant="outline"
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <FaTrash />
                    Delete Read
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-500">
                  <FaBell className="text-6xl mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">No notifications found</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card key={notification._id} className={`${!notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`text-2xl ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className={`font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(notification.type)}
                            </Badge>
                            {!notification.isRead && (
                              <Badge className="bg-blue-500 text-white text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-gray-600 mb-2">{notification.message}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{notification.age}</span>
                            {notification.priority === 'high' && (
                              <Badge className="bg-red-100 text-red-800 text-xs">
                                High Priority
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRead(notification._id)}
                            className="flex items-center gap-1"
                          >
                            <FaCheck />
                            Mark Read
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteNotification(notification._id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </div>
                    
                    {notification.actionUrl && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNotificationClick(notification)}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          View Details
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={pagination.currentPage === 1}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotificationsPage;
