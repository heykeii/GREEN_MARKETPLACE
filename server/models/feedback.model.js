import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    category: {
      type: String,
      enum: ['comment', 'feedback', 'suggestion', 'bug', 'other'],
      default: 'feedback'
    },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['new', 'reviewed', 'archived'], default: 'new' },
    meta: {
      userAgent: String,
      page: String,
      url: String
    }
  },
  { timestamps: true }
);

export default mongoose.model('Feedback', feedbackSchema);


