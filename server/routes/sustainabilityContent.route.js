import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';
import { createContent, updateContent, deleteContent, getPublicContent, getAdminContent, getPublicContentById } from '../controllers/sustainabilityContent.controller.js';
import cloudinary from '../utils/cloudinary.js';

const router = express.Router();

// Public
router.get('/public', getPublicContent);
router.get('/public/:id', getPublicContentById);

// Admin
router.use(protect);
router.use(isAdmin);
router.get('/', getAdminContent);
router.post('/', createContent);
router.patch('/:id', updateContent);
router.delete('/:id', deleteContent);

// Cloudinary upload via base64 data URL
router.post('/upload', async (req, res) => {
  try {
    const { dataUrl, folder = 'sustainability', resourceType = 'auto' } = req.body;
    if (!dataUrl) return res.status(400).json({ success: false, message: 'dataUrl is required' });
    // Accept both base64 data URLs and https URLs
    const uploadSource = dataUrl.startsWith('data:') ? dataUrl : dataUrl.trim();

    const uploadOnce = async () =>
      cloudinary.uploader.upload(uploadSource, { folder, resource_type: resourceType, timeout: 120000 });

    let result;
    try {
      result = await uploadOnce();
    } catch (err) {
      // Retry once on timeout
      if (String(err?.name || '').toLowerCase().includes('timeout')) {
        console.warn('Cloudinary timeout, retrying once...');
        result = await uploadOnce();
      } else {
        throw err;
      }
    }

    return res.status(201).json({
      success: true,
      media: { url: result.secure_url, type: result.resource_type === 'image' ? 'image' : result.resource_type, publicId: result.public_id }
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error?.message || error);
    return res.status(500).json({ success: false, message: 'Upload failed', error: process.env.NODE_ENV === 'development' ? error?.message : undefined });
  }
});

export default router;


