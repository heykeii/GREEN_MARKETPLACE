import Campaign from "../models/campaign.model.js";
import User from "../models/user.model.js";
import cloudinary from "../utils/cloudinary.js";
import { NotificationService } from "../utils/notificationService.js";
import { BadgeService } from "../utils/badgeService.js";

// Create campaign (pending admin verification)
const createCampaign = async (req, res) => {
  try {
    const { title, description, type, startDate, endDate, image, featuredBusinesses, goal, objectives } = req.body;
    // Normalize fields that may arrive as strings when using multipart/form-data
    let parsedFeaturedBusinesses = [];
    if (featuredBusinesses) {
      if (typeof featuredBusinesses === 'string') {
        try {
          parsedFeaturedBusinesses = JSON.parse(featuredBusinesses);
        } catch (e) {
          parsedFeaturedBusinesses = [];
        }
      } else if (Array.isArray(featuredBusinesses)) {
        parsedFeaturedBusinesses = featuredBusinesses;
      }
    }
    const parsedGoal = goal ? parseInt(goal) : 0;
    let mediaUrl = image; // backward compatibility if URL is sent
    const mediaUrls = [];

    // If files were uploaded, stream them to Cloudinary (max 10)
    if (Array.isArray(req.files) && req.files.length > 0) {
      // Check if Cloudinary is configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return res.status(500).json({
          success: false,
          message: "Cloudinary configuration missing. Please set up CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.",
          error: "Missing Cloudinary configuration"
        });
      }

      const folder = `campaigns/${type || 'general'}`;
      const resourceType = 'image';

      const uploadOne = (buffer) => new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: resourceType },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(buffer);
      });

      try {
        for (const file of req.files.slice(0, 10)) {
          const url = await uploadOne(file.buffer);
          mediaUrls.push(url);
        }
        mediaUrl = mediaUrls[0] || mediaUrl;
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        return res.status(500).json({
          success: false,
          message: "Failed to upload media",
          error: err.message
        });
      }
    }

    // Validate dates (only if both provided)
    const startAt = startDate ? new Date(startDate) : null;
    const endAt = endDate ? new Date(endDate) : null;
    if (startAt && endAt && startAt.getTime() > endAt.getTime()) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date"
      });
    }

    // Enforce required image/media
    if (!mediaUrl && (!Array.isArray(req.files) || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Image is required for creating a campaign. Please upload an image or provide an image URL."
      });
    }
    const campaign = new Campaign({
      title,
      description,
      type,
      startDate: startAt || undefined,
      endDate: endAt || undefined,
      image: mediaUrl,
      media: mediaUrls.length ? mediaUrls : undefined,
      createdBy: req.user.id,
      featuredBusinesses: parsedFeaturedBusinesses,
      goal: parsedGoal || 0,
      objectives: Array.isArray(objectives)
        ? objectives.filter(o => typeof o === 'string' && o.trim().length).slice(0, 20)
        : typeof objectives === 'string'
          ? objectives.split('\n').map(s=>s.trim()).filter(Boolean).slice(0, 20)
          : undefined,
      verified: false // Requires admin verification
    });

    await campaign.save();
    await campaign.populate('createdBy', 'firstName lastName email avatar');
    
    res.status(201).json({
      success: true,
      message: "Campaign created successfully. Pending admin verification.",
      campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating campaign",
      error: error.message
    });
  }
};

// Get all campaigns (filter by type/status)
const getCampaigns = async (req, res) => {
  try {
    const { type, status, verified } = req.query;
    const filter = {};

    // Only show verified campaigns to regular users
    if (req.user?.role !== 'admin') {
      filter.verified = true;
    } else if (verified !== undefined) {
      filter.verified = verified === 'true';
    }

    if (type) filter.type = type;
    if (status) filter.status = status;

    const campaigns = await Campaign.find(filter)
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('featuredBusinesses', 'name email businessName')
      .populate('participants', 'firstName lastName email avatar')
      .populate('likes', 'firstName lastName email avatar')
      .populate('comments.user', 'firstName lastName email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching campaigns",
      error: error.message
    });
  }
};

// Get campaigns by user (public: shows verified only unless admin)
const getCampaignsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const filter = { createdBy: userId };
    if (req.user?.role !== 'admin') {
      filter.verified = true;
    }

    const campaigns = await Campaign.find(filter)
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('featuredBusinesses', 'name email businessName')
      .populate('participants', 'firstName lastName email avatar')
      .populate('likes', 'firstName lastName email avatar')
      .populate('comments.user', 'firstName lastName email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user campaigns',
      error: error.message
    });
  }
};

// Get campaigns created by current user (includes unverified)
const getMyCampaigns = async (req, res) => {
  try {
    const userId = req.user.id;

    const campaigns = await Campaign.find({ createdBy: userId })
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('featuredBusinesses', 'name email businessName')
      .populate('participants', 'firstName lastName email avatar')
      .populate('likes', 'firstName lastName email avatar')
      .populate('comments.user', 'firstName lastName email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your campaigns',
      error: error.message
    });
  }
};

// Get campaign details
const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaign = await Campaign.findById(id)
      .populate('createdBy', 'firstName lastName email avatar businessName')
      .populate('featuredBusinesses', 'name email businessName')
      .populate('participants', 'firstName lastName email avatar')
      .populate('likes', 'firstName lastName email avatar')
      .populate('comments.user', 'firstName lastName email avatar');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    // Only allow verified campaigns for regular users
    if (req.user?.role !== 'admin' && !campaign.verified) {
      return res.status(403).json({
        success: false,
        message: "Campaign not available"
      });
    }

    res.json({
      success: true,
      campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching campaign",
      error: error.message
    });
  }
};

// Update campaign (admin or creator)
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    // Check if user is admin or campaign creator
    if (req.user.role !== 'admin' && campaign.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this campaign"
      });
    }

    const updates = req.body;

    // Date validation if either date is being updated
    const nextStart = updates.startDate ? new Date(updates.startDate) : (campaign.startDate || null);
    const nextEnd = updates.endDate ? new Date(updates.endDate) : (campaign.endDate || null);
    if (nextStart && nextEnd && nextStart.getTime() > nextEnd.getTime()) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date"
      });
    }
    // Remove fields that shouldn't be updated directly
    delete updates.verified;
    delete updates.createdBy;
    delete updates.likes;
    delete updates.comments;
    delete updates.participants;

    const updatedCampaign = await Campaign.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email avatar')
     .populate('featuredBusinesses', 'name email businessName');

    res.json({
      success: true,
      message: "Campaign updated successfully",
      campaign: updatedCampaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating campaign",
      error: error.message
    });
  }
};

// Delete campaign
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    // Check if user is admin or campaign creator
    if (req.user.role !== 'admin' && campaign.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this campaign"
      });
    }

    // Best-effort: delete media from Cloudinary if hosted there
    try {
      if (campaign.image && /^https?:\/\//.test(campaign.image)) {
        const url = new URL(campaign.image);
        // path like: /<cloud_name>/image/upload/v123/campaigns/type/filename.jpg
        const afterUpload = url.pathname.split('/upload/')[1] || '';
        let publicIdWithVer = afterUpload;
        // strip leading version segment v12345/
        if (publicIdWithVer.startsWith('v')) {
          publicIdWithVer = publicIdWithVer.substring(publicIdWithVer.indexOf('/') + 1);
        }
        const publicId = publicIdWithVer.replace(/\.[^/.]+$/, '');
        if (publicId) {
          try { await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }); } catch (_) {}
          try { await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }); } catch (_) {}
        }
      }
    } catch (e) {
      // ignore cloudinary deletion errors
    }

    await Campaign.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Campaign deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting campaign",
      error: error.message
    });
  }
};

// Admin verify campaign
const verifyCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, reason } = req.body;

    const campaign = await Campaign.findByIdAndUpdate(
      id,
      { verified },
      { new: true }
    ).populate('createdBy', 'firstName lastName email avatar');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    // Send notification to campaign creator
    try {
      if (verified) {
        await NotificationService.notifyCampaignApproved(campaign.createdBy._id, campaign);
      } else {
        await NotificationService.notifyCampaignRejected(campaign.createdBy._id, campaign, reason);
      }
    } catch (notificationError) {
      console.error('Failed to send campaign verification notification:', notificationError);
      // Don't fail the verification if notification fails
    }

    res.json({
      success: true,
      message: `Campaign ${verified ? 'verified' : 'rejected'} successfully`,
      campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error verifying campaign",
      error: error.message
    });
  }
};

// Like/unlike campaign (Awareness campaigns)
const toggleLikeCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    // Allow likes on all campaign types
    const isLiked = campaign.likes.some((u) => u.toString() === userId);
    
    if (isLiked) {
      campaign.likes.pull(userId);
    } else {
      campaign.likes.push(userId);
    }

    await campaign.save();

    // Notify creator when newly liked (avoid self notification)
    try {
      if (!isLiked && campaign.createdBy && campaign.createdBy.toString() !== userId.toString()) {
        const actor = await User.findById(userId).select('firstName lastName');
        await NotificationService.notifyCampaignLiked(campaign.createdBy, campaign, actor || { _id: userId });
      }
    } catch (_) {}

    res.json({
      success: true,
      message: isLiked ? "Campaign unliked" : "Campaign liked",
      likesCount: campaign.likes.length,
      isLiked: !isLiked
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error toggling like",
      error: error.message
    });
  }
};

// Add comment to campaign (Awareness and Community campaigns)
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id; // Fixed: use _id instead of id

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required"
      });
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    if (campaign.type !== 'awareness' && campaign.type !== 'community') {
      return res.status(400).json({
        success: false,
        message: "Only awareness and community campaigns can have comments"
      });
    }

    const comment = {
      user: userId,
      text: text.trim(),
      createdAt: new Date()
    };

    campaign.comments.push(comment);
    await campaign.save();

    // Populate the new comment
    const updatedCampaign = await Campaign.findById(id)
      .populate('comments.user', 'firstName lastName email avatar');

    const newComment = updatedCampaign.comments[updatedCampaign.comments.length - 1];

    // Notify creator on comment (avoid self notification)
    try {
      if (campaign.createdBy && campaign.createdBy.toString() !== userId.toString()) {
        const actor = await User.findById(userId).select('firstName lastName');
        await NotificationService.notifyCampaignCommented(campaign.createdBy, campaign, actor || { _id: userId }, text);
      }
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: newComment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding comment",
      error: error.message
    });
  }
};

// Join campaign as participant (Community campaigns)
const joinCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    if (campaign.type !== 'community') {
      return res.status(400).json({
        success: false,
        message: "Only community campaigns can be joined"
      });
    }

    const isParticipant = campaign.participants.includes(userId);
    
    if (isParticipant) {
      campaign.participants.pull(userId);
    } else {
      campaign.participants.push(userId);
    }
    
    // Update progress to match participants count
    campaign.progress = campaign.participants.length;

    await campaign.save();

    // Track campaign participation and check for badges when user joins
    if (!isParticipant) {
      try {
        await BadgeService.updateCampaignParticipation(userId);
      } catch (badgeError) {
        console.error('Failed to update campaign participation and check badges:', badgeError);
        // Don't fail the campaign join if badge tracking fails
      }
    }

    res.json({
      success: true,
      message: isParticipant ? "Left campaign" : "Joined campaign",
      participantsCount: campaign.participants.length,
      progress: campaign.progress,
      isParticipant: !isParticipant
    });
    
    // Notify creator when newly joined (avoid self)
    try {
      if (!isParticipant && campaign.createdBy && campaign.createdBy.toString() !== userId.toString()) {
        const actor = await User.findById(userId).select('firstName lastName');
        await NotificationService.notifyCampaignJoined(campaign.createdBy, campaign, actor || { _id: userId });
      }
    } catch (_) {}
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error joining campaign",
      error: error.message
    });
  }
};

export {
  createCampaign,
  getCampaigns,
  getCampaignsByUser,
  getMyCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  verifyCampaign,
  toggleLikeCampaign,
  addComment,
  joinCampaign
};
