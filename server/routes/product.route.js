import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.middleware.js';
import {
  createProduct,
  getProductsBySeller,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,
  getAllApprovedProducts,
  getProductById,
  searchProducts,
  filterProducts,
  getRelatedProducts
} from '../controllers/product.controller.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Create product route
router.post('/create/product', protect, upload.array('images', 5), createProduct);

// Protected seller routes
router.get('/my-products', protect, getProductsBySeller);
router.patch('/update/:productId', protect, updateProduct);
router.delete('/delete/:productId', protect, deleteProduct);
router.patch('/toggle-availability/:productId', protect, toggleProductAvailability);

// Public marketplace routes
router.get('/', getAllApprovedProducts);
router.get('/view/:productId', getProductById);
router.get('/search', searchProducts);
router.get('/filter', filterProducts);
router.get('/related/:productId', getRelatedProducts);

export default router;
