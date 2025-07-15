import express from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem } from '../controllers/cart.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getCart);
router.post('/add', protect, addToCart);
router.patch('/update', protect, updateCartItem);
router.delete('/remove/:productId', protect, removeCartItem);

export default router; 