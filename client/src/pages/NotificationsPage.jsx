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
      case 'feedback_replied':
        return '🗨️';
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
      case 'product_approved':
        return '✅';
      case 'product_rejected':
        return '❌';
      case 'product_status_updated':
        return '📦';
      case 'campaign_approved':
        return '🎉';
      case 'campaign_rejected':
        return '⚠️';
      case 'receipt_verified':
      case 'payment_received':
        return '💰';
      case 'receipt_rejected':
        return '❌';
      case 'receipt_needs_review':
        return '🔍';
      case 'badge_earned':
        return '🏆';
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
      case 'feedback_replied':
        return 'text-blue-600';
      case 'order_cancelled':
      case 'order_cancelled_by_customer':
        return 'text-red-600';
      case 'new_review':
        return 'text-yellow-600';
      case 'report_status_updated':
        return 'text-blue-600';
      case 'seller_application_approved':
      case 'product_approved':
        return 'text-emerald-600';
      case 'seller_application_rejected':
      case 'product_rejected':
        return 'text-red-600';
      case 'product_status_updated':
        return 'text-blue-600';
      case 'campaign_approved':
        return 'text-green-600';
      case 'campaign_rejected':
        return 'text-orange-600';
      case 'receipt_verified':
      case 'payment_received':
        return 'text-green-600';
      case 'receipt_rejected':
        return 'text-red-600';
      case 'receipt_needs_review':
        return 'text-yellow-600';
      case 'badge_earned':
        return 'text-purple-600';
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
      'feedback_replied': 'Feedback Reply',
      'order_status_updated': 'Order Status Update',
      'order_confirmed': 'Order Confirmed',
      'order_ready': 'Order Ready',
      'order_completed': 'Order Completed',
      'order_cancelled': 'Order Cancelled',
      'order_cancelled_by_customer': 'Order Cancelled by Customer',
      'report_status_updated': 'Report Status Update',
      'system_message': 'System Message',
      'seller_application_approved': 'Seller Application Approved',
      'seller_application_rejected': 'Seller Application Rejected',
      'product_approved': 'Product Approved',
      'product_rejected': 'Product Rejected',
      'product_status_updated': 'Product Status Updated',
      'campaign_approved': 'Campaign Approved',
      'campaign_rejected': 'Campaign Rejected',
      'receipt_verified': 'Receipt Verified',
      'receipt_rejected': 'Receipt Rejected',
      'payment_received': 'Payment Received',
      'receipt_needs_review': 'Receipt Needs Review',
      'badge_earned': 'Badge Earned'
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
      <div className="min-h-screen bg-gradient-to-br from-[#f5fdfb] via-[#e7f7f4] to-[#daf2ef] py-4 sm:py-6 md:py-8 lg:py-14 px-2 sm:px-3 md:px-4 lg:px-6 pt-16 sm:pt-20 md:pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-emerald-800 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
              <FaBell className="text-emerald-600 text-xl sm:text-2xl md:text-3xl" />
              <span className="break-words">Notifications</span>
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base">Stay updated with your latest activities</p>
          </div>

          {/* Filters and Actions */}
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base md:text-lg">Filters & Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4 sm:space-y-0">
                {/* Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Type</label>
                    <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value, page: 1 }))}>
                      <SelectTrigger className="h-9 sm:h-10">
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
                  
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Status</label>
                    <Select value={filters.isRead} onValueChange={(value) => setFilters(prev => ({ ...prev, isRead: value, page: 1 }))}>
                      <SelectTrigger className="h-9 sm:h-10">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="false">Unread</SelectItem>
                        <SelectItem value="true">Read</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className="sm:col-span-2 lg:col-span-1 flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <Button
                      onClick={markAllAsRead}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                      <FaCheckDouble className="text-xs sm:text-sm" />
                      <span className="hidden sm:inline">Mark All Read</span>
                      <span className="sm:hidden">Mark Read</span>
                    </Button>
                    <Button
                      onClick={deleteReadNotifications}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 sm:gap-2 text-red-600 hover:text-red-700 text-xs sm:text-sm"
                    >
                      <FaTrash className="text-xs sm:text-sm" />
                      <span className="hidden sm:inline">Delete Read</span>
                      <span className="sm:hidden">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                <div className="text-gray-500">
                  <FaBell className="text-4xl sm:text-5xl md:text-6xl mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-base sm:text-lg mb-1 sm:mb-2">No notifications found</p>
                  <p className="text-xs sm:text-sm">You're all caught up!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {notifications.map((notification) => (
                <Card key={notification._id} className={`${!notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''}`}>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      {/* Icon and Content */}
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className={`text-xl sm:text-2xl ${getNotificationColor(notification.type)} flex-shrink-0`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Title and Badges */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h3 className={`font-semibold text-sm sm:text-base break-words ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(notification.type)}
                              </Badge>
                              {!notification.isRead && (
                                <Badge className="bg-blue-500 text-white text-xs">
                                  New
                                </Badge>
                              )}
                              {notification.priority === 'high' && (
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  High Priority
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Message */}
                          <p className="text-gray-600 text-sm sm:text-base mb-2 break-words">{notification.message}</p>
                          
                          {/* Time */}
                          <div className="text-xs sm:text-sm text-gray-500">
                            <span>{notification.age}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-row sm:flex-col gap-2 sm:gap-2 sm:ml-4">
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRead(notification._id)}
                            className="flex items-center gap-1 text-xs sm:text-sm flex-1 sm:flex-none"
                          >
                            <FaCheck className="text-xs" />
                            <span className="hidden sm:inline">Mark Read</span>
                            <span className="sm:hidden">Read</span>
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteNotification(notification._id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs sm:text-sm flex-1 sm:flex-none"
                        >
                          <FaTrash className="text-xs" />
                          <span className="hidden sm:inline">Delete</span>
                          <span className="sm:hidden">Del</span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Action URL Button */}
                    {notification.actionUrl && (
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNotificationClick(notification)}
                          className="text-emerald-600 hover:text-emerald-700 w-full sm:w-auto text-xs sm:text-sm"
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
            <div className="flex justify-center mt-6 sm:mt-8">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2">
                <div className="flex gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === 1}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  
                  <div className="flex items-center px-2 sm:px-4">
                    <span className="text-xs sm:text-sm text-gray-600">
                      <span className="hidden sm:inline">Page </span>
                      {pagination.currentPage} <span className="hidden sm:inline">of</span> <span className="sm:hidden">/</span> {pagination.totalPages}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                  </Button>
                </div>
                
                {/* Page Info */}
                <div className="text-xs sm:text-sm text-gray-500">
                  {pagination.totalItems} total notifications
                </div>
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
