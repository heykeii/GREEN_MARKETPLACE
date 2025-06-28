import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Drop the problematic verificationToken index
    try {
      await usersCollection.dropIndex('verificationToken_1');
      console.log('Dropped verificationToken index');
    } catch (error) {
      console.log('Index might not exist or already dropped:', error.message);
    }

    // The index will be recreated automatically when the model is used
    // with the sparse: true option we just added

    console.log('Index fix completed');

  } catch (error) {
    console.error('Error fixing index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the fix
fixIndex(); 