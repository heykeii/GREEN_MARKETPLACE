import Order from '../models/orders.model.js';
import Cart from '../models/cart.model.js';
import Product from '../models/products.model.js';
import SellerApplication from '../models/seller.model.js';
import PaymentReceipt from '../models/paymentReceipt.model.js';
import User from '../models/user.model.js';
import { NotificationService } from '../utils/notificationService.js';
import { BadgeService } from '../utils/badgeService.js';
import ShippingService from '../services/shipping.service.js';
import cloudinary from '../utils/cloudinary.js';
import multer from 'multer';

// Multer setup for commission receipt uploads
const storage = multer.memoryStorage();
export const uploadCommissionReceipt = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Helper function to upload commission receipt to Cloudinary
const uploadCommissionReceiptToCloudinary = async (fileBuffer, filename) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: 'commission_receipts',
                resource_type: 'image',
                transformation: [
                    { width: 1200, height: 1600, crop: 'limit' },
                    { quality: 'auto:good' }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        ).end(fileBuffer);
    });
};

// Create a new order from cart
export const createOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { paymentMethod, notes, shippingAddress, items: selectedItems } = req.body;

        console.log('Creating order for user:', userId);
        console.log('Selected items received:', JSON.stringify(selectedItems, null, 2));

        // Validate shipping address
        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || 
            !shippingAddress.address || !shippingAddress.city || !shippingAddress.province || 
            !shippingAddress.zipCode) {
            return res.status(400).json({
                success: false,
                message: 'Complete shipping address is required'
            });
        }

        // Get user's cart
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cart is empty' 
            });
        }

        let validItems;
        
        // If selected items are provided, filter cart to only include those items
        if (selectedItems && Array.isArray(selectedItems) && selectedItems.length > 0) {
            const selectedProductIds = selectedItems.map(item => item.productId.toString());
            validItems = cart.items.filter(item => 
                item.product && 
                item.product.isAvailable && 
                selectedProductIds.includes(item.product._id.toString())
            );
            
            // Update quantities and variants from selected items
            validItems = validItems.map(cartItem => {
                const selectedItem = selectedItems.find(
                    si => si.productId.toString() === cartItem.product._id.toString()
                );
                if (selectedItem) {
                    // Create a new object with updated quantity and variant
                    return {
                        product: cartItem.product,
                        quantity: selectedItem.quantity || cartItem.quantity,
                        variant: selectedItem.variant || cartItem.variant,
                        _id: cartItem._id
                    };
                }
                return cartItem;
            });
        } else {
            // Fallback: use all cart items (for backward compatibility)
            validItems = cart.items.filter(item => item.product && item.product.isAvailable);
        }
        
        if (validItems.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No valid items selected for checkout' 
            });
        }

        // Check stock availability
        for (const item of validItems) {
            if (item.product.quantity < item.quantity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Insufficient stock for ${item.product.name}. Available: ${item.product.quantity}, Requested: ${item.quantity}` 
                });
            }
        }

        // Calculate totals
        const orderItems = validItems.map(item => ({
            product: item.product._id,
            // snapshot chosen variant; use variant.price if provided, else product price
            variant: item.variant ? {
                name: item.variant.name,
                sku: item.variant.sku,
                attributes: item.variant.attributes || undefined,
                price: typeof item.variant.price === 'number' ? item.variant.price : undefined
            } : undefined,
            quantity: item.quantity,
            price: (typeof item?.variant?.price === 'number' ? item.variant.price : item.product.price)
        }));

        const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Calculate shipping fee - use seller-defined shipping fee from products
        let shippingFee = 0;
        let shippingDetails = null;
        
        // Get unique sellers and their shipping fees
        const sellerShippingFees = new Map();
        for (const item of validItems) {
            const sellerId = item.product.seller.toString();
            const productShippingFee = item.product.shippingFee || 0;
            
            if (!sellerShippingFees.has(sellerId)) {
                sellerShippingFees.set(sellerId, {
                    sellerId: sellerId,
                    shippingFee: productShippingFee,
                    sellerName: item.product.seller?.firstName + ' ' + item.product.seller?.lastName || 'Seller'
                });
            }
        }
        
        // Sum up shipping fees from all sellers (assuming one shipping fee per seller)
        shippingFee = Array.from(sellerShippingFees.values()).reduce((sum, seller) => sum + seller.shippingFee, 0);
        
        // If no seller-defined shipping fees, use free shipping
        if (shippingFee === 0) {
            shippingDetails = {
                isEstimated: false,
                explanation: 'Free shipping - no seller-defined fees'
            };
        } else {
            // Seller-defined shipping fees
            shippingDetails = {
                isEstimated: false,
                explanation: 'Seller-defined shipping fees',
                sellerFees: Array.from(sellerShippingFees.values())
            };
        }

        const totalAmount = subtotal + shippingFee;

        // Create order
        const order = new Order({
            customer: userId,
            items: orderItems,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : (req.body.verifiedReceiptData ? 'paid' : 'pending'),
            subtotal,
            shippingFee,
            shippingDetails,
            totalAmount,
            shippingAddress,
            notes: notes || ''
        });

        await order.save();

        // Create PaymentReceipt record if verified receipt data is provided
        if (paymentMethod === 'gcash' && req.body.verifiedReceiptData && req.body.receiptImageUrl) {
            try {
                const firstProductSellerId = validItems[0].product.seller;
                
                const paymentReceipt = new PaymentReceipt({
                    order: order._id,
                    customer: userId,
                    seller: firstProductSellerId,
                    originalReceiptImage: req.body.receiptImageUrl,
                    extractedData: req.body.verifiedReceiptData,
                    verificationStatus: 'verified',
                    validation: {
                        amountMatch: true,
                        receiverMatch: true,
                        referenceValid: true,
                        isDuplicate: false,
                        overallStatus: 'verified'
                    }
                });

                await paymentReceipt.save();

                // Send notifications
                await NotificationService.notifyReceiptVerified(
                    userId, 
                    order, 
                    req.body.verifiedReceiptData.referenceNumber
                );
                
                await NotificationService.notifyPaymentReceived(
                    firstProductSellerId, 
                    order, 
                    req.body.verifiedReceiptData.amount
                );
            } catch (receiptError) {
                console.error('Failed to create payment receipt record:', receiptError);
                // Don't fail the order creation if receipt record creation fails
            }
        }

        // Update product stock
        for (const item of validItems) {
            await Product.findByIdAndUpdate(
                item.product._id,
                { $inc: { quantity: -item.quantity } }
            );
        }

        // Remove only the ordered items from cart
        if (selectedItems && Array.isArray(selectedItems) && selectedItems.length > 0) {
            // Remove only selected items
            const orderedProductIds = validItems.map(item => item.product._id.toString());
            await Cart.findOneAndUpdate(
                { user: userId },
                { 
                    $pull: { 
                        items: { 
                            product: { $in: orderedProductIds.map(id => id) } 
                        } 
                    } 
                }
            );
        } else {
            // Clear entire cart (for backward compatibility)
            await Cart.findOneAndUpdate(
                { user: userId },
                { $set: { items: [] } }
            );
        }

        // Populate order for response
        await order.populate('items.product');
        await order.populate('customer', 'firstName lastName email');

        // Notify sellers about new order
        try {
            const sellerIds = new Set();
            for (const item of validItems) {
                if (item.product.seller) {
                    sellerIds.add(item.product.seller.toString());
                }
            }
            
            for (const sellerId of sellerIds) {
                await NotificationService.notifyNewOrder(sellerId, order);
            }
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
            // Don't fail the order creation if notification fails
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order
        });

    } catch (error) {
        console.error('Create order error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Direct checkout: create order from explicit items (bypass cart)
export const createDirectOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { paymentMethod, notes, shippingAddress, items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Items are required' });
        }

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || 
            !shippingAddress.address || !shippingAddress.city || !shippingAddress.province || 
            !shippingAddress.zipCode) {
            return res.status(400).json({ success: false, message: 'Complete shipping address is required' });
        }

        // Load products and validate stock
        const productIds = items.map(i => i.productId);
        const products = await Product.find({ _id: { $in: productIds } });
        const idToProduct = new Map(products.map(p => [p._id.toString(), p]));

        const orderItems = [];
        for (const i of items) {
            const p = idToProduct.get(String(i.productId));
            if (!p || !p.isAvailable) {
                return res.status(400).json({ success: false, message: 'Invalid or unavailable product in items' });
            }
            const qty = Math.max(1, parseInt(i.quantity || 1, 10));
            if (p.quantity < qty) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${p.name}` });
            }
            const variant = i.variant || null;
            orderItems.push({ 
                product: p._id, 
                variant: variant ? {
                    name: variant.name,
                    sku: variant.sku,
                    attributes: variant.attributes || undefined,
                    price: typeof variant.price === 'number' ? variant.price : undefined
                } : undefined,
                quantity: qty, 
                price: (typeof variant?.price === 'number' ? variant.price : p.price) 
            });
        }

        const subtotal = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
        
        // Calculate shipping fee - use seller-defined shipping fee from products
        let shippingFee = 0;
        let shippingDetails = null;
        
        // Get unique sellers and their shipping fees
        const sellerShippingFees = new Map();
        for (const item of orderItems) {
            const product = idToProduct.get(item.product.toString());
            const sellerId = product.seller.toString();
            const productShippingFee = product.shippingFee || 0;
            
            if (!sellerShippingFees.has(sellerId)) {
                sellerShippingFees.set(sellerId, {
                    sellerId: sellerId,
                    shippingFee: productShippingFee,
                    sellerName: product.seller?.firstName + ' ' + product.seller?.lastName || 'Seller'
                });
            }
        }
        
        // Sum up shipping fees from all sellers (assuming one shipping fee per seller)
        shippingFee = Array.from(sellerShippingFees.values()).reduce((sum, seller) => sum + seller.shippingFee, 0);
        
        // If no seller-defined shipping fees, use free shipping
        if (shippingFee === 0) {
            shippingDetails = {
                isEstimated: false,
                explanation: 'Free shipping - no seller-defined fees'
            };
        } else {
            // Seller-defined shipping fees
            shippingDetails = {
                isEstimated: false,
                explanation: 'Seller-defined shipping fees',
                sellerFees: Array.from(sellerShippingFees.values())
            };
        }

        const totalAmount = subtotal + shippingFee;

        const order = new Order({
            customer: userId,
            items: orderItems,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : (req.body.verifiedReceiptData ? 'paid' : 'pending'),
            subtotal,
            shippingFee,
            shippingDetails,
            totalAmount,
            shippingAddress,
            notes: notes || ''
        });

        await order.save();

        // Create PaymentReceipt record if verified receipt data is provided
        if (paymentMethod === 'gcash' && req.body.verifiedReceiptData && req.body.receiptImageUrl) {
            try {
                const firstProductSellerId = products[0]?.seller;
                
                const paymentReceipt = new PaymentReceipt({
                    order: order._id,
                    customer: userId,
                    seller: firstProductSellerId,
                    originalReceiptImage: req.body.receiptImageUrl,
                    extractedData: req.body.verifiedReceiptData,
                    verificationStatus: 'verified',
                    validation: {
                        amountMatch: true,
                        receiverMatch: true,
                        referenceValid: true,
                        isDuplicate: false,
                        overallStatus: 'verified'
                    }
                });

                await paymentReceipt.save();

                // Send notifications
                await NotificationService.notifyReceiptVerified(
                    userId, 
                    order, 
                    req.body.verifiedReceiptData.referenceNumber
                );
                
                await NotificationService.notifyPaymentReceived(
                    firstProductSellerId, 
                    order, 
                    req.body.verifiedReceiptData.amount
                );
            } catch (receiptError) {
                console.error('Failed to create payment receipt record:', receiptError);
                // Don't fail the order creation if receipt record creation fails
            }
        }

        // Decrement stock
        for (const it of orderItems) {
            await Product.findByIdAndUpdate(it.product, { $inc: { quantity: -it.quantity } });
        }

        await order.populate('items.product');
        await order.populate('customer', 'firstName lastName email');

        // Notify involved sellers
        try {
            const sellerIds = new Set();
            for (const it of orderItems) {
                const p = idToProduct.get(String(it.product));
                if (p?.seller) sellerIds.add(p.seller.toString());
            }
            for (const sellerId of sellerIds) {
                await NotificationService.notifyNewOrder(sellerId, order);
            }
        } catch (e) {}

        return res.status(201).json({ success: true, message: 'Order created successfully', order });
    } catch (error) {
        console.error('Create direct order error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
    }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const orders = await Order.find({ customer: userId })
            .populate('items.product', 'name images price seller quantity isAvailable')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalOrders = await Order.countDocuments({ customer: userId });

        // Filter out any null products and format the response
        const formattedOrders = orders.map(order => ({
            ...order,
            items: order.items.filter(item => item.product !== null)
        }));

        res.json({
            success: true,
            orders: formattedOrders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders,
                hasNext: page < Math.ceil(totalOrders / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

// Get single order by ID
export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ 
            _id: orderId, 
            customer: userId 
        })
        .populate('items.product', 'name images price seller')
        .populate('customer', 'firstName lastName email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            order
        });

    } catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order',
            error: error.message
        });
    }
};

// Update order status (for admin/seller)
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, reason } = req.body;
        const userId = req.user._id;
        const isAdmin = req.user.isAdmin;

        const validStatuses = ['pending', 'confirmed', 'ready', 'completed', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order status'
            });
        }

        // First, find the order to check if it exists and validate seller access
        const order = await Order.findById(orderId)
            .populate('items.product', 'name images price seller')
            .populate('customer', 'firstName lastName email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // If not admin, validate that the seller can only update orders containing their products
        if (!isAdmin) {
            const sellerProducts = await Product.find({ seller: userId }).select('_id');
            const sellerProductIds = sellerProducts.map(p => p._id.toString());
            
            const orderProductIds = order.items.map(item => item.product._id.toString());
            const hasSellerProducts = orderProductIds.some(productId => sellerProductIds.includes(productId));
            
            if (!hasSellerProducts) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only update orders containing your products'
                });
            }
        }

        // Store old status for notification
        const oldStatus = order.status;

        // Prepare update object
        const updateData = { status };
        
        // When order is marked as completed, also mark payment as paid
        // This ensures analytics accurately track completed orders
        if (status === 'completed') {
            updateData.paymentStatus = 'paid';
        }

        // Add cancellation details when cancelling
        if (status === 'cancelled') {
            updateData.cancellation = {
                reason: (reason || '').toString().slice(0, 300),
                cancelledBy: userId,
                cancelledAt: new Date()
            };
        }

        // Update the order status (and payment status if needed)
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true }
        ).populate('items.product', 'name images price')
        .populate('customer', 'firstName lastName email');

        // Notify customer about status change
        try {
            await NotificationService.notifyOrderStatusUpdate(
                order.customer._id,
                { ...order.toObject(), cancellation: updateData.cancellation || order.cancellation },
                status,
                oldStatus
            );
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
            // Don't fail the status update if notification fails
        }

        // Track purchase count and check for badges when order is completed
        if (status === 'completed' && oldStatus !== 'completed') {
            try {
                // Calculate total quantity of items purchased
                const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                
                // Update purchase count and check for badges
                await BadgeService.updatePurchaseCount(order.customer._id, totalQuantity);
            } catch (badgeError) {
                console.error('Failed to update purchase count and check badges:', badgeError);
                // Don't fail the status update if badge tracking fails
            }
        }

        // Emit real-time analytics update to seller when order status changes
        // This ensures seller dashboard analytics refresh automatically
        if (status === 'completed' || status === 'ready') {
            try {
                const { getIO } = await import('../utils/socket.js');
                const io = getIO();
                if (io && order.items && order.items.length > 0) {
                    // Get seller ID from the first product
                    const sellerProduct = await Product.findById(order.items[0].product._id).select('seller');
                    if (sellerProduct && sellerProduct.seller) {
                        io.to(sellerProduct.seller.toString()).emit('seller_analytics_updated', {
                            reason: 'order_status_changed',
                            orderId: order._id,
                            status: status,
                            oldStatus: oldStatus
                        });
                        console.log(`Analytics update emitted to seller ${sellerProduct.seller}`);
                    }
                }
            } catch (socketError) {
                console.error('Failed to emit analytics update:', socketError);
                // Don't fail the status update if socket emission fails
            }
        }

        res.json({
            success: true,
            message: 'Order status updated successfully',
            order: updatedOrder
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status',
            error: error.message
        });
    }
};

// Get all orders (admin only)
export const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        const filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }

        const orders = await Order.find(filter)
            .populate('items.product', 'name images price seller')
            .populate('customer', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalOrders = await Order.countDocuments(filter);

        res.json({
            success: true,
            orders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders,
                hasNext: page < Math.ceil(totalOrders / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

// Get seller's orders
export const getSellerOrders = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        // Get seller's products
        const sellerProducts = await Product.find({ seller: sellerId }).select('_id');
        const productIds = sellerProducts.map(p => p._id);

        // Build filter
        const filter = {
            'items.product': { $in: productIds }
        };
        
        if (status && status !== 'all') {
            filter.status = status;
        }

        const orders = await Order.find(filter)
            .populate('items.product', 'name images price seller')
            .populate('customer', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Filter items to only show seller's products (guard against null populated products)
        const productIdSet = new Set(productIds.map(id => id.toString()));
        const filteredOrders = orders
            .map(order => {
                const items = (order.items || []).filter(item => (
                    item.product && productIdSet.has(item.product._id.toString())
                ));
                return { ...order.toObject(), items };
            })
            // Optionally exclude orders that end up with no items for this seller
            .filter(order => Array.isArray(order.items) && order.items.length > 0);

        const totalOrders = await Order.countDocuments(filter);

        res.json({
            success: true,
            orders: filteredOrders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders,
                hasNext: page < Math.ceil(totalOrders / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get seller orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch seller orders',
            error: error.message
        });
    }
};

// Cancel order (customer only, within time limit)
export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({
            _id: orderId,
            customer: userId
        }).populate('items.product');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order can be cancelled
        if (order.status === 'completed' || order.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled'
            });
        }

        // Restore stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product._id,
                { $inc: { quantity: item.quantity } }
            );
        }

        // Update order status
        order.status = 'cancelled';
        await order.save();

        // Notify sellers about order cancellation
        try {
            const sellerIds = new Set();
            for (const item of order.items) {
                if (item.product.seller) {
                    sellerIds.add(item.product.seller.toString());
                }
            }
            
            for (const sellerId of sellerIds) {
                await NotificationService.notifyOrderCancelledByCustomer(sellerId, order);
            }
        } catch (notificationError) {
            console.error('Failed to send notification:', notificationError);
            // Don't fail the cancellation if notification fails
        }

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            order
        });

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order',
            error: error.message
        });
    }
};

// Calculate shipping fee before order placement
export const calculateShipping = async (req, res) => {
    try {
        const userId = req.user._id;
        const { shippingAddress, items } = req.body;

        if (!shippingAddress || !shippingAddress.city || !shippingAddress.province) {
            return res.status(400).json({
                success: false,
                message: 'Shipping address with city and province is required'
            });
        }

        let productIds = [];
        let totalItems = 0;

        if (items && Array.isArray(items)) {
            // Direct checkout or cart items provided
            productIds = items.map(i => i.productId);
            totalItems = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
        } else {
            // Cart checkout - fetch from database
            const cart = await Cart.findOne({ user: userId }).populate('items.product');
            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ success: false, message: 'Cart is empty' });
            }
            productIds = cart.items.map(i => i.product._id);
            totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
        }

        // Get products to check for seller-defined shipping fees
        const products = await Product.find({ _id: { $in: productIds } }).populate('seller');
        
        // Calculate seller-defined shipping fees
        const sellerShippingFees = new Map();
        let totalSellerShippingFee = 0;
        
        for (const product of products) {
            const sellerId = product.seller.toString();
            const productShippingFee = product.shippingFee || 0;
            
            if (!sellerShippingFees.has(sellerId)) {
                sellerShippingFees.set(sellerId, {
                    sellerId: sellerId,
                    shippingFee: productShippingFee,
                    sellerName: product.seller?.firstName + ' ' + product.seller?.lastName || 'Seller'
                });
                totalSellerShippingFee += productShippingFee;
            }
        }
        
        // If seller-defined shipping fees exist, use them
        if (totalSellerShippingFee > 0) {
            res.json({
                success: true,
                shipping: {
                    success: true,
                    shippingFee: totalSellerShippingFee,
                    isEstimated: false,
                    explanation: 'Seller-defined shipping fees',
                    sellerFees: Array.from(sellerShippingFees.values())
                }
            });
            return;
        }
        
        // If no seller-defined shipping fees, use free shipping (0)
        res.json({
            success: true,
            shipping: {
                success: true,
                shippingFee: 0,
                isEstimated: false,
                explanation: 'Free shipping - no seller-defined fees'
            }
        });

    } catch (error) {
        console.error('Calculate shipping error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate shipping',
            error: error.message
        });
    }
};

// Verify receipt data before order creation (pre-order validation)
export const verifyReceiptBeforeOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { paymentMethod, notes, shippingAddress, items } = req.body;

        // Only for GCash payments
        if (paymentMethod !== 'gcash') {
            return res.status(400).json({
                success: false,
                message: 'This endpoint is only for GCash payment verification'
            });
        }

        // Validate shipping address
        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || 
            !shippingAddress.address || !shippingAddress.city || !shippingAddress.province || 
            !shippingAddress.zipCode) {
            return res.status(400).json({
                success: false,
                message: 'Complete shipping address is required'
            });
        }

        let validItems, orderItems, subtotal, totalAmount, firstProductSellerId, productsDocs;

        if (items && Array.isArray(items)) {
            // Direct checkout flow
            if (items.length === 0) {
                return res.status(400).json({ success: false, message: 'Items are required' });
            }

            // Load products and validate stock
            const productIds = items.map(i => i.productId);
            const products = await Product.find({ _id: { $in: productIds } });
            productsDocs = products;
            const idToProduct = new Map(products.map(p => [p._id.toString(), p]));

            orderItems = [];
            for (const i of items) {
                const p = idToProduct.get(String(i.productId));
                if (!p || !p.isAvailable) {
                    return res.status(400).json({ success: false, message: 'Invalid or unavailable product in items' });
                }
                const qty = Math.max(1, parseInt(i.quantity || 1, 10));
                if (p.quantity < qty) {
                    return res.status(400).json({ success: false, message: `Insufficient stock for ${p.name}` });
                }
                orderItems.push({ product: p._id, quantity: qty, price: p.price });
            }

            firstProductSellerId = products[0]?.seller;
        } else {
            // Cart checkout flow
            const cart = await Cart.findOne({ user: userId }).populate('items.product');
            
            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cart is empty' 
                });
            }

            validItems = cart.items.filter(item => item.product && item.product.isAvailable);
            productsDocs = validItems.map(i => i.product).filter(Boolean);
            
            if (validItems.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No valid items in cart' 
                });
            }

            // Check stock availability
            for (const item of validItems) {
                if (item.product.quantity < item.quantity) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Insufficient stock for ${item.product.name}. Available: ${item.product.quantity}, Requested: ${item.quantity}` 
                    });
                }
            }

            orderItems = validItems.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price
            }));

            firstProductSellerId = validItems[0].product.seller;
        }

        subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Calculate shipping fee aligned with calculateShipping endpoint
        let shippingFee = 0;
        try {
            const sellerFeesMap = new Map();
            for (const p of (productsDocs || [])) {
                const sellerId = String(p.seller);
                const productShippingFee = Number(p.shippingFee || 0);
                if (!sellerFeesMap.has(sellerId)) {
                    sellerFeesMap.set(sellerId, productShippingFee);
                }
            }
            const totalSellerShippingFee = Array.from(sellerFeesMap.values()).reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);
            shippingFee = totalSellerShippingFee > 0 ? totalSellerShippingFee : 0; // free shipping if none defined
        } catch (shippingError) {
            console.error('Shipping calculation error in verify-receipt:', shippingError);
            shippingFee = 0; // default to free if error to match UI during verification
        }

        totalAmount = subtotal + shippingFee;

        // Get seller's GCash details
        const sellerApplication = await SellerApplication.findOne({ user: firstProductSellerId });
        
        if (!sellerApplication || !sellerApplication.gcash) {
            return res.status(400).json({
                success: false,
                message: 'Seller GCash details not found'
            });
        }

        // Return order data and seller GCash details for verification
        const orderData = {
            customer: userId,
            items: orderItems,
            paymentMethod,
            subtotal,
            totalAmount,
            shippingAddress,
            notes: notes || ''
        };

        res.json({
            success: true,
            orderData,
            sellerGcashDetails: sellerApplication.gcash,
            message: 'Order validation successful'
        });

    } catch (error) {
        console.error('Verify receipt before order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate order for receipt verification',
            error: error.message
        });
    }
};

// Upload commission receipt (seller pays admin)
export const submitCommissionReceipt = async (req, res) => {
    try {
        const { orderId } = req.body;
        const sellerId = req.user._id;

        // Validate required fields
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Receipt image is required'
            });
        }

        // Find and validate order
        const order = await Order.findById(orderId).populate('items.product');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Verify order belongs to the seller (check if any product in order belongs to seller)
        const sellerProducts = order.items.filter(item => 
            item.product.seller.toString() === sellerId.toString()
        );

        if (sellerProducts.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to upload receipt for this order'
            });
        }

        // Check if order is completed or ready
        if (!['completed', 'ready'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Commission can only be paid for completed or ready orders'
            });
        }

        // Check if order payment is confirmed
        if (order.paymentStatus !== 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Order payment must be confirmed before paying commission'
            });
        }

        // Check if receipt already uploaded for this order
        if (order.commission?.receipt) {
            return res.status(400).json({
                success: false,
                message: 'Commission receipt has already been uploaded for this order'
            });
        }

        // Upload receipt image to Cloudinary
        console.log('Uploading commission receipt image to Cloudinary...');
        const receiptImageUrl = await uploadCommissionReceiptToCloudinary(
            req.file.buffer, 
            `commission_receipt_${orderId}_${Date.now()}`
        );

        // Calculate commission
        const COMMISSION_PER_ITEM = 5;
        const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const commissionAmount = totalQuantity * COMMISSION_PER_ITEM;

        // Update order with commission receipt
        order.commission = {
            ...order.commission,
            receipt: receiptImageUrl,
            receiptStatus: 'uploaded',
            receiptUploadedAt: new Date(),
            amount: commissionAmount
        };

        await order.save();

        // Send notification to admin
        try {
            const admins = await User.find({ role: 'admin' });
            for (const admin of admins) {
                await NotificationService.createNotification({
                    user: admin._id,
                    type: 'commission_receipt_uploaded',
                    title: 'New Commission Receipt',
                    message: `Seller has uploaded commission receipt for order #${order.orderNumber}`,
                    link: `/admin/order-records`,
                    relatedOrder: order._id
                });
            }
        } catch (notificationError) {
            console.error('Failed to send notification to admin:', notificationError);
            // Don't fail the receipt upload if notification fails
        }

        res.status(200).json({
            success: true,
            message: 'Commission receipt uploaded successfully! Admin will review and verify.',
            receipt: {
                receiptUrl: receiptImageUrl,
                status: 'uploaded',
                uploadedAt: order.commission.receiptUploadedAt,
                amount: commissionAmount
            }
        });

    } catch (error) {
        console.error('Upload commission receipt error:', error);
        
        // Handle specific errors
        if (error.message.includes('Only image files are allowed')) {
            return res.status(400).json({
                success: false,
                message: 'Only image files are allowed'
            });
        }
        
        if (error.message.includes('File too large')) {
            return res.status(400).json({
                success: false,
                message: 'File size exceeds 10MB limit'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to process commission receipt upload',
            error: error.message
        });
    }
};
