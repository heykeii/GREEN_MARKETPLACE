import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true // Ensures only buyers who purchased can review
  },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Rating must be a whole number between 1 and 5'
    }
  },

  comment: {
    type: String,
    trim: true,
    maxlength: 1000,
    required: true
  },

  // Array of image URLs uploaded to cloudinary as proof/evidence
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(images) {
        return images.length <= 5; // Maximum 5 images per review
      },
      message: 'Maximum 5 images allowed per review'
    }
  },

  // Whether this review is verified (bought the product)
  isVerifiedPurchase: {
    type: Boolean,
    default: true // Since we require order reference
  },

  // Admin can hide inappropriate reviews
  isVisible: {
    type: Boolean,
    default: true
  },

  // Helpful votes from other users
  helpfulVotes: {
    type: Number,
    default: 0
  },

  // Users who voted this review as helpful
  helpfulBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Seller's reply to the review
  sellerReply: {
    content: { type: String, trim: true, maxlength: 1000 },
    createdAt: { type: Date },
    updatedAt: { type: Date }
  }
}, {
  timestamps: true
});

// Compound index to ensure one review per user per product per order
reviewSchema.index({ reviewer: 1, product: 1, order: 1 }, { unique: true });

// Index for efficient queries
reviewSchema.index({ product: 1, isVisible: 1 });
reviewSchema.index({ seller: 1, isVisible: 1 });
reviewSchema.index({ rating: 1 });

export default mongoose.model('Review', reviewSchema);
