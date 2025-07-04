import User from '../models/user.model.js';
import SellerApplication from '../models/seller.model.js';

// Get admin dashboard statistics
export const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalSellers, pendingApplications, verifiedSellers] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isSeller: true, sellerStatus: 'verified' }),
      SellerApplication.countDocuments({ status: 'pending' }),
      User.countDocuments({ sellerStatus: 'verified' })
    ]);

    res.status(200).json({
      totalUsers,
      totalSellers,
      pendingApplications,
      verifiedSellers
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch admin statistics' });
  }
};

// Get all seller applications
export const getSellerApplications = async (req, res) => {
  try {
    const applications = await SellerApplication.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (error) {
    console.error('Error fetching seller applications:', error);
    res.status(500).json({ message: 'Failed to fetch seller applications' });
  }
}; 

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('-password');
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Failed to fetch all users' });
  }
}