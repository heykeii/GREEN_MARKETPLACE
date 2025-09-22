import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';
import { listFeedback, updateFeedbackStatus } from '../controllers/feedback.controller.js';

const router = express.Router();

// All routes here are admin-only
router.use(protect);
router.use(isAdmin);

router.get('/', listFeedback);
router.patch('/:id/status', updateFeedbackStatus);

export default router;


