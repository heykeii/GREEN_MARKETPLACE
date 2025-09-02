import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotification,
  deleteReadNotifications
} from '../controllers/notification.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get user's notifications
router.get('/', getUserNotifications);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', markNotificationAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllNotificationsAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

// Delete all read notifications
router.delete('/delete-read', deleteReadNotifications);

export default router;
