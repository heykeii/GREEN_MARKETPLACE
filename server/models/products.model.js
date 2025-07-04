import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

  images: {
    type: [String], // Array of image URLs or file paths
    default: []
  },

  price: {
    type: Number,
    required: true
  },

  quantity: {
    type: Number,
    required: true,
    min: 0
  },

  category: {
    type: String,
    required: true // e.g., Clothing, Decor, Accessories
  },

  tags: {
    type: [String], // e.g., ["handmade", "zero waste"]
    default: []
  },

  materialsUsed: {
    type: [String],
    required: true // e.g., ["recycled wood", "organic cotton"]
  },

  sustainabilityScore: {
    type: Number,
    default: 0 // to be calculated based on materialsUsed
  },

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  isAvailable: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
