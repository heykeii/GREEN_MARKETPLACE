import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';
import { getAdminStats, getSellerApplications, getSellerApplicationById, getAllUsers, getPendingProducts, approveProduct, rejectProduct } from '../controllers/admin.controller.js';
import { getProfile } from '../controllers/user.controller.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

// Get admin dashboard statistics
router.get('/stats', getAdminStats);

// Get all seller applications
router.get('/seller/applications', getSellerApplications);

// Get a specific seller application by ID
router.get('/seller/applications/:applicationId', getSellerApplicationById);

//get all users that are active
router.get('/get-all-users', getAllUsers);

// Product verification routes
router.get('/products/pending', getPendingProducts);
router.patch('/products/approve/:productId', approveProduct);
router.patch('/products/reject/:productId', rejectProduct);

// Add after other admin routes
router.get('/user/profile/:userId', getProfile);

export default router; 