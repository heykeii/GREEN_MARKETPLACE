import User from '../models/user.model.js';
import SellerApplication from '../models/seller.model.js';

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
      totalUsers,
      totalSellers,
      pendingApplications,
      verifiedSellers
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch admin statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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
    res.status(500).json({ 
      message: 'Failed to fetch seller applications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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
      return res.status(404).json({ message: 'Seller application not found' });
    }

    console.log('Application found:', application._id);

    res.status(200).json({ application });
  } catch (error) {
    console.error('Error fetching seller application:', error);
    res.status(500).json({ 
      message: 'Failed to fetch seller application',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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
    res.status(500).json({ 
      message: 'Failed to fetch all users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};