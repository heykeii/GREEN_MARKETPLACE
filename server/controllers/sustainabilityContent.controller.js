import SustainabilityContent from '../models/sustainabilityContent.model.js';
import cloudinary from '../utils/cloudinary.js';
import User from '../models/user.model.js';
import { createNotification } from './notification.controller.js';

const errorResponse = (res, status, message, error = null) => res.status(status).json({ success: false, message, error: process.env.NODE_ENV === 'development' ? error : undefined });

const uploadMediaIfNeeded = async (media) => {
  if (!media) return undefined;
  // Support { dataUrl, type } or direct url already hosted on Cloudinary
  if (media.url && typeof media.url === 'string' && media.url.includes('res.cloudinary.com')) {
    return media;
  }
  if (media.dataUrl) {
    const result = await cloudinary.uploader.upload(media.dataUrl, { folder: 'sustainability', resource_type: 'auto' });
    return { url: result.secure_url, type: result.resource_type === 'image' ? 'image' : result.resource_type, publicId: result.public_id };
  }
  // Fallback: if only url provided and not Cloudinary, try to upload by fetching remote URL
  if (media.url) {
    const result = await cloudinary.uploader.upload(media.url, { folder: 'sustainability', resource_type: 'auto' });
    return { url: result.secure_url, type: result.resource_type === 'image' ? 'image' : result.resource_type, publicId: result.public_id };
  }
  return undefined;
};

export const createContent = async (req, res) => {
  try {
    const { title, description, type, tags, eventDate, media, link, isPublished } = req.body;
    if (!title || !type) return errorResponse(res, 400, 'Title and type are required');

    const uploadedMedia = await uploadMediaIfNeeded(media);

    const doc = await SustainabilityContent.create({
      title: title.trim(),
      description: description?.trim() || '',
      type,
      tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
      eventDate: eventDate ? new Date(eventDate) : undefined,
      media: uploadedMedia,
      link,
      isPublished: isPublished !== undefined ? isPublished : true,
      createdBy: req.user?._id
    });
    // Fire-and-forget notifications to all active users
    try {
      const users = await User.find({ isActive: true }).select('_id').lean();
      const titleText = `New ${type.charAt(0).toUpperCase() + type.slice(1)}: ${doc.title}`;
      const message = (doc.description || '').slice(0, 200) + ((doc.description || '').length > 200 ? '...' : '');
      const actionUrl = type === 'event' ? '/sustainability?tab=event' : '/sustainability';
      await Promise.all(users.map(u => createNotification(u._id, 'system_message', titleText, message, { sustainabilityId: doc._id, contentType: type }, actionUrl, 'medium').catch(()=>null)));
    } catch (e) {
      // non-fatal
    }
    res.status(201).json({ success: true, content: doc });
  } catch (error) {
    errorResponse(res, 500, 'Failed to create content', error);
  }
};

export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.media) {
      const uploadedMedia = await uploadMediaIfNeeded(updates.media);
      updates.media = uploadedMedia;
    }
    const doc = await SustainabilityContent.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!doc) return errorResponse(res, 404, 'Content not found');
    res.status(200).json({ success: true, content: doc });
  } catch (error) {
    errorResponse(res, 500, 'Failed to update content', error);
  }
};

export const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await SustainabilityContent.findByIdAndDelete(id);
    if (!doc) return errorResponse(res, 404, 'Content not found');
    // Best effort: delete asset from Cloudinary
    if (doc.media?.publicId) {
      try { await cloudinary.uploader.destroy(doc.media.publicId, { resource_type: 'auto' }); } catch (e) {
        // non-fatal
      }
    }
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    errorResponse(res, 500, 'Failed to delete content', error);
  }
};

export const getPublicContent = async (req, res) => {
  try {
    const { type, upcoming } = req.query;
    const filter = { isPublished: true };
    if (type) filter.type = type;
    if (upcoming === 'true') filter.eventDate = { $gte: new Date() };
    if (upcoming === 'false') filter.eventDate = { $lt: new Date() };
    const items = await SustainabilityContent.find(filter).sort({ eventDate: 1, createdAt: -1 });
    res.status(200).json({ success: true, items });
  } catch (error) {
    errorResponse(res, 500, 'Failed to fetch content', error);
  }
};

export const getPublicContentById = async (req, res) => {
  try {
    const item = await SustainabilityContent.findOne({ _id: req.params.id, isPublished: true });
    if (!item) return errorResponse(res, 404, 'Content not found');
    res.status(200).json({ success: true, item });
  } catch (error) {
    errorResponse(res, 500, 'Failed to fetch content', error);
  }
};

export const getAdminContent = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;
    const items = await SustainabilityContent.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, items });
  } catch (error) {
    errorResponse(res, 500, 'Failed to fetch content', error);
  }
};


