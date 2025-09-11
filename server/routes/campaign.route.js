import express from 'express';
import {
  createCampaign,
  getCampaigns,
  getCampaignsByUser,
  getMyCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  verifyCampaign,
  toggleLikeCampaign,
  addComment,
  joinCampaign
} from '../controllers/campaign.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';
import multer from 'multer';

const router = express.Router();
// Use memory storage so we can stream to Cloudinary in the controller
const upload = multer({ storage: multer.memoryStorage() });

// General campaign routes
// Accept up to 10 images uploaded from client
router.post('/create', protect, upload.array('media', 10), createCampaign);
router.get('/', getCampaigns); // Public route, but filtered by verification status
router.get('/me', protect, getMyCampaigns);
router.get('/by-user/:userId', getCampaignsByUser);
router.get('/:id', getCampaignById); // Public route, but filtered by verification status
router.put('/:id', protect, updateCampaign);
router.delete('/:id', protect, deleteCampaign);

// Admin verification
router.put('/:id/verify', protect, isAdmin, verifyCampaign);

// Awareness campaign features
router.post('/:id/like', protect, toggleLikeCampaign);
router.post('/:id/comment', protect, addComment);

// Community campaign features
router.post('/:id/join', protect, joinCampaign);

export default router;
