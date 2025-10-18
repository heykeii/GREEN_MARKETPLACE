import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.middleware.js';
import { sellerOnly } from '../middleware/auth.middleware.js';
import {
  createProduct,
  getProductsBySeller,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,
  updateProductQuantity,
  getAllApprovedProducts,
  getProductById,
  searchProducts,
  filterProducts,
  getRelatedProducts,
  getProductsBySellerPublic,
  getProductsBySellers,
  calculateSustainabilityPreview,
  recalculateSustainabilityScore,
  getProductSustainabilityDetails
} from '../controllers/product.controller.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Create product route
router.post('/create/product', protect, sellerOnly, upload.array('images', 10), createProduct);

// Protected seller routes
router.get('/my-products', protect, sellerOnly, getProductsBySeller);
router.patch('/update/:productId', protect, sellerOnly, upload.array('images', 10), updateProduct);
router.delete('/delete/:productId', protect, sellerOnly, deleteProduct);
router.patch('/toggle-availability/:productId', protect, sellerOnly, toggleProductAvailability);
router.patch('/update-quantity/:productId', protect, sellerOnly, updateProductQuantity);

// Sustainability scoring routes
router.post('/sustainability/preview', protect, sellerOnly, calculateSustainabilityPreview);
router.patch('/sustainability/recalculate/:productId', protect, sellerOnly, recalculateSustainabilityScore);

// Public marketplace routes
router.get('/', getAllApprovedProducts);
router.get('/view/:productId', getProductById);
router.get('/search', searchProducts);
router.get('/filter', filterProducts);
router.get('/related/:productId', getRelatedProducts);
// Public: products by seller
router.get('/by-seller/:sellerId', getProductsBySellerPublic);
// Public: products by multiple sellers (for campaigns)
router.get('/by-sellers', getProductsBySellers);
// Public: sustainability details
router.get('/sustainability/:productId', getProductSustainabilityDetails);

export default router;
