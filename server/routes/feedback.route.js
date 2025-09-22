import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';
import { createFeedback, listFeedback, updateFeedbackStatus } from '../controllers/feedback.controller.js';

const router = express.Router();

// Public or authenticated users can submit; if logged in, protect will populate user
router.post('/', protect, createFeedback);
router.post('/public', createFeedback);

// Admin endpoints
router.get('/', protect, isAdmin, listFeedback);
router.patch('/:id/status', protect, isAdmin, updateFeedbackStatus);

export default router;


