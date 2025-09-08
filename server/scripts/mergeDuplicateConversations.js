import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import User from '../models/user.model.js'; // Import User model to register the schema

// Load environment variables
dotenv.config();

// Function to build unique key for user pair (same logic as controller)
function buildUniqueKey(userIdA, userIdB) {
  const [a, b] = [userIdA.toString(), userIdB.toString()].sort();
  return `${a}:${b}`;
}

async function mergeDuplicateConversations() {
  try {
    // Debug: Show available environment variables
    console.log('Available environment variables:');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
    
    // Try different possible database URLs
    const possibleUrls = [
      process.env.MONGODB_URI,
      process.env.DATABASE_URL,
      process.env.MONGO_URI,
      'mongodb://localhost:27017/green-marketplace',
      'mongodb://127.0.0.1:27017/green-marketplace'
    ].filter(Boolean);
    
    console.log('Trying database URLs:', possibleUrls);
    
    let connected = false;
    for (const url of possibleUrls) {
      try {
        await mongoose.connect(url);
        console.log(`Connected to MongoDB using: ${url}`);
        connected = true;
        break;
      } catch (err) {
        console.log(`Failed to connect with ${url}:`, err.message);
      }
    }
    
    if (!connected) {
      throw new Error('Could not connect to MongoDB with any URL');
    }

    // Get all conversations (remove populate to avoid schema issues)
    const conversations = await Conversation.find({});
    
    // Group conversations by participant pair
    const conversationGroups = {};
    
    for (const conv of conversations) {
      if (conv.participants.length === 2) {
        const key = buildUniqueKey(conv.participants[0], conv.participants[1]);
        
        if (!conversationGroups[key]) {
          conversationGroups[key] = [];
        }
        conversationGroups[key].push(conv);
      }
    }

    // Find and merge duplicate conversations
    let mergedCount = 0;
    
    for (const [key, convs] of Object.entries(conversationGroups)) {
      if (convs.length > 1) {
        console.log(`Found ${convs.length} duplicate conversations for user pair: ${key}`);
        
        // Sort conversations by creation date (oldest first)
        convs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        const primaryConv = convs[0]; // Keep the oldest conversation
        const duplicateConvs = convs.slice(1); // These will be merged/deleted
        
        console.log(`Keeping conversation ${primaryConv._id}, merging ${duplicateConvs.length} duplicates`);
        
        // Update the primary conversation's uniqueKey
        primaryConv.uniqueKey = key;
        
        // Use the most recent product from any of the conversations
        const mostRecentProduct = convs
          .filter(c => c.product)
          .sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt))[0]?.product;
        
        if (mostRecentProduct) {
          primaryConv.product = mostRecentProduct;
        }
        
        // Find the most recent message across all conversations
        let mostRecentMessage = primaryConv.lastMessage;
        let mostRecentMessageAt = primaryConv.lastMessageAt;
        
        for (const dupConv of duplicateConvs) {
          // Move all messages from duplicate conversations to primary conversation
          await Message.updateMany(
            { conversation: dupConv._id },
            { conversation: primaryConv._id }
          );
          
          // Check if this conversation has a more recent message
          if (dupConv.lastMessageAt && (!mostRecentMessageAt || new Date(dupConv.lastMessageAt) > new Date(mostRecentMessageAt))) {
            mostRecentMessage = dupConv.lastMessage;
            mostRecentMessageAt = dupConv.lastMessageAt;
          }
          
          // Delete the duplicate conversation
          await Conversation.findByIdAndDelete(dupConv._id);
          console.log(`Deleted duplicate conversation ${dupConv._id}`);
        }
        
        // Update primary conversation with the most recent message info
        primaryConv.lastMessage = mostRecentMessage;
        primaryConv.lastMessageAt = mostRecentMessageAt;
        await primaryConv.save();
        
        mergedCount += duplicateConvs.length;
        console.log(`Merged conversation group for ${key} - moved messages to ${primaryConv._id}`);
      }
    }
    
    console.log(`\nMerge complete! Removed ${mergedCount} duplicate conversations.`);
    
  } catch (error) {
    console.error('Error merging duplicate conversations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
mergeDuplicateConversations();
