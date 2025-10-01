import express from 'express';
import { 
    calculateCarbonFootprint, 
    getCarbonFootprint, 
    getUserCarbonSavings,
    getAllCarbonFootprints,
    verifyCarbonFootprint,
    getCarbonFootprintStats
} from '../controllers/carbonFootprint.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Calculate carbon footprint for a product
router.post('/:productId/calculate', protect, calculateCarbonFootprint);

// Get carbon footprint for a product
router.get('/:productId', getCarbonFootprint);

// Get user's carbon savings dashboard
router.get('/user/savings', protect, getUserCarbonSavings);

// Admin routes
router.get('/admin/all', protect, isAdmin, getAllCarbonFootprints);
router.put('/admin/:carbonFootprintId/verify', protect, isAdmin, verifyCarbonFootprint);
router.get('/admin/stats', protect, isAdmin, getCarbonFootprintStats);

export default router;
