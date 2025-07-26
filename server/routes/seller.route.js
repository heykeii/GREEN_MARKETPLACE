import express from 'express';
import { 
  getSellerAnalytics, 
  submitSellerVerification, 
  reviewSellerApplication 
} from '../controllers/seller.controller.js';
import { protect, sellerOnly } from '../middleware/auth.middleware.js';
import { upload } from '../controllers/seller.controller.js';

const router = express.Router();

// Analytics endpoint
router.get('/analytics', protect, sellerOnly, getSellerAnalytics);

// Seller verification routes
router.post('/verify', protect, upload.fields([
  { name: 'govIDs', maxCount: 2 },
  { name: 'proofOfAddress', maxCount: 1 },
  { name: 'bankProof', maxCount: 1 },
  { name: 'dtiRegistration', maxCount: 1 },
  { name: 'businessPermit', maxCount: 1 },
  { name: 'birRegistration', maxCount: 1 }
]), submitSellerVerification);

// Admin review seller application
router.patch('/verify/:applicationId/review', protect, reviewSellerApplication);

export default router;
