import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';
import { upload, submitSellerVerification, reviewSellerApplication } from '../controllers/seller.controller.js';

const router = express.Router();

// Seller verification route
router.post(
  '/verify',
  protect,
  upload.fields([
    { name: 'govIDs', maxCount: 2 },
    { name: 'proofOfAddress', maxCount: 1 },
    { name: 'bankProof', maxCount: 1 },
    { name: 'dtiRegistration', maxCount: 1 },
    { name: 'businessPermit', maxCount: 1 },
    { name: 'birRegistration', maxCount: 1 },
  ]),
  submitSellerVerification
);

// Admin: Approve or reject seller application
router.patch(
  '/verify/:applicationId/review',
  protect,
  isAdmin,
  reviewSellerApplication
);

export default router;
