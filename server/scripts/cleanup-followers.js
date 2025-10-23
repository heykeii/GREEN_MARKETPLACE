import mongoose from 'mongoose';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Cleanup function to remove deleted/inactive users from follower/following arrays
const cleanupDeletedUsers = async () => {
  try {
    console.log('Starting cleanup of deleted users from follower/following arrays...');
    
    // Find all users who have followers or following arrays
    const users = await User.find({
      $or: [
        { followers: { $exists: true, $ne: [] } },
        { following: { $exists: true, $ne: [] } }
      ]
    }).select('followers following');
    
    let cleanedCount = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      const updates = {};
      
      // Check followers array
      if (user.followers && user.followers.length > 0) {
        const activeFollowers = await User.find({
          _id: { $in: user.followers },
          isActive: { $ne: false }
        }).select('_id');
        
        const activeFollowerIds = activeFollowers.map(f => f._id);
        const originalLength = user.followers.length;
        const cleanedFollowers = user.followers.filter(id => activeFollowerIds.includes(id));
        
        if (cleanedFollowers.length !== originalLength) {
          updates.followers = cleanedFollowers;
          needsUpdate = true;
          console.log(`User ${user._id}: Removed ${originalLength - cleanedFollowers.length} deleted followers`);
        }
      }
      
      // Check following array
      if (user.following && user.following.length > 0) {
        const activeFollowing = await User.find({
          _id: { $in: user.following },
          isActive: { $ne: false }
        }).select('_id');
        
        const activeFollowingIds = activeFollowing.map(f => f._id);
        const originalLength = user.following.length;
        const cleanedFollowing = user.following.filter(id => activeFollowingIds.includes(id));
        
        if (cleanedFollowing.length !== originalLength) {
          updates.following = cleanedFollowing;
          needsUpdate = true;
          console.log(`User ${user._id}: Removed ${originalLength - cleanedFollowing.length} deleted following`);
        }
      }
      
      if (needsUpdate) {
        await User.findByIdAndUpdate(user._id, updates);
        cleanedCount++;
      }
    }
    
    console.log(`Cleanup completed. Updated ${cleanedCount} users.`);
    return { success: true, cleanedCount };
  } catch (error) {
    console.error('Cleanup error:', error);
    return { success: false, error: error.message };
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  console.log('Running follower/following cleanup...');
  const result = await cleanupDeletedUsers();
  
  if (result.success) {
    console.log(`✅ Cleanup successful! Updated ${result.cleanedCount} users.`);
  } else {
    console.log(`❌ Cleanup failed: ${result.error}`);
  }
  
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
  process.exit(0);
};

main().catch(console.error);
