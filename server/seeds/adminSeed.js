import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'greenmarketplace02@gmail.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('HOTDOGSAPACIFICOCEAN', saltRounds);

    // Create admin user
    const adminUser = new User({
      firstName: 'Green',
      lastName: 'Marketplace',
      email: 'greenmarketplace02@gmail.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      isActive: true
    });

    await adminUser.save();
    console.log('Default admin user created successfully');
    console.log('Email: greenmarketplace02@gmail.com');
    console.log('Password: HOTDOGSAPACIFICOCEAN');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
createAdminUser(); 