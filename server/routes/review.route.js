import express from 'express';
import multer from 'multer';
import {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  toggleHelpful,
  getReviewableProducts,
  getAllReviews,
  toggleReviewVisibility,
  replyToReview,
  deleteReply
} from '../controllers/review.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes
router.get('/product/:productId', getProductReviews); // Get reviews for a product

// Protected routes (require authentication)
router.use(protect);

// User review routes
router.post('/', upload.array('images', 5), createReview); // Create a review
router.get('/my-reviews', getUserReviews); // Get user's own reviews
router.get('/reviewable', getReviewableProducts); // Get products user can review
router.put('/:reviewId', upload.array('images', 5), updateReview); // Update a review
router.delete('/:reviewId', deleteReview); // Delete a review
router.post('/:reviewId/helpful', toggleHelpful); // Mark review as helpful/unhelpful
// Seller reply routes
router.post('/:reviewId/reply', replyToReview);
router.delete('/:reviewId/reply', deleteReply);

// Admin routes
router.get('/admin/all', isAdmin, getAllReviews); // Get all reviews (admin)
router.patch('/admin/:reviewId/visibility', isAdmin, toggleReviewVisibility); // Toggle review visibility (admin)

export default router;
