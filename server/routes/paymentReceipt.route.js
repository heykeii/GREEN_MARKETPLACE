import express from 'express';
import {
    uploadGcashReceipt,
    getReceiptByOrder,
    getUserReceipts,
    getAllReceipts,
    reviewReceipt,
    verifyReceiptOnly,
    upload
} from '../controllers/paymentReceipt.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Customer/Seller routes
router.post('/upload', protect, upload.single('receipt'), uploadGcashReceipt);
router.post('/verify-only', protect, upload.single('receipt'), verifyReceiptOnly);
router.get('/order/:orderId', protect, getReceiptByOrder);
router.get('/my-receipts', protect, getUserReceipts);

// Admin routes
router.get('/admin/all', protect, isAdmin, getAllReceipts);
router.put('/admin/:receiptId/review', protect, isAdmin, reviewReceipt);

export default router;
