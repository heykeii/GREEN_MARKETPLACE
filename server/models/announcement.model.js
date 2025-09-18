import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  type: {
    type: String,
    enum: ['general', 'maintenance', 'feature', 'policy', 'event'],
    default: 'general'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Media attachments
  media: [{
    type: String, // URLs to images/videos
    trim: true
  }],
  
  // Who created the announcement
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Publication settings
  isPublished: {
    type: Boolean,
    default: true
  },
  
  publishedAt: {
    type: Date,
    default: Date.now
  },
  
  // Expiration (optional)
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Target audience
  targetAudience: {
    type: String,
    enum: ['all', 'users', 'sellers', 'verified_sellers'],
    default: 'all'
  },
  
  // Engagement metrics
  views: {
    type: Number,
    default: 0
  },
  
  viewedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Style/appearance
  style: {
    backgroundColor: {
      type: String,
      default: '#3b82f6' // blue-500
    },
    textColor: {
      type: String,
      default: '#ffffff'
    },
    icon: {
      type: String,
      default: 'megaphone'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if announcement is expired
announcementSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for checking if announcement is active
announcementSchema.virtual('isActive').get(function() {
  return this.isPublished && !this.isExpired;
});

// Index for efficient queries
announcementSchema.index({ isPublished: 1, publishedAt: -1 });
announcementSchema.index({ expiresAt: 1 });
announcementSchema.index({ targetAudience: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
