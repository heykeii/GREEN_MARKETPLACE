import Announcement from '../models/announcement.model.js';
import User from '../models/user.model.js';
import { createNotification } from './notification.controller.js';

// Helper for error responses
const errorResponse = (res, status, message, error = null) => {
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined
  });
};

// Create a new announcement (Admin only)
export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, type, priority, media, targetAudience, expiresAt, style } = req.body;
    const createdBy = req.user._id;

    // Validate required fields
    if (!title || !content) {
      return errorResponse(res, 400, 'Title and content are required');
    }

    const announcement = new Announcement({
      title: title.trim(),
      content: content.trim(),
      type: type || 'general',
      priority: priority || 'medium',
      media: media || [],
      createdBy,
      targetAudience: targetAudience || 'all',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      style: style || {
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
        icon: 'megaphone'
      }
    });

    await announcement.save();
    await announcement.populate('createdBy', 'firstName lastName email');

    // Send notifications to targeted users (don't wait for it to complete)
    sendAnnouncementNotifications(announcement).catch(err => {
      console.error('Error sending notifications for announcement:', announcement._id, err);
    });

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      announcement
    });

  } catch (error) {
    console.error('Error creating announcement:', error);
    errorResponse(res, 500, 'Failed to create announcement', error);
  }
};

// Get all announcements (with filtering)
export const getAnnouncements = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      priority, 
      targetAudience,
      isPublished,
      includeExpired = false
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (targetAudience) filter.targetAudience = targetAudience;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
    
    // Exclude expired announcements unless specifically requested
    if (!includeExpired) {
      filter.$or = [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Announcement.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      announcements,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching announcements:', error);
    errorResponse(res, 500, 'Failed to fetch announcements', error);
  }
};

// Get announcements for current user (based on their role)
export const getUserAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user = req.user;

    // Determine what announcements this user should see
    const targetFilters = ['all'];
    if (user.isSeller) {
      targetFilters.push('sellers');
      if (user.sellerStatus === 'verified') {
        targetFilters.push('verified_sellers');
      }
    } else {
      targetFilters.push('users');
    }

    const filter = {
      isPublished: true,
      targetAudience: { $in: targetFilters },
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate('createdBy', 'firstName lastName')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Announcement.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      announcements,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total
      }
    });

  } catch (error) {
    console.error('Error fetching user announcements:', error);
    errorResponse(res, 500, 'Failed to fetch announcements', error);
  }
};

// Get announcement by ID
export const getAnnouncementById = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const userId = req.user._id;

    const announcement = await Announcement.findById(announcementId)
      .populate('createdBy', 'firstName lastName email');

    if (!announcement) {
      return errorResponse(res, 404, 'Announcement not found');
    }

    // Track view if user is logged in
    if (userId && !announcement.viewedBy.some(view => view.user.toString() === userId.toString())) {
      announcement.views += 1;
      announcement.viewedBy.push({ user: userId });
      await announcement.save();
    }

    res.status(200).json({
      success: true,
      announcement
    });

  } catch (error) {
    console.error('Error fetching announcement:', error);
    errorResponse(res, 500, 'Failed to fetch announcement', error);
  }
};

// Update announcement (Admin only)
export const updateAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const updates = req.body;

    const announcement = await Announcement.findByIdAndUpdate(
      announcementId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!announcement) {
      return errorResponse(res, 404, 'Announcement not found');
    }

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      announcement
    });

  } catch (error) {
    console.error('Error updating announcement:', error);
    errorResponse(res, 500, 'Failed to update announcement', error);
  }
};

// Delete announcement (Admin only)
export const deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;

    const announcement = await Announcement.findByIdAndDelete(announcementId);

    if (!announcement) {
      return errorResponse(res, 404, 'Announcement not found');
    }

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting announcement:', error);
    errorResponse(res, 500, 'Failed to delete announcement', error);
  }
};

// Helper function to send notifications
const sendAnnouncementNotifications = async (announcement) => {
  try {
    // Determine target users
    let userFilter = { isActive: true };
    
    switch (announcement.targetAudience) {
      case 'users':
        userFilter.isSeller = false;
        break;
      case 'sellers':
        userFilter.isSeller = true;
        break;
      case 'verified_sellers':
        userFilter = { ...userFilter, isSeller: true, sellerStatus: 'verified' };
        break;
      // 'all' - no additional filter needed
    }

    // Get target users in batches to avoid memory issues
    const batchSize = 100;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const users = await User.find(userFilter)
        .select('_id')
        .skip(skip)
        .limit(batchSize)
        .lean();

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      // Create notifications for this batch
      const notificationPromises = users.map(user => 
        createNotification(
          user._id,
          'system_message',
          `New Announcement: ${announcement.title}`,
          announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
          { announcementId: announcement._id },
          `/campaigns`,
          announcement.priority === 'urgent' ? 'high' : announcement.priority
        ).catch(err => {
          console.error('Error creating notification for user:', user._id, err);
          return null; // Don't fail the whole batch if one notification fails
        })
      );

      await Promise.all(notificationPromises);

      skip += batchSize;
      if (users.length < batchSize) {
        hasMore = false;
      }
    }

    console.log(`Sent notifications for announcement: ${announcement.title}`);

  } catch (error) {
    console.error('Error sending announcement notifications:', error);
    // Don't throw - announcement creation should still succeed
  }
};

export default {
  createAnnouncement,
  getAnnouncements,
  getUserAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
};
