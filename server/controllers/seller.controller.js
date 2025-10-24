import SellerApplication from '../models/seller.model.js';
import User from '../models/user.model.js';
import cloudinary from '../utils/cloudinary.js';
import multer from 'multer';
import path from 'path';
import Product from '../models/products.model.js';
import Order from '../models/orders.model.js';
import Review from '../models/reviews.model.js';

// Multer setup (memory storage for direct upload to Cloudinary)
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Helper to upload a file buffer to Cloudinary
async function uploadToCloudinary(fileBuffer, filename) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({
      folder: 'seller_verification',
      public_id: path.parse(filename).name,
      resource_type: 'auto',
    }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }).end(fileBuffer);
  });
}

// Seller Verification Controller
export const submitSellerVerification = async (req, res) => {
  try {
    console.log('Seller verification request received:', {
      body: req.body,
      files: req.files ? Object.keys(req.files) : 'No files'
    });

    const { sellerType, gcashNumber } = req.body;
    const userId = req.user._id;
    const files = req.files;

    // Validate required fields
    if (!sellerType || !gcashNumber) {
      return res.status(400).json({ 
        message: 'Seller type and GCash number are required.' 
      });
    }

    // Validate GCash number format (must be +639XXXXXXXXX)
    if (!/^\+639\d{9}$/.test(gcashNumber)) {
      return res.status(400).json({
        message: 'Invalid GCash number format. Use +639XXXXXXXXX (e.g., +639123456789).'
      });
    }

    if (!['individual', 'business'].includes(sellerType)) {
      return res.status(400).json({ 
        message: 'Seller type must be either "individual" or "business".' 
      });
    }

    // Validate required files
    if (!files || !files.govIDs || files.govIDs.length < 2) {
      return res.status(400).json({ 
        message: 'Two government IDs are required.' 
      });
    }

    if (!files.proofOfAddress || !files.gcashQR) {
      return res.status(400).json({ 
        message: 'Proof of address and GCash QR code are required.' 
      });
    }

    // Helper function to upload file to Cloudinary
    const uploadFile = async (file) => {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({
            folder: 'seller_verification',
            resource_type: 'auto',
          }, (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve(result);
            }
          }).end(file.buffer);
        });
        return result.secure_url;
      } catch (error) {
        console.error('File upload failed:', error);
        throw new Error(`Failed to upload ${file.originalname}: ${error.message}`);
      }
    };

    // Upload required documents
    console.log('Uploading government IDs...');
    const govIDs = await Promise.all(files.govIDs.map(uploadFile));
    
    console.log('Uploading proof of address...');
    const proofOfAddress = await uploadFile(files.proofOfAddress[0]);

    console.log('Uploading GCash QR...');
    const gcashQR = await uploadFile(files.gcashQR[0]);

    // Business-specific documents
    let businessPermit, birRegistration;
    if (sellerType === 'business') {
      if (!files.businessPermit || !files.birRegistration) {
        return res.status(400).json({ 
          message: 'Business documents (Business Permit, BIR Registration) are required for business sellers.' 
        });
      }
      
      console.log('Uploading business documents...');
      businessPermit = await uploadFile(files.businessPermit[0]);
      birRegistration = await uploadFile(files.birRegistration[0]);
    }

    // Prepare documents object
    const documents = {
      govIDs,
      proofOfAddress,
      ...(sellerType === 'business' && {
        businessPermit,
        birRegistration,
      })
    };

    console.log('Saving seller application...');
    
    // Extract business info from request body
    const { businessName, businessAddress } = req.body;

    // Validate business info if seller type is business
    if (sellerType === 'business') {
      if (!businessName) {
        return res.status(400).json({ message: 'Business name is required for business sellers.' });
      }
      if (!businessAddress || !businessAddress.street || !businessAddress.city || !businessAddress.province || !businessAddress.zipCode) {
        return res.status(400).json({ message: 'Complete business address is required for business sellers.' });
      }
    }

    // Save application
    const application = await SellerApplication.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        sellerType,
        documents,
        gcash: {
          number: gcashNumber,
          qrCode: gcashQR
        },
        status: 'pending',
        ...(sellerType === 'business' && {
          businessInfo: {
            businessName,
            businessAddress
          }
        })
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('Updating user seller status...');
    
    // Set user sellerStatus to pending
    await User.findByIdAndUpdate(userId, { sellerStatus: 'pending' });

    console.log('Seller verification submitted successfully');

    res.status(201).json({ 
      message: 'Seller verification submitted successfully.', 
      application 
    });
  } catch (error) {
    console.error('Seller verification error:', error);
    res.status(500).json({ 
      message: 'Failed to submit seller verification.', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get GCash details for the authenticated seller
export const getMyGcashDetails = async (req, res) => {
  try {
    const application = await SellerApplication.findOne({ user: req.user._id });
    return res.json({ success: true, gcash: application?.gcash || null });
  } catch (error) {
    console.error('getMyGcashDetails error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch GCash details' });
  }
};

// Get GCash details by seller (user) id - for buyers viewing during checkout
export const getSellerGcashDetails = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const application = await SellerApplication.findOne({ user: sellerId });
    return res.json({ success: true, gcash: application?.gcash || null });
  } catch (error) {
    console.error('getSellerGcashDetails error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch GCash details' });
  }
};

// Update GCash details for authenticated seller
export const updateGcashDetails = async (req, res) => {
  try {
    const { gcashNumber } = req.body;

    if (gcashNumber && !/^\+639\d{9}$/.test(gcashNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid GCash number format. Use +639XXXXXXXXX (e.g., +639123456789).' });
    }

    let qrUrl;
    // Accept either upload.single('gcashQR') or upload.fields
    const file = (req.file && req.file.fieldname === 'gcashQR') ? req.file : (req.files && (req.files.gcashQR?.[0]));
    if (file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'seller_verification', resource_type: 'image' }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }).end(file.buffer);
      });
      qrUrl = result.secure_url;
    }

    const update = {};
    if (gcashNumber) update['gcash.number'] = gcashNumber;
    if (qrUrl) update['gcash.qrCode'] = qrUrl;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: 'Provide at least one of GCash number or QR image.' });
    }

    const application = await SellerApplication.findOneAndUpdate(
      { user: req.user._id },
      { $set: update },
      { new: true, upsert: true }
    );

    return res.json({ success: true, gcash: application.gcash });
  } catch (error) {
    console.error('updateGcashDetails error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update GCash details' });
  }
};

// Admin: Approve or Reject Seller Application
export const reviewSellerApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { action, message } = req.body; // action: 'approved' or 'rejected'
    const adminId = req.user._id;

    const application = await SellerApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Seller application not found.' });
    }

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action.' });
    }

    application.status = action;
    application.message = message || '';
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();
    await application.save();

    // Update user seller status
    if (action === 'approved') {
      await User.findByIdAndUpdate(application.user, {
        isSeller: true,
        sellerStatus: 'verified'
      });
      try {
        const { NotificationService } = await import('../utils/notificationService.js');
        await NotificationService.notifySellerApplicationApproved(application.user, application);
      } catch (_) {}
    } else if (action === 'rejected') {
      await User.findByIdAndUpdate(application.user, {
        isSeller: false,
        sellerStatus: 'rejected'
      });
      try {
        const { NotificationService } = await import('../utils/notificationService.js');
        await NotificationService.notifySellerApplicationRejected(application.user, application, message || '');
      } catch (_) {}
    }

    res.status(200).json({ message: `Seller application ${action}.`, application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to review seller application.', error: error.message });
  }
};

export const getSellerAnalytics = async (req, res) => {
  try {
    console.log('=== ANALYTICS REQUEST START ===');
    console.log('Request user:', req.user);
    console.log('Request query:', req.query);
    
    const sellerId = req.user._id;
    const { timeframe = '30d' } = req.query;

    // Validate timeframe parameter
    const validTimeframes = ['7d', '30d', '90d', '1y'];
    if (!validTimeframes.includes(timeframe)) {
      console.log('Invalid timeframe:', timeframe);
      return res.status(400).json({
        success: false,
        message: 'Invalid timeframe. Must be one of: 7d, 30d, 90d, 1y'
      });
    }

    console.log('Fetching analytics for seller:', sellerId);
    console.log('User details:', {
      id: req.user._id,
      email: req.user.email,
      isSeller: req.user.isSeller,
      sellerStatus: req.user.sellerStatus
    });

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate, previousStartDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    }

    // Get seller's products (only approved and available for accurate inventory metrics)
    console.log('Fetching products for seller:', sellerId);
    const products = await Product.find({ seller: sellerId, status: 'approved', isAvailable: true });
    console.log('Found products:', products.length);
    
    const productIds = products.map(p => p._id);

    // Get orders for seller's products (current period)
    let currentOrders = [];
    let previousOrders = [];
    
    if (productIds.length > 0) {
      try {
        console.log('Fetching current period orders...');
        // Current period orders - include completed/ready orders with paid status
        // Note: 'ready' status means order is ready for pickup/delivery (should count as revenue)
        // 'completed' status means order is fully delivered and completed
        currentOrders = await Order.find({
          'items.product': { $in: productIds },
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'ready'] },
          paymentStatus: 'paid'
        }).populate('items.product customer');

        console.log('Fetching previous period orders...');
        // Previous period orders for growth calculation
        previousOrders = await Order.find({
          'items.product': { $in: productIds },
          createdAt: { $gte: previousStartDate, $lt: startDate },
          status: { $in: ['completed', 'ready'] },
          paymentStatus: 'paid'
        }).populate('items.product customer');

        console.log('Found current orders:', currentOrders.length);
        console.log('Found previous orders:', previousOrders.length);
        console.log('Current orders details:', currentOrders.map(o => ({
          id: o._id,
          status: o.status,
          paymentStatus: o.paymentStatus,
          totalAmount: o.totalAmount
        })));
      } catch (orderError) {
        console.error('Error fetching orders:', orderError);
        console.error('Order error details:', {
          message: orderError.message,
          name: orderError.name,
          stack: orderError.stack
        });
        // Continue with empty orders arrays
        currentOrders = [];
        previousOrders = [];
      }
    }

    // Get all orders for lifetime metrics - only completed/ready/paid orders
    let allOrders = [];
    if (productIds.length > 0) {
      try {
        allOrders = await Order.find({
          'items.product': { $in: productIds },
          status: { $in: ['completed', 'ready'] },
          paymentStatus: 'paid'
        }).populate('items.product customer');
        console.log('Found all orders (lifetime):', allOrders.length);
      } catch (error) {
        console.error('Error fetching all orders:', error);
      }
    }

    // Get review statistics for seller's products
    let reviewStats = { averageRating: 0, totalReviews: 0, customerSatisfaction: 0 };
    if (productIds.length > 0) {
      try {
        const reviewAggregation = await Review.aggregate([
          { $match: { product: { $in: productIds }, isVisible: true } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 }
            }
          }
        ]);
        
        if (reviewAggregation.length > 0) {
          reviewStats = {
            averageRating: Math.round(reviewAggregation[0].averageRating * 10) / 10,
            totalReviews: reviewAggregation[0].totalReviews,
            customerSatisfaction: Math.round(reviewAggregation[0].averageRating * 10) / 10
          };
        }
      } catch (reviewError) {
        console.error('Error fetching review stats:', reviewError);
      }
    }

    // Calculate current period metrics
    let currentRevenue = 0;
    let totalOrderValue = 0;
    const customerSet = new Set();
    const customerOrders = {};

    // Process current orders
    currentOrders.forEach(order => {
      if (!order || !order.items) return;
      order.items.forEach(item => {
        // Guard against missing populated refs
        const itemProductId = item?.product?._id || item?.product;
        if (!itemProductId) return;
        if (productIds.some(id => id.toString() === itemProductId.toString())) {
          const price = Number(item?.price) || 0;
          const qty = Number(item?.quantity) || 0;
          const itemRevenue = price * qty;
          currentRevenue += itemRevenue;
          totalOrderValue += itemRevenue;
          
          const customerId = (order?.customer?._id || order?.customer)?.toString?.();
          if (customerId) {
            customerSet.add(customerId);
            if (!customerOrders[customerId]) {
              customerOrders[customerId] = [];
            }
            customerOrders[customerId].push(order._id.toString());
          }
        }
      });
    });

    // Calculate previous period revenue for growth
    let previousRevenue = 0;
    previousOrders.forEach(order => {
      if (!order || !order.items) return;
      order.items.forEach(item => {
        const itemProductId = item?.product?._id || item?.product;
        if (!itemProductId) return;
        if (productIds.some(id => id.toString() === itemProductId.toString())) {
          const price = Number(item?.price) || 0;
          const qty = Number(item?.quantity) || 0;
          previousRevenue += price * qty;
        }
      });
    });

    // Calculate growth percentage with proper handling of edge cases
    let revenueGrowth = 0;
    if (previousRevenue > 0) {
      revenueGrowth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    } else if (currentRevenue > 0) {
      revenueGrowth = 100; // 100% growth when starting from 0
    }

    // Calculate order growth with proper handling
    let orderGrowth = 0;
    if (previousOrders.length > 0) {
      orderGrowth = ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100;
    } else if (currentOrders.length > 0) {
      orderGrowth = 100; // 100% growth when starting from 0
    }

    // Calculate repeat customers
    const repeatCustomers = Object.values(customerOrders).filter(orders => orders.length > 1).length;

    // Calculate top 5 frequent buyers
    let topFrequentBuyers = [];
    if (Object.keys(customerOrders).length > 0) {
      // Find customers with most orders
      const customerOrderCounts = Object.entries(customerOrders).map(([customerId, orders]) => ({
        customerId,
        orderCount: orders.length,
        orderIds: orders
      }));
      
      // Sort by order count and get top 5
      const topCustomers = customerOrderCounts.sort((a, b) => b.orderCount - a.orderCount).slice(0, 5);
      
      // Get customer details and calculate metrics for each
      for (const topCustomer of topCustomers) {
        const customer = await User.findById(topCustomer.customerId).select('firstName lastName avatar email');
        if (customer) {
          // Calculate total quantities purchased by this customer
          let totalQuantities = 0;
          let totalSpent = 0;
          
          allOrders.forEach(order => {
            const orderCustomerId = (order?.customer?._id || order?.customer)?.toString?.();
            if (!orderCustomerId) return;
            if (orderCustomerId === topCustomer.customerId) {
              if (!order?.items) return;
              order.items.forEach(item => {
                const itemProductId = item?.product?._id || item?.product;
                if (!itemProductId) return;
                if (productIds.some(id => id.toString() === itemProductId.toString())) {
                  const qty = Number(item?.quantity) || 0;
                  const price = Number(item?.price) || 0;
                  totalQuantities += qty;
                  totalSpent += price * qty;
                }
              });
            }
          });
          
          topFrequentBuyers.push({
            customer: {
              _id: customer._id,
              firstName: customer.firstName,
              lastName: customer.lastName,
              avatar: customer.avatar,
              email: customer.email
            },
            orderCount: topCustomer.orderCount,
            totalQuantities,
            totalSpent: Math.round(totalSpent * 100) / 100
          });
        }
      }
    }

    // Calculate inventory metrics
    const lowStockItems = products.filter(p => Number(p.quantity) < 10 && Number(p.quantity) > 0).length;
    const outOfStockItems = products.filter(p => Number(p.quantity) === 0).length;
    const totalInventoryValue = products.reduce((sum, p) => {
      const price = Number(p.price) || 0;
      const qty = Math.max(Number(p.quantity) || 0, 0);
      if (price <= 0 || qty <= 0) return sum;
      return sum + (price * qty);
    }, 0);

    // Calculate inventory turnover (annualized)
    let inventoryTurnover = 0;
    if (totalInventoryValue > 0) {
      // Annualize the turnover based on the timeframe
      const timeframeDays = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
      const annualizedRevenue = (currentRevenue / timeframeDays) * 365;
      inventoryTurnover = annualizedRevenue / totalInventoryValue;
    }

    // Calculate conversion rate based on actual order data
    // Use a more realistic approach: orders per product per period
    let conversionRate = 0;
    if (products.length > 0) {
      const ordersPerProduct = currentOrders.length / products.length;
      // Convert to percentage (assuming 1 order per product per period is 100% conversion)
      conversionRate = Math.min(ordersPerProduct * 100, 100);
    }

    // Generate top products based on revenue
    const productRevenue = {};
    const productSales = {};
    
    allOrders.forEach(order => {
      if (!order?.items) return;
      order.items.forEach(item => {
        const productId = (item?.product?._id || item?.product)?.toString?.();
        if (!productId) return;
        if (productIds.some(id => id.toString() === productId)) {
          if (!productRevenue[productId]) {
            productRevenue[productId] = {
              revenue: 0,
              quantity: 0,
              orders: 0,
              product: item.product
            };
          }
          const price = Number(item?.price) || 0;
          const qty = Number(item?.quantity) || 0;
          productRevenue[productId].revenue += price * qty;
          productRevenue[productId].quantity += qty;
          productRevenue[productId].orders++;
        }
      });
    });

    // Get ratings for top products
    const productRatings = {};
    if (productIds.length > 0) {
      try {
        const productReviews = await Review.aggregate([
          { $match: { product: { $in: productIds }, isVisible: true } },
          {
            $group: {
              _id: '$product',
              averageRating: { $avg: '$rating' },
              reviewCount: { $sum: 1 }
            }
          }
        ]);
        
        productReviews.forEach(review => {
          productRatings[review._id.toString()] = {
            rating: Math.round(review.averageRating * 10) / 10,
            reviewCount: review.reviewCount
          };
        });
      } catch (error) {
        console.error('Error fetching product ratings:', error);
      }
    }

    const topProducts = Object.values(productRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(item => ({
        id: item.product._id,
        name: item.product.name,
        revenue: item.revenue,
        quantity: item.quantity,
        orders: item.orders,
        rating: productRatings[item.product._id.toString()]?.rating || 0,
        reviews: productRatings[item.product._id.toString()]?.reviewCount || 0
      }));

    // Generate category performance
    const categoryStats = {};
    
    products.forEach(product => {
      if (!categoryStats[product.category]) {
        categoryStats[product.category] = {
          revenue: 0,
          products: 1,
          orders: 0,
          quantity: 0
        };
      } else {
        categoryStats[product.category].products++;
      }
    });

    // Add sales data to categories
    allOrders.forEach(order => {
      if (!order?.items) return;
      order.items.forEach(item => {
        const itemProductId = item?.product?._id || item?.product;
        if (!itemProductId) return;
        const product = products.find(p => p._id.toString() === itemProductId.toString());
        if (product) {
          const price = Number(item?.price) || 0;
          const qty = Number(item?.quantity) || 0;
          categoryStats[product.category].revenue += price * qty;
          categoryStats[product.category].orders++;
          categoryStats[product.category].quantity += qty;
        }
      });
    });

    // Calculate real growth for categories by comparing current vs previous period
    const previousCategoryStats = {};
    previousOrders.forEach(order => {
      if (!order?.items) return;
      order.items.forEach(item => {
        const itemProductId = item?.product?._id || item?.product;
        if (!itemProductId) return;
        const product = products.find(p => p._id.toString() === itemProductId.toString());
        if (product) {
          if (!previousCategoryStats[product.category]) {
            previousCategoryStats[product.category] = { revenue: 0 };
          }
          const price = Number(item?.price) || 0;
          const qty = Number(item?.quantity) || 0;
          previousCategoryStats[product.category].revenue += price * qty;
        }
      });
    });

    const categoryPerformance = Object.entries(categoryStats).map(([category, data]) => {
      const previousRevenue = previousCategoryStats[category]?.revenue || 0;
      const growth = previousRevenue > 0 
        ? ((data.revenue - previousRevenue) / previousRevenue * 100)
        : data.revenue > 0 ? 100 : 0;
      
      return {
        category,
        revenue: data.revenue,
        products: data.products,
        orders: data.orders,
        averagePrice: data.revenue / Math.max(data.quantity, 1),
        growth: Math.round(growth * 10) / 10
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Generate realistic sales data based on actual orders
    const generateSalesData = (type) => {
      const data = [];
      let periods, periodMs, ordersToCheck;
      
      if (type === 'daily') {
        periods = 30;
        periodMs = 24 * 60 * 60 * 1000;
        ordersToCheck = allOrders; // Use all orders for daily data
      } else if (type === 'weekly') {
        periods = 12;
        periodMs = 7 * 24 * 60 * 60 * 1000;
        ordersToCheck = allOrders; // Use all orders for weekly data
      } else if (type === 'monthly') {
        periods = 6;
        periodMs = 30 * 24 * 60 * 60 * 1000;
        ordersToCheck = allOrders; // Use all orders for monthly data
      } else if (type === 'yearly') {
        periods = 12; // Last 12 months
        ordersToCheck = allOrders; // Use all orders for yearly data
        
        // Generate proper month-based periods for yearly data
        for (let i = 0; i < periods; i++) {
          const currentDate = new Date(now);
          const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - (periods - i - 1), 1);
          const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - (periods - i - 2), 1);
          
          let periodRevenue = 0;
          let periodOrders = 0;
          
          ordersToCheck.forEach(order => {
            const orderDate = new Date(order?.createdAt);
            if (orderDate >= periodStart && orderDate < periodEnd) {
              if (!order?.items) return;
              order.items.forEach(item => {
                const itemProductId = item?.product?._id || item?.product;
                if (!itemProductId) return;
                if (productIds.some(id => id.toString() === itemProductId.toString())) {
                  const price = Number(item?.price) || 0;
                  const qty = Number(item?.quantity) || 0;
                  periodRevenue += price * qty;
                  periodOrders++;
                }
              });
            }
          });
          
          const dateLabel = periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          
          data.push({
            date: dateLabel,
            revenue: Math.round(periodRevenue * 100) / 100,
            orders: periodOrders
          });
        }
        
        return data; // Return early for yearly data
      }
      
      // Handle other chart types (daily, weekly, monthly)
      for (let i = 0; i < periods; i++) {
        const periodStart = new Date(now.getTime() - (periods - i) * periodMs);
        const periodEnd = new Date(now.getTime() - (periods - i - 1) * periodMs);
        
        let periodRevenue = 0;
        let periodOrders = 0;
        
        ordersToCheck.forEach(order => {
        const orderDate = new Date(order?.createdAt);
          if (orderDate >= periodStart && orderDate < periodEnd) {
          if (!order?.items) return;
          order.items.forEach(item => {
            const itemProductId = item?.product?._id || item?.product;
            if (!itemProductId) return;
            if (productIds.some(id => id.toString() === itemProductId.toString())) {
              const price = Number(item?.price) || 0;
              const qty = Number(item?.quantity) || 0;
              periodRevenue += price * qty;
              periodOrders++;
            }
          });
          }
        });
        
        const dateLabel = periodStart.toISOString().split('T')[0];
        
        data.push({
          date: dateLabel,
          revenue: Math.round(periodRevenue * 100) / 100,
          orders: periodOrders
        });
      }
      
      return data;
    };

    // Compile final analytics with proper validation
    const analytics = {
      overview: {
        totalRevenue: Math.round(currentRevenue * 100) / 100,
        totalOrders: currentOrders.length,
        totalProducts: products.length,
        averageRating: Math.round(reviewStats.averageRating * 10) / 10,
        monthlyGrowth: Math.round(revenueGrowth * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10
      },
      salesData: {
        daily: generateSalesData('daily'),
        weekly: generateSalesData('weekly'),
        monthly: generateSalesData('monthly'),
        yearly: generateSalesData('yearly')
      },
      topProducts,
      categoryPerformance,
      customerInsights: {
        totalCustomers: customerSet.size,
        repeatCustomers: repeatCustomers,
        averageOrderValue: Math.round((currentOrders.length > 0 ? totalOrderValue / currentOrders.length : 0) * 100) / 100,
        customerSatisfaction: Math.round(reviewStats.customerSatisfaction * 10) / 10,
        topFrequentBuyers
      },
      inventoryMetrics: {
        lowStockItems,
        outOfStockItems,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        inventoryTurnover: Math.round(inventoryTurnover * 100) / 100
      },
      // Add metadata for debugging
      metadata: {
        timeframe,
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString()
        },
        calculatedAt: new Date().toISOString()
      }
    };

    // Validate analytics data before sending
    if (analytics.overview.totalRevenue < 0) {
      console.warn('Warning: Negative revenue detected, setting to 0');
      analytics.overview.totalRevenue = 0;
    }
    
    if (analytics.overview.averageRating < 0 || analytics.overview.averageRating > 5) {
      console.warn('Warning: Invalid average rating detected, setting to 0');
      analytics.overview.averageRating = 0;
    }

    console.log('Analytics calculated successfully');
    console.log('Analytics summary:', {
      revenue: analytics.overview.totalRevenue,
      orders: analytics.overview.totalOrders,
      products: analytics.overview.totalProducts,
      growth: analytics.overview.monthlyGrowth
    });
    
    console.log('=== ANALYTICS REQUEST SUCCESS ===');
    res.json(analytics);
  } catch (error) {
    console.error('=== ANALYTICS ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    console.error('Request user:', req.user);
    console.error('Request query:', req.query);
    console.error('=== END ANALYTICS ERROR ===');
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch analytics', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
