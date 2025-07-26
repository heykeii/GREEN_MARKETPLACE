import express from 'express';
import { getSellerAnalytics } from '../controllers/seller.controller.js';
import { protect, sellerOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

// Analytics endpoint
router.get('/analytics', protect, sellerOnly, getSellerAnalytics);

export default router;
