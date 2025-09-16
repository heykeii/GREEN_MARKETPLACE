import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { findOrCreateConversation, getConversations, getMessages, postMessage, getUnreadChatCount, markConversationRead, markMessageSeen, deleteConversation } from '../controllers/chat.controller.js';

const router = express.Router();

router.post('/conversations', protect, findOrCreateConversation);
router.get('/conversations', protect, getConversations);
router.get('/messages/:conversationId', protect, getMessages);
router.post('/messages', protect, postMessage);
router.get('/unread-count', protect, getUnreadChatCount);
router.patch('/conversations/:conversationId/mark-read', protect, markConversationRead);
router.patch('/messages/:messageId/seen', protect, markMessageSeen);
router.delete('/conversations/:conversationId', protect, deleteConversation);

export default router;


