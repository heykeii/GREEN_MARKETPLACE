import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastMessageAt: { type: Date },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  uniqueKey: { type: String, index: true, unique: true, sparse: true },
}, { timestamps: true });

export default mongoose.model('Conversation', conversationSchema);


