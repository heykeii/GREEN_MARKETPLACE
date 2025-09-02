import Notification from '../models/notification.model.js';
import { errorResponse } from '../middleware/error.middleware.js';

// Create a new notification
export const createNotification = async (recipientId, type, title, message, relatedData = {}, actionUrl = null, priority = 'medium') => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      type,
      title,
      message,
      relatedData,
      actionUrl,
      priority
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get user's notifications
export const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user._id;

    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('relatedData.orderId', 'orderNumber status')
      .populate('relatedData.productId', 'name images')
      .populate('relatedData.reviewId', 'rating comment')
      .populate('relatedData.reportId', 'reportNumber status');

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    errorResponse(res, 500, 'Failed to fetch notifications');
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return errorResponse(res, 404, 'Notification not found');
    }

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    errorResponse(res, 500, 'Failed to mark notification as read');
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    errorResponse(res, 500, 'Failed to mark notifications as read');
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    res.status(200).json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    errorResponse(res, 500, 'Failed to get unread count');
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return errorResponse(res, 404, 'Notification not found');
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    errorResponse(res, 500, 'Failed to delete notification');
  }
};

// Delete all read notifications
export const deleteReadNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({
      recipient: userId,
      isRead: true
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} notifications deleted successfully`
    });
  } catch (error) {
    errorResponse(res, 500, 'Failed to delete notifications');
  }
};
