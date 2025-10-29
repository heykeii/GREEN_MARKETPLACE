import Feedback from '../models/feedback.model.js';
import { NotificationService } from '../utils/notificationService.js';

// Local error response helper to match existing controllers
const errorResponse = (res, status, message, error = null) => {
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined
  });
};

export const createFeedback = async (req, res) => {
  try {
    const { name, email, category, message, page, url } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const feedback = await Feedback.create({
      user: req.user?._id || undefined,
      name: name || (req.user ? `${req.user.firstName} ${req.user.lastName}` : undefined),
      email: email || req.user?.email,
      category: category || 'feedback',
      message: message.trim(),
      meta: {
        userAgent: req.headers['user-agent'],
        page,
        url
      }
    });

    return res.status(201).json({ success: true, feedback });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to submit feedback', error);
  }
};

export const listFeedback = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('user', 'firstName lastName email')
        .populate('adminReply.admin', 'firstName lastName email role'),
      Feedback.countDocuments(filter)
    ]);

    return res.status(200).json({ success: true, items, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch feedback', error);
  }
};

export const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    if (!['new', 'reviewed', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    feedback.status = status;
    await feedback.save();

    return res.status(200).json({ success: true, feedback });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update feedback', error);
  }
};

export const listMyFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const items = await Feedback.find({ user: userId }).sort({ createdAt: -1 }).populate('adminReply.admin', 'firstName lastName role');
    return res.status(200).json({ success: true, items });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch your feedback', error);
  }
};

export const replyToFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Reply content is required' });
    }
    const feedback = await Feedback.findById(id);
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    feedback.adminReply = {
      content: content.trim(),
      admin: req.user._id,
      createdAt: new Date()
    };
    await feedback.save();
    const populated = await Feedback.findById(id)
      .populate('user', 'firstName lastName email')
      .populate('adminReply.admin', 'firstName lastName email role');
    // Notify original user
    try {
      if (populated.user?._id) {
        await NotificationService.notifyFeedbackReplied(populated.user._id, populated);
      }
    } catch (_) {}
    return res.status(200).json({ success: true, feedback: populated });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to save reply', error);
  }
};

export const deleteFeedbackReply = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id);
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    feedback.adminReply = undefined;
    await feedback.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete reply', error);
  }
};
