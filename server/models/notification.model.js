import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  // Recipient of the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Type of notification
  type: {
    type: String,
    enum: [
      // User notifications
      'order_status_updated',
      'order_cancelled',
      'order_confirmed',
      'order_ready',
      'order_completed',
      'seller_application_approved',
      'seller_application_rejected',
      
      // Seller notifications
      'new_order',
      'new_review',
      'order_cancelled_by_customer',
      'product_status_updated',
      'product_approved',
      'product_rejected',
      
      // General notifications
      'system_message',
      'report_status_updated',
      
      // Social graph & campaigns
      'user_followed_you',
      'campaign_liked',
      'campaign_commented',
      'campaign_joined',
      'review_reply'
    ],
    required: true
  },

  // Title of the notification
  title: {
    type: String,
    required: true,
    maxlength: 100
  },

  // Message content
  message: {
    type: String,
    required: true,
    maxlength: 500
  },

  // Related data (order, product, review, etc.)
  relatedData: {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report'
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign'
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Whether the notification has been read
  isRead: {
    type: Boolean,
    default: false
  },

  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // Action URL (where to redirect when clicked)
  actionUrl: {
    type: String,
    maxlength: 200
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  const now = new Date();
  const diffInHours = (now - this.createdAt) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    const diffInDays = diffInHours / 24;
    return `${Math.floor(diffInDays)}d ago`;
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
