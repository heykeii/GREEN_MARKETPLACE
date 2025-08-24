import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

const verifyUserAsSeller = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found with email:', email);
      return;
    }

    console.log('Found user:', {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      isSeller: user.isSeller,
      sellerStatus: user.sellerStatus
    });

    // Update user to be a verified seller
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        isSeller: true,
        sellerStatus: 'verified'
      },
      { new: true }
    );

    console.log('User updated successfully:', {
      id: updatedUser._id,
      email: updatedUser.email,
      isSeller: updatedUser.isSeller,
      sellerStatus: updatedUser.sellerStatus
    });

    console.log('User is now a verified seller!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log('Usage: node verifySeller.js <email>');
  process.exit(1);
}

verifyUserAsSeller(email);
