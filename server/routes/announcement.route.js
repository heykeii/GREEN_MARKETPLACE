import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';
import {
  createAnnouncement,
  getAnnouncements,
  getUserAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcement.controller.js';

const router = express.Router();

// Admin routes (require admin authentication)
router.post('/admin', protect, isAdmin, createAnnouncement);
router.get('/admin', protect, isAdmin, getAnnouncements);
router.put('/admin/:announcementId', protect, isAdmin, updateAnnouncement);
router.delete('/admin/:announcementId', protect, isAdmin, deleteAnnouncement);

// Protected user routes (require authentication)
router.get('/my-announcements', protect, getUserAnnouncements);
router.get('/:announcementId', protect, getAnnouncementById);

// Public routes (with optional auth)
router.get('/public', getUserAnnouncements);
router.get('/public/:announcementId', getAnnouncementById);

export default router;
