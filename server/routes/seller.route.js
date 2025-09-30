import express from 'express';
import { 
  getSellerAnalytics, 
  submitSellerVerification, 
  reviewSellerApplication,
  getMyGcashDetails,
  getSellerGcashDetails,
  updateGcashDetails
} from '../controllers/seller.controller.js';
import { protect, sellerOnly } from '../middleware/auth.middleware.js';
import { upload } from '../controllers/seller.controller.js';

const router = express.Router();

// Analytics endpoint
router.get('/analytics', protect, sellerOnly, getSellerAnalytics);

// Debug endpoint to check seller status
router.get('/debug-status', protect, (req, res) => {
  res.json({
    success: true,
    userId: req.user._id,
    email: req.user.email,
    isSeller: req.user.isSeller,
    sellerStatus: req.user.sellerStatus,
    role: req.user.role,
    canAccessAnalytics: req.user.isSeller && req.user.sellerStatus === 'verified'
  });
});

// Analytics endpoint with basic auth only (for testing)
router.get('/analytics-basic', protect, getSellerAnalytics);

// Seller verification routes
router.post('/verify', protect, upload.fields([
  { name: 'govIDs', maxCount: 2 },
  { name: 'tinDocument', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 },
  { name: 'bankProof', maxCount: 1 },
  { name: 'gcashQR', maxCount: 1 },
  { name: 'dtiRegistration', maxCount: 1 },
  { name: 'businessPermit', maxCount: 1 },
  { name: 'birRegistration', maxCount: 1 }
]), submitSellerVerification);

// Admin review seller application
router.patch('/verify/:applicationId/review', protect, reviewSellerApplication);

// GCash routes
router.get('/gcash/me', protect, sellerOnly, getMyGcashDetails);
router.get('/:sellerId/gcash', protect, getSellerGcashDetails);
router.post('/gcash', protect, sellerOnly, upload.single('gcashQR'), updateGcashDetails);

export default router;
