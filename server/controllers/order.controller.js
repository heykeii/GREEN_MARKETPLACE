import Order from '../models/orders.model.js';
import Cart from '../models/cart.model.js';
import Product from '../models/products.model.js';
import SellerApplication from '../models/seller.model.js';
import PaymentReceipt from '../models/paymentReceipt.model.js';
import { NotificationService } from '../utils/notificationService.js';
import { BadgeService } from '../utils/badgeService.js';

// Create a new order from cart
export const createOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { paymentMethod, notes, shippingAddress } = req.body;

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

        // Filter out invalid items and calculate totals
        const validItems = cart.items.filter(item => item.product && item.product.isAvailable);
        
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

        // Calculate totals
        const orderItems = validItems.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            price: item.product.price
        }));

        const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalAmount = subtotal; // Add shipping, taxes later if needed

        // Create order
        const order = new Order({
            customer: userId,
            items: orderItems,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : (req.body.verifiedReceiptData ? 'paid' : 'pending'),
            subtotal,
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

        // Clear user's cart
        await Cart.findOneAndUpdate(
            { user: userId },
            { $set: { items: [] } }
        );

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
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
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
            orderItems.push({ product: p._id, quantity: qty, price: p.price });
        }

        const subtotal = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
        const totalAmount = subtotal;

        const order = new Order({
            customer: userId,
            items: orderItems,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : (req.body.verifiedReceiptData ? 'paid' : 'pending'),
            subtotal,
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
        const { status } = req.body;
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

        // Update the order status
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        ).populate('items.product', 'name images price')
        .populate('customer', 'firstName lastName email');

        // Notify customer about status change
        try {
            await NotificationService.notifyOrderStatusUpdate(
                order.customer._id,
                order,
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

        // Filter items to only show seller's products
        const filteredOrders = orders.map(order => ({
            ...order.toObject(),
            items: order.items.filter(item => 
                productIds.some(id => id.toString() === item.product._id.toString())
            )
        }));

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

        let validItems, orderItems, subtotal, totalAmount, firstProductSellerId;

        if (items && Array.isArray(items)) {
            // Direct checkout flow
            if (items.length === 0) {
                return res.status(400).json({ success: false, message: 'Items are required' });
            }

            // Load products and validate stock
            const productIds = items.map(i => i.productId);
            const products = await Product.find({ _id: { $in: productIds } });
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
        totalAmount = subtotal;

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
