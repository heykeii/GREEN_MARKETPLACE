import User from '../models/user.model.js';
import SellerApplication from '../models/seller.model.js';
import Product from '../models/products.model.js';
import Campaign from '../models/campaign.model.js';
import Report from '../models/reports.model.js';
import Order from '../models/orders.model.js';
import { processSustainabilityScoring } from '../utils/sustainabilityScoring.js';
import { NotificationService } from '../utils/notificationService.js';

// Helper for error responses
const errorResponse = (res, status, message, error = null, details = null) => {
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined,
    details
  });
};

// Get admin dashboard statistics
export const getAdminStats = async (req, res) => {
  try {
    console.log('Fetching admin statistics...');

    const start = new Date();
    // cover the last 6 full calendar months including current month
    start.setMonth(start.getMonth() - 5, 1);
    start.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalSellers,
      pendingApplications,
      verifiedSellers,
      totalReports,
      pendingReports,
      usersByMonthAgg,
      sellersByMonthAgg,
      totalProducts,
      totalOrders,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isSeller: true, sellerStatus: 'verified' }),
      // Count pending applications only for active users
      (async () => {
        const activeUsers = await User.find({ isActive: { $ne: false } }).select('_id');
        const activeUserIds = activeUsers.map(user => user._id);
        return SellerApplication.countDocuments({ 
          status: 'pending', 
          user: { $in: activeUserIds } 
        });
      })(),
      User.countDocuments({ sellerStatus: 'verified' }),
      Report.countDocuments({}),
      Report.countDocuments({ status: 'pending' }),
      // Users created per month
      User.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } }
      ]),
      // Sellers approved per month based on SellerApplication.reviewedAt
      SellerApplication.aggregate([
        { $match: { status: 'approved', reviewedAt: { $ne: null, $gte: start } } },
        { $group: { _id: { y: { $year: '$reviewedAt' }, m: { $month: '$reviewedAt' } }, count: { $sum: 1 } } }
      ]),
      // Additional metrics for better analytics
      Product.countDocuments({ status: 'approved' }),
      Order.countDocuments({ status: { $in: ['completed', 'delivered'] }, paymentStatus: 'paid' }),
      // Calculate total revenue from completed orders
      Order.aggregate([
        { $match: { status: { $in: ['completed', 'delivered'] }, paymentStatus: 'paid' } },
        { $unwind: '$items' },
        { $group: { _id: null, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
      ])
    ]);

    // Build last 6 months labels
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ y: d.getFullYear(), m: d.getMonth() + 1, label: d.toLocaleString('en-US', { month: 'short' }) });
    }

    const usersMap = new Map(usersByMonthAgg.map(x => [`${x._id.y}-${x._id.m}`, x.count]));
    const sellersMap = new Map(sellersByMonthAgg.map(x => [`${x._id.y}-${x._id.m}`, x.count]));

    const platformGrowth = months.map(({ y, m, label }) => ({
      month: label,
      users: usersMap.get(`${y}-${m}`) || 0,
      sellers: sellersMap.get(`${y}-${m}`) || 0
    }));

    // Extract total revenue from aggregation result
    const platformRevenue = totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0;

    // Build recent admin activity (lightweight, last 5 by recency across key collections)
    const [latestUsers, latestApprovedProducts, latestReports, latestOrders] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }).limit(5).select('firstName lastName createdAt').lean(),
      Product.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(5).select('name createdAt').lean(),
      Report.find({}).sort({ createdAt: -1 }).limit(5).select('status createdAt').lean(),
      Order.find({}).sort({ createdAt: -1 }).limit(5).select('status createdAt').lean()
    ]);

    const formatTimeAgo = (d) => {
      const diffMs = Date.now() - new Date(d).getTime();
      const hours = Math.floor(diffMs / 36e5);
      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours} hours ago`;
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    const recentActivities = [
      ...latestUsers.map(u => ({ user: `${u.firstName || 'User'}${u.lastName ? ' ' + u.lastName : ''}`.trim(), action: 'New Registration', time: formatTimeAgo(u.createdAt), type: 'info' })),
      ...latestApprovedProducts.map(p => ({ user: p.name || 'Product', action: 'Product Submitted', time: formatTimeAgo(p.createdAt), type: 'info' })),
      ...latestReports.map(r => ({ user: 'Report', action: 'Report Filed', time: formatTimeAgo(r.createdAt), type: r.status === 'pending' ? 'warning' : 'success' })),
      ...latestOrders.map(o => ({ user: 'Payment', action: 'Payment Processed', time: formatTimeAgo(o.createdAt), type: o.paymentStatus === 'paid' ? 'success' : 'info' }))
    ]
      .sort((a, b) => (a.timeStamp || 0) < (b.timeStamp || 0))
      .slice(0, 5);

    // Validate admin stats data
    if (platformRevenue < 0) {
      console.warn('Warning: Negative platform revenue detected, setting to 0');
      platformRevenue = 0;
    }

    console.log('Admin stats fetched successfully');
    console.log('Admin stats summary:', {
      users: totalUsers,
      sellers: totalSellers,
      products: totalProducts,
      orders: totalOrders,
      revenue: Math.round(platformRevenue * 100) / 100
    });

    res.status(200).json({
      success: true,
      totalUsers,
      totalSellers,
      pendingApplications,
      verifiedSellers,
      totalReports,
      pendingReports,
      totalProducts,
      totalOrders,
      totalRevenue: Math.round(platformRevenue * 100) / 100,
      platformGrowth,
      recentActivities,
      // Add metadata for debugging
      metadata: {
        calculatedAt: new Date().toISOString(),
        dateRange: {
          start: start.toISOString(),
          end: now.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    errorResponse(res, 500, 'Failed to fetch admin statistics', error);
  }
};

// Get all seller applications with pagination and filtering
export const getSellerApplications = async (req, res) => {
  try {
    console.log('Fetching seller applications...');
    
    const { 
      page = 1, 
      limit = 10, 
      status, 
      sellerType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (sellerType) filter.sellerType = sellerType;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('Filter:', filter);
    console.log('Sort:', sort);
    console.log('Pagination:', { page, limit, skip });

    // First, get all user IDs that are active
    const activeUsers = await User.find({ isActive: { $ne: false } }).select('_id');
    const activeUserIds = activeUsers.map(user => user._id);

    // Update filter to only include applications with active users
    const filterWithActiveUsers = {
      ...filter,
      user: { $in: activeUserIds }
    };

    const [applications, total] = await Promise.all([
      SellerApplication.find(filterWithActiveUsers)
        .populate('user', 'firstName lastName email avatar contactNumber location')
        .populate('reviewedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SellerApplication.countDocuments(filterWithActiveUsers)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    console.log(`Found ${applications.length} applications with active users out of ${total} total`);

    res.status(200).json({ 
      success: true,
      applications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching seller applications:', error);
    errorResponse(res, 500, 'Failed to fetch seller applications', error);
  }
};

// Get a specific seller application by ID
export const getSellerApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    console.log('Fetching seller application:', applicationId);

    const application = await SellerApplication.findById(applicationId)
      .populate('user', 'firstName lastName email avatar contactNumber location')
      .populate('reviewedBy', 'firstName lastName');

    if (!application) {
      return errorResponse(res, 404, 'Seller application not found');
    }

    console.log('Application found:', application._id);

    res.status(200).json({ 
      success: true,
      application
    });
  } catch (error) {
    console.error('Error fetching seller application:', error);
    errorResponse(res, 500, 'Failed to fetch seller application', error);
  }
};

export const getAllUsers = async (req, res) => {
  try {
    console.log('Fetching all users...');
    
    const { 
      page = 1, 
      limit = 20,
      role,
      sellerStatus,
      isVerified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    if (role) filter.role = role;
    if (sellerStatus) filter.sellerStatus = sellerStatus;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    
    // Add search functionality
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    console.log(`Found ${users.length} users out of ${total} total`);

    res.status(200).json({ 
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    errorResponse(res, 500, 'Failed to fetch all users', error);
  }
};

// Get all products pending verification
export const getPendingProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const filter = { status: 'pending' };
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'firstName lastName email')
        .select('name description images price quantity category origin productionMethod materialsUsed sustainabilityScore structuredMaterials materialRecyclabilityScores sustainabilityCalculation seller status createdAt')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);

    // Process sustainability data for admin display
    const toPlainObject = (maybeMap) => {
      if (!maybeMap) return {};
      // If it's a real Map (when not lean)
      if (typeof maybeMap.get === 'function' && typeof maybeMap.entries === 'function') {
        try { return Object.fromEntries(Array.from(maybeMap.entries())); } catch { return {}; }
      }
      // If it's already a plain object (lean result)
      if (typeof maybeMap === 'object' && !Array.isArray(maybeMap)) {
        return maybeMap;
      }
      // If it's an array of [key,value]
      if (Array.isArray(maybeMap)) {
        try { return Object.fromEntries(maybeMap); } catch { return {}; }
      }
      return {};
    };

    const parseDetails = (details) => {
      if (!details) return [];
      if (Array.isArray(details)) return details;
      if (typeof details === 'string') {
        try { return JSON.parse(details); } catch { return []; }
      }
      return [];
    };

    const processedProducts = products.map(product => {
      const structuredMaterialsObj = toPlainObject(product.structuredMaterials);
      const recyclabilityScoresObj = toPlainObject(product.materialRecyclabilityScores);
      const calculation = product.sustainabilityCalculation ? {
        ...product.sustainabilityCalculation,
        details: parseDetails(product.sustainabilityCalculation.details)
      } : null;

      return {
        ...product,
        sustainabilityData: {
          score: product.sustainabilityScore || 0,
          hasStructuredMaterials: Object.keys(structuredMaterialsObj).length > 0,
          structuredMaterials: structuredMaterialsObj,
          recyclabilityScores: recyclabilityScoresObj,
          calculation
        }
      };
    });

    const totalPages = Math.ceil(total / parseInt(limit));
    res.status(200).json({
      success: true,
      products: processedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching pending products:', error);
    errorResponse(res, 500, 'Failed to fetch pending products', error);
  }
};

// Get all products approved
export const getApprovedProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const filter = { status: 'approved' };
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);
    const totalPages = Math.ceil(total / parseInt(limit));
    res.status(200).json({
      success: true,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching approved products:', error);
    errorResponse(res, 500, 'Failed to fetch approved products', error);
  }
};

// Get all products rejected
export const getRejectedProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const filter = { status: 'rejected' };
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter)
    ]);
    const totalPages = Math.ceil(total / parseInt(limit));
    res.status(200).json({
      success: true,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching rejected products:', error);
    errorResponse(res, 500, 'Failed to fetch rejected products', error);
  }
};

// Approve a product
export const approveProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }
    product.status = 'approved';
    product.isAvailable = true; // Ensure product is available when approved
    await product.save();
    // Notify seller about approval and status update
    try {
      await NotificationService.notifyProductApproved(product.seller, product);
      await NotificationService.notifyProductStatusUpdated(product.seller, product, 'approved');
    } catch (notifyErr) {
      console.warn('Failed to send product approval notification:', notifyErr?.message || notifyErr);
    }
    res.status(200).json({ 
      success: true,
      message: 'Product approved',
      product
    });
  } catch (error) {
    console.error('Error approving product:', error);
    errorResponse(res, 500, 'Failed to approve product', error);
  }
};

// Reject a product
export const rejectProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { message } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }
    product.status = 'rejected';
    if (message) product.rejectionMessage = message;
    await product.save();
    // Notify seller about rejection and status update
    try {
      await NotificationService.notifyProductRejected(product.seller, product, message);
      await NotificationService.notifyProductStatusUpdated(product.seller, product, 'rejected');
    } catch (notifyErr) {
      console.warn('Failed to send product rejection notification:', notifyErr?.message || notifyErr);
    }
    res.status(200).json({ 
      success: true,
      message: 'Product rejected',
      product
    });
  } catch (error) {
    console.error('Error rejecting product:', error);
    errorResponse(res, 500, 'Failed to reject product', error);
  }
};

// Permanently delete a user by admin
export const deleteUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Store user info before deletion for logging
    const deletedUserInfo = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };

    // Clean up related data before deleting user
    try {
      // Delete seller applications
      const deletedApplications = await SellerApplication.deleteMany({ user: userId });
      console.log(`Deleted ${deletedApplications.deletedCount} seller applications for user ${deletedUserInfo.email}`);
      
      // Delete user's products
      const deletedProducts = await Product.deleteMany({ seller: userId });
      console.log(`Deleted ${deletedProducts.deletedCount} products for user ${deletedUserInfo.email}`);
      
      // Delete user's orders
      const deletedOrders = await Order.deleteMany({ 
        $or: [{ buyer: userId }, { seller: userId }] 
      });
      console.log(`Deleted ${deletedOrders.deletedCount} orders for user ${deletedUserInfo.email}`);
    } catch (cleanupError) {
      console.error('Error during user data cleanup:', cleanupError);
      // Continue with user deletion even if cleanup fails
    }

    // Delete the user
    await user.deleteOne();

    // Log the deletion for audit purposes
    console.log(`User account deleted by admin:`, {
      deletedUserId: deletedUserInfo.id,
      deletedUserEmail: deletedUserInfo.email,
      deletedBy: req.user.email,
      deletedAt: new Date().toISOString()
    });

    res.status(200).json({ 
      success: true, 
      message: 'User deleted successfully.',
      deletedUser: {
        id: deletedUserInfo.id,
        email: deletedUserInfo.email
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    errorResponse(res, 500, 'Failed to delete user', error);
  }
};

// Get all campaigns for admin management
export const getAllCampaigns = async (req, res) => {
  try {
    console.log('Fetching all campaigns for admin...');
    
    const { 
      page = 1, 
      limit = 20,
      type,
      status,
      verified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (verified !== undefined) filter.verified = verified === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .populate('featuredBusinesses', 'firstName lastName email businessName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Campaign.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    console.log(`Found ${campaigns.length} campaigns out of ${total} total`);

    res.status(200).json({ 
      success: true,
      campaigns,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    errorResponse(res, 500, 'Failed to fetch campaigns', error);
  }
};

// Get pending campaigns for verification
export const getPendingCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const filter = { verified: false };
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .populate('featuredBusinesses', 'firstName lastName email businessName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Campaign.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.status(200).json({
      success: true,
      campaigns,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching pending campaigns:', error);
    errorResponse(res, 500, 'Failed to fetch pending campaigns', error);
  }
};

// Verify/reject a campaign
export const verifyCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { verified, rejectionMessage } = req.body;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return errorResponse(res, 404, 'Campaign not found');
    }

    campaign.verified = verified;
    if (rejectionMessage) {
      campaign.rejectionMessage = rejectionMessage;
    }

    await campaign.save();

    res.status(200).json({ 
      success: true,
      message: `Campaign ${verified ? 'verified' : 'rejected'} successfully`,
      campaign
    });
  } catch (error) {
    console.error('Error verifying campaign:', error);
    errorResponse(res, 500, 'Failed to verify campaign', error);
  }
};

// Delete a campaign by admin
export const deleteCampaignByAdmin = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = await Campaign.findById(campaignId);
    
    if (!campaign) {
      return errorResponse(res, 404, 'Campaign not found');
    }

    await Campaign.findByIdAndDelete(campaignId);

    res.status(200).json({ 
      success: true, 
      message: 'Campaign deleted successfully.' 
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    errorResponse(res, 500, 'Failed to delete campaign', error);
  }
};

// Admin-only endpoint to manually trigger sustainability scoring for a product
export const adminCalculateSustainabilityScore = async (req, res) => {
  try {
    const { productId } = req.params;
    const { materialsInput } = req.body;

    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 400, 'Invalid product ID');
    }

    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, 404, 'Product not found');
    }

    if (!materialsInput || !materialsInput.trim()) {
      return errorResponse(res, 400, 'Materials input is required for sustainability scoring');
    }

    console.log('Admin triggering sustainability scoring for product:', productId);
    const scoringResult = await processSustainabilityScoring(materialsInput);

    // Update product with new sustainability data
    product.structuredMaterials = new Map(Object.entries(scoringResult.structuredMaterials));
    product.materialRecyclabilityScores = new Map(Object.entries(scoringResult.recyclabilityScores));
    product.sustainabilityScore = scoringResult.sustainabilityScore;
    product.sustainabilityCalculation = {
      totalWeight: scoringResult.totalWeight,
      weightedScore: scoringResult.weightedScore,
      calculatedAt: scoringResult.calculatedAt,
      details: JSON.stringify(scoringResult.calculationDetails)
    };

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Sustainability score calculated and saved successfully',
      product: {
        _id: product._id,
        name: product.name,
        sustainabilityScore: product.sustainabilityScore,
        sustainabilityData: {
          score: product.sustainabilityScore,
          structuredMaterials: Object.fromEntries(product.structuredMaterials),
          recyclabilityScores: Object.fromEntries(product.materialRecyclabilityScores),
          calculation: {
            ...product.sustainabilityCalculation,
            details: JSON.parse(product.sustainabilityCalculation.details)
          }
        }
      },
      validation: scoringResult.validation
    });
  } catch (error) {
    console.error('Error calculating sustainability score (admin):', error);
    return errorResponse(res, 500, 'Failed to calculate sustainability score', error.message);
  }
};

// Batch recalculate sustainability scores for products missing them
export const batchRecalculateSustainabilityScores = async (req, res) => {
  try {
    console.log('Starting batch sustainability score recalculation...');

    // Find products without sustainability scores but with materialsUsed
    const productsToUpdate = await Product.find({
      $or: [
        { sustainabilityScore: { $exists: false } },
        { sustainabilityScore: 0 },
        { sustainabilityScore: null }
      ],
      materialsUsed: { $exists: true, $ne: [] }
    }).select('_id name materialsUsed');

    console.log(`Found ${productsToUpdate.length} products that need sustainability scoring`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const product of productsToUpdate) {
      try {
        const materialsArray = Array.isArray(product.materialsUsed) ? product.materialsUsed : [product.materialsUsed];
        const materialInputForScoring = materialsArray.join(', ');

        if (materialInputForScoring && materialInputForScoring.trim()) {
          console.log(`Processing sustainability for product: ${product.name}`);
          const scoringResult = await processSustainabilityScoring(materialInputForScoring);

          // Update the product
          await Product.findByIdAndUpdate(product._id, {
            structuredMaterials: new Map(Object.entries(scoringResult.structuredMaterials)),
            materialRecyclabilityScores: new Map(Object.entries(scoringResult.recyclabilityScores)),
            sustainabilityScore: scoringResult.sustainabilityScore,
            sustainabilityCalculation: {
              totalWeight: scoringResult.totalWeight,
              weightedScore: scoringResult.weightedScore,
              calculatedAt: scoringResult.calculatedAt,
              details: JSON.stringify(scoringResult.calculationDetails)
            }
          });

          successCount++;
          console.log(`✅ Successfully calculated sustainability score for: ${product.name} (${scoringResult.sustainabilityScore})`);
        }
      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to process ${product.name}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    res.status(200).json({
      success: true,
      message: `Batch sustainability score calculation completed.`,
      stats: {
        totalProducts: productsToUpdate.length,
        successful: successCount,
        failed: errorCount,
        errors: errors.slice(0, 10) // Only show first 10 errors
      }
    });
  } catch (error) {
    console.error('Error in batch sustainability calculation:', error);
    return errorResponse(res, 500, 'Failed to batch calculate sustainability scores', error.message);
  }
};