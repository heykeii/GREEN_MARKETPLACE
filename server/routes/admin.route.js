import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';
import { getAdminStats, getSellerApplications } from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

// Get admin dashboard statistics
router.get('/stats', getAdminStats);

// Get all seller applications
router.get('/seller/applications', getSellerApplications);

export default router; 