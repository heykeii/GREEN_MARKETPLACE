import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import { getIO } from '../utils/socket.js';

// Utility to build unique key for buyer-seller conversation (one per user pair)
function buildUniqueKey(userIdA, userIdB) {
  const [a, b] = [userIdA.toString(), userIdB.toString()].sort();
  return `${a}:${b}`;
}

export const findOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { recipientId, productId } = req.body;
    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'recipientId is required' });
    }

    const uniqueKey = buildUniqueKey(userId, recipientId);
    let conversation = await Conversation.findOne({ uniqueKey }).populate('participants', 'firstName lastName avatar');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, recipientId],
        product: productId || undefined, // Store the most recent product context
        uniqueKey
      });
      conversation = await conversation.populate('participants', 'firstName lastName avatar');
    } else if (productId) {
      // Update the conversation's product context to the most recent product being discussed
      conversation.product = productId;
      await conversation.save();
    }

    return res.json({ success: true, conversation });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create conversation', error: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ participants: userId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate('participants', 'firstName lastName avatar')
      .populate({ path: 'lastMessage', select: 'content sender createdAt isRead' });

    return res.json({ success: true, conversations });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch conversations', error: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));

    const conversation = await Conversation.findById(conversationId)
      .populate('product', 'name price images category');
    if (!conversation || !conversation.participants.map(String).includes(userId.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'firstName lastName avatar')
      .populate('recipient', 'firstName lastName avatar');

    const total = await Message.countDocuments({ conversation: conversationId });
    return res.json({ success: true, messages: messages.reverse(), page, limit, total, conversation });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch messages', error: error.message });
  }
};

export const postMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId, content, recipientId } = req.body;
    if (!conversationId || (!content && !(req.body.attachments && req.body.attachments.length))) {
      return res.status(400).json({ success: false, message: 'conversationId and content/attachments are required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.map(String).includes(userId.toString())) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const otherParticipant = conversation.participants.map(String).find(id => id !== userId.toString());
    const targetRecipientId = recipientId || otherParticipant;

    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      recipient: targetRecipientId,
      content: content || '',
      attachments: req.body.attachments || []
    });

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const populated = await message.populate('sender', 'firstName lastName avatar');
    // Emit to room via socket
    try {
      const io = getIO();
      if (io && conversationId) {
        io.to(conversationId.toString()).emit('message', { message: populated });
      }
    } catch (e) {
      // non-fatal
    }

    return res.status(201).json({ success: true, message: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to send message', error: error.message });
  }
};

export const getUnreadChatCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Message.countDocuments({ recipient: userId, isRead: false });
    return res.json({ success: true, unreadCount: count });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch unread count', error: error.message });
  }
};

export const markConversationRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    await Message.updateMany(
      { conversation: conversationId, recipient: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to mark as read', error: error.message });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants
      .map((p) => p.toString())
      .includes(userId.toString());
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await Message.deleteMany({ conversation: conversationId });
    await Conversation.findByIdAndDelete(conversationId);

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete conversation', error: error.message });
  }
};


