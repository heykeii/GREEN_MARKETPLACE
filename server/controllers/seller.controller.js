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
  return await cloudinary.uploader.upload_stream({
    folder: 'seller_verification',
    public_id: path.parse(filename).name,
    resource_type: 'auto',
  }, (error, result) => {
    if (error) throw error;
    return result;
  });
}

// Seller Verification Controller
export const submitSellerVerification = async (req, res) => {
  try {
    console.log('Seller verification request received:', {
      body: req.body,
      files: req.files ? Object.keys(req.files) : 'No files'
    });

    const { sellerType, tin, gcashNumber } = req.body;
    const userId = req.user._id;
    const files = req.files;

    // Validate required fields
    if (!sellerType || !tin || !gcashNumber) {
      return res.status(400).json({ 
        message: 'Seller type, TIN, and GCash number are required.' 
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

    if (!files.proofOfAddress || !files.bankProof || !files.gcashQR) {
      return res.status(400).json({ 
        message: 'Proof of address, bank proof, and GCash QR code are required.' 
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
    
    console.log('Uploading bank proof...');
    const bankProof = await uploadFile(files.bankProof[0]);

    console.log('Uploading GCash QR...');
    const gcashQR = await uploadFile(files.gcashQR[0]);

    // Business-specific documents
    let dtiRegistration, businessPermit, birRegistration;
    if (sellerType === 'business') {
      if (!files.dtiRegistration || !files.businessPermit || !files.birRegistration) {
        return res.status(400).json({ 
          message: 'Business documents (DTI Registration, Business Permit, BIR Registration) are required for business sellers.' 
        });
      }
      
      console.log('Uploading business documents...');
      dtiRegistration = await uploadFile(files.dtiRegistration[0]);
      businessPermit = await uploadFile(files.businessPermit[0]);
      birRegistration = await uploadFile(files.birRegistration[0]);
    }

    // Prepare documents object
    const documents = {
      govIDs,
      tin,
      proofOfAddress,
      bankProof,
      ...(sellerType === 'business' && {
        dtiRegistration,
        businessPermit,
        birRegistration,
      })
    };

    console.log('Saving seller application...');
    
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
    } else if (action === 'rejected') {
      await User.findByIdAndUpdate(application.user, {
        isSeller: false,
        sellerStatus: 'rejected'
      });
    }

    res.status(200).json({ message: `Seller application ${action}.`, application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to review seller application.', error: error.message });
  }
};

export const getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { timeframe = '30d' } = req.query;

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

    // Get seller's products
    const products = await Product.find({ seller: sellerId });
    console.log('Found products:', products.length);
    
    const productIds = products.map(p => p._id);

    // Get orders for seller's products (current period)
    let currentOrders = [];
    let previousOrders = [];
    
    if (productIds.length > 0) {
      try {
        // Current period orders
        currentOrders = await Order.find({
          'items.product': { $in: productIds },
          createdAt: { $gte: startDate }
        }).populate('items.product customer');

        // Previous period orders for growth calculation
        previousOrders = await Order.find({
          'items.product': { $in: productIds },
          createdAt: { $gte: previousStartDate, $lt: startDate }
        }).populate('items.product customer');

        console.log('Found current orders:', currentOrders.length);
        console.log('Found previous orders:', previousOrders.length);
      } catch (orderError) {
        console.error('Error fetching orders:', orderError);
      }
    }

    // Get all orders for lifetime metrics
    let allOrders = [];
    if (productIds.length > 0) {
      try {
        allOrders = await Order.find({
          'items.product': { $in: productIds }
        }).populate('items.product customer');
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
      order.items.forEach(item => {
        if (productIds.some(id => id.toString() === item.product._id.toString())) {
          const itemRevenue = item.price * item.quantity;
          currentRevenue += itemRevenue;
          totalOrderValue += itemRevenue;
          
          const customerId = order.customer._id.toString();
          customerSet.add(customerId);
          
          if (!customerOrders[customerId]) {
            customerOrders[customerId] = [];
          }
          customerOrders[customerId].push(order._id.toString());
        }
      });
    });

    // Calculate previous period revenue for growth
    let previousRevenue = 0;
    previousOrders.forEach(order => {
      order.items.forEach(item => {
        if (productIds.some(id => id.toString() === item.product._id.toString())) {
          previousRevenue += item.price * item.quantity;
        }
      });
    });

    // Calculate growth percentage
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100) 
      : currentRevenue > 0 ? 100 : 0;

    // Calculate order growth
    const orderGrowth = previousOrders.length > 0
      ? ((currentOrders.length - previousOrders.length) / previousOrders.length * 100)
      : currentOrders.length > 0 ? 100 : 0;

    // Calculate repeat customers
    const repeatCustomers = Object.values(customerOrders).filter(orders => orders.length > 1).length;

    // Calculate inventory metrics
    const lowStockItems = products.filter(p => p.quantity < 10 && p.quantity > 0).length;
    const outOfStockItems = products.filter(p => p.quantity === 0).length;
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

    // Calculate inventory turnover (simplified)
    const averageInventoryValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0) / Math.max(products.length, 1);
    const inventoryTurnover = averageInventoryValue > 0 ? (currentRevenue / averageInventoryValue) : 0;

    // Calculate conversion rate (mock for now - would need view/visit tracking)
    const conversionRate = currentOrders.length > 0 ? Math.min((currentOrders.length / Math.max(products.length * 10, 1)) * 100, 15) : 0;

    // Generate top products based on revenue
    const productRevenue = {};
    const productSales = {};
    
    allOrders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product._id.toString();
        if (productIds.some(id => id.toString() === productId)) {
          if (!productRevenue[productId]) {
            productRevenue[productId] = {
              revenue: 0,
              quantity: 0,
              orders: 0,
              product: item.product
            };
          }
          productRevenue[productId].revenue += item.price * item.quantity;
          productRevenue[productId].quantity += item.quantity;
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
      order.items.forEach(item => {
        const product = products.find(p => p._id.toString() === item.product._id.toString());
        if (product) {
          categoryStats[product.category].revenue += item.price * item.quantity;
          categoryStats[product.category].orders++;
          categoryStats[product.category].quantity += item.quantity;
        }
      });
    });

    const categoryPerformance = Object.entries(categoryStats).map(([category, data]) => ({
      category,
      revenue: data.revenue,
      products: data.products,
      orders: data.orders,
      averagePrice: data.revenue / Math.max(data.quantity, 1),
      growth: Math.round((Math.random() * 20 - 5) * 10) / 10 // Mock growth - would need historical data
    })).sort((a, b) => b.revenue - a.revenue);

    // Generate realistic sales data based on actual orders
    const generateSalesData = (type) => {
      const data = [];
      const periods = type === 'daily' ? 30 : type === 'weekly' ? 12 : 6;
      const periodMs = type === 'daily' ? 24 * 60 * 60 * 1000 : type === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
      
      for (let i = 0; i < periods; i++) {
        const periodStart = new Date(now.getTime() - (periods - i) * periodMs);
        const periodEnd = new Date(now.getTime() - (periods - i - 1) * periodMs);
        
        let periodRevenue = 0;
        let periodOrders = 0;
        
        currentOrders.forEach(order => {
          const orderDate = new Date(order.createdAt);
          if (orderDate >= periodStart && orderDate < periodEnd) {
            order.items.forEach(item => {
              if (productIds.some(id => id.toString() === item.product._id.toString())) {
                periodRevenue += item.price * item.quantity;
                periodOrders++;
              }
            });
          }
        });
        
        data.push({
          date: periodStart.toISOString().split('T')[0],
          revenue: periodRevenue,
          orders: periodOrders
        });
      }
      
      return data;
    };

    // Compile final analytics
    const analytics = {
      overview: {
        totalRevenue: Math.round(currentRevenue * 100) / 100,
        totalOrders: currentOrders.length,
        totalProducts: products.length,
        averageRating: reviewStats.averageRating,
        monthlyGrowth: Math.round(revenueGrowth * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10
      },
      salesData: {
        daily: generateSalesData('daily'),
        weekly: generateSalesData('weekly'),
        monthly: generateSalesData('monthly')
      },
      topProducts,
      categoryPerformance,
      customerInsights: {
        totalCustomers: customerSet.size,
        repeatCustomers: repeatCustomers,
        averageOrderValue: Math.round((currentOrders.length > 0 ? totalOrderValue / currentOrders.length : 0) * 100) / 100,
        customerSatisfaction: reviewStats.customerSatisfaction
      },
      inventoryMetrics: {
        lowStockItems,
        outOfStockItems,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        inventoryTurnover: Math.round(inventoryTurnover * 100) / 100
      }
    };

    console.log('Analytics calculated successfully');
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch analytics', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
