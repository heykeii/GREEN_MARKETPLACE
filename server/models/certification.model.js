import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video', 'pdf', 'link'], default: 'image' },
  publicId: { type: String }
}, { _id: false });

const certificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  issuedBy: { type: String, trim: true },
  issueDate: { type: Date },
  media: mediaSchema,
}, { timestamps: true });

export default mongoose.model('Certification', certificationSchema);


