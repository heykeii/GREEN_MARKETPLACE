import express from 'express';
import { getBadgeProgress, getEarnedBadges, getPublicBadges } from '../controllers/badge.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get current user's badge progress
router.get('/progress', protect, getBadgeProgress);

// Get current user's earned badges
router.get('/earned', protect, getEarnedBadges);

// Get public badges for a specific user
router.get('/public/:userId', getPublicBadges);

export default router;
