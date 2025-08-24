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

    const { sellerType, tin } = req.body;
    const userId = req.user._id;
    const files = req.files;

    // Validate required fields
    if (!sellerType || !tin) {
      return res.status(400).json({ 
        message: 'Seller type and TIN are required.' 
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

    if (!files.proofOfAddress || !files.bankProof) {
      return res.status(400).json({ 
        message: 'Proof of address and bank proof are required.' 
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

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get seller's products
    const products = await Product.find({ seller: sellerId });
    console.log('Found products:', products.length);
    
    const productIds = products.map(p => p._id);

    // Get orders for seller's products (if any exist)
    let orders = [];
    if (productIds.length > 0) {
      try {
        orders = await Order.find({
          'items.product': { $in: productIds },
          createdAt: { $gte: startDate }
        }).populate('items.product customer');
        console.log('Found orders:', orders.length);
      } catch (orderError) {
        console.error('Error fetching orders:', orderError);
        // Continue with empty orders array
      }
    }

    // Get review statistics for seller's products
    let reviewStats = { averageRating: 0, totalReviews: 0 };
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
            totalReviews: reviewAggregation[0].totalReviews
          };
        }
      } catch (reviewError) {
        console.error('Error fetching review stats:', reviewError);
      }
    }

    // Calculate analytics
    const analytics = {
      overview: {
        totalRevenue: 0,
        totalOrders: orders.length,
        totalProducts: products.length,
        averageRating: reviewStats.averageRating,
        monthlyGrowth: 12.5, // Mock growth
        conversionRate: 3.2 // Mock conversion rate
      },
      salesData: {
        daily: [],
        weekly: [],
        monthly: []
      },
      topProducts: [],
      categoryPerformance: [],
      customerInsights: {
        totalCustomers: 0,
        repeatCustomers: 0,
        averageOrderValue: 0,
        customerSatisfaction: 4.2 // Mock satisfaction
      },
      inventoryMetrics: {
        lowStockItems: 0,
        outOfStockItems: 0,
        totalInventoryValue: 0,
        inventoryTurnover: 2.1 // Mock turnover
      }
    };

    // Calculate revenue and other metrics
    let totalRevenue = 0;
    const customerSet = new Set();
    const repeatCustomers = new Set();
    const customerOrderCounts = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        if (productIds.includes(item.product._id.toString())) {
          totalRevenue += item.price * item.quantity;
          customerSet.add(order.customer._id.toString());
          
          if (customerOrderCounts[order.customer._id.toString()]) {
            customerOrderCounts[order.customer._id.toString()]++;
            repeatCustomers.add(order.customer._id.toString());
          } else {
            customerOrderCounts[order.customer._id.toString()] = 1;
          }
        }
      });
    });

    analytics.overview.totalRevenue = totalRevenue;
    analytics.overview.averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    analytics.customerInsights.totalCustomers = customerSet.size;
    analytics.customerInsights.repeatCustomers = repeatCustomers.size;
    analytics.customerInsights.averageOrderValue = analytics.overview.averageOrderValue;

    // Calculate inventory metrics
    analytics.inventoryMetrics.lowStockItems = products.filter(p => p.quantity < 10 && p.quantity > 0).length;
    analytics.inventoryMetrics.outOfStockItems = products.filter(p => p.quantity === 0).length;
    analytics.inventoryMetrics.totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

    // Generate top products
    const productRevenue = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product._id.toString();
        if (productIds.includes(productId)) {
          if (!productRevenue[productId]) {
            productRevenue[productId] = {
              revenue: 0,
              orders: 0,
              product: item.product
            };
          }
          productRevenue[productId].revenue += item.price * item.quantity;
          productRevenue[productId].orders += item.quantity;
        }
      });
    });

    analytics.topProducts = Object.values(productRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(item => ({
        id: item.product._id,
        name: item.product.name,
        revenue: item.revenue,
        orders: item.orders,
        rating: 4.2 // Mock rating for now
      }));

    // Generate category performance
    const categoryRevenue = {};
    products.forEach(product => {
      if (!categoryRevenue[product.category]) {
        categoryRevenue[product.category] = {
          revenue: 0,
          products: 0
        };
      }
      categoryRevenue[product.category].products++;
    });

    // Add revenue from orders to categories
    orders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p._id.toString() === item.product._id.toString());
        if (product) {
          categoryRevenue[product.category].revenue += item.price * item.quantity;
        }
      });
    });

    analytics.categoryPerformance = Object.entries(categoryRevenue).map(([category, data]) => ({
      category,
      revenue: data.revenue,
      products: data.products,
      growth: (Math.random() * 20 - 5).toFixed(1) // Mock growth for now
    }));

    // Generate sales data (mock for now)
    const generateSalesData = (type) => {
      const data = [];
      const days = type === 'daily' ? 30 : type === 'weekly' ? 12 : 6;
      for (let i = 0; i < days; i++) {
        data.push({
          date: new Date(now.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          revenue: Math.floor(Math.random() * 500) + 100,
          orders: Math.floor(Math.random() * 10) + 1
        });
      }
      return data;
    };

    analytics.salesData = {
      daily: generateSalesData('daily'),
      weekly: generateSalesData('weekly'),
      monthly: generateSalesData('monthly')
    };

    console.log('Analytics calculated successfully');
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};
