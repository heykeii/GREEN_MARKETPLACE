import express from 'express';
import {
    createOrder,
    createDirectOrder,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    getAllOrders,
    getSellerOrders,
    cancelOrder,
    calculateShipping,
    verifyReceiptBeforeOrder,
    submitCommissionReceipt,
    uploadCommissionReceipt
} from '../controllers/order.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Customer routes
router.post('/create', protect, createOrder);
router.post('/create-direct', protect, createDirectOrder);
router.post('/calculate-shipping', protect, calculateShipping);
router.post('/verify-receipt', protect, verifyReceiptBeforeOrder);
router.get('/my-orders', protect, getUserOrders);
router.get('/:orderId', protect, getOrderById);
router.put('/:orderId/cancel', protect, cancelOrder);

// Seller routes
router.get('/seller/orders', protect, getSellerOrders);
router.put('/seller/:orderId/status', protect, updateOrderStatus);
router.post('/seller/commission-receipt', protect, uploadCommissionReceipt.single('receipt'), submitCommissionReceipt);

// Admin routes
router.get('/admin/all', protect, isAdmin, getAllOrders);
router.put('/admin/:orderId/status', protect, isAdmin, updateOrderStatus);

export default router;
