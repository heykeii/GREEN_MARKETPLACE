import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, trim: true },
  attachments: [{ url: String, type: { type: String } }],
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);


