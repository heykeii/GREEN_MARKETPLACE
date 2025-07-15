import User from '../models/user.model.js';
import SellerApplication from '../models/seller.model.js';
import Product from '../models/products.model.js';

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
    
    const [totalUsers, totalSellers, pendingApplications, verifiedSellers] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isSeller: true, sellerStatus: 'verified' }),
      SellerApplication.countDocuments({ status: 'pending' }),
      User.countDocuments({ sellerStatus: 'verified' })
    ]);

    console.log('Admin stats fetched successfully:', {
      totalUsers,
      totalSellers,
      pendingApplications,
      verifiedSellers
    });

    res.status(200).json({
      success: true,
      totalUsers,
      totalSellers,
      pendingApplications,
      verifiedSellers
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

    const [applications, total] = await Promise.all([
      SellerApplication.find(filter)
        .populate('user', 'firstName lastName email avatar contactNumber location')
        .populate('reviewedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SellerApplication.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    console.log(`Found ${applications.length} applications out of ${total} total`);

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
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    if (role) filter.role = role;
    if (sellerStatus) filter.sellerStatus = sellerStatus;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

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
    console.error('Error fetching pending products:', error);
    errorResponse(res, 500, 'Failed to fetch pending products', error);
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