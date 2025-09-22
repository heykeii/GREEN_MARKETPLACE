import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video', 'pdf', 'link'], default: 'image' },
  publicId: { type: String }
}, { _id: false });

const sustainabilityContentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: { type: String, enum: ['initiative', 'resource', 'event'], required: true },
  tags: [{ type: String, trim: true }],
  eventDate: { type: Date },
  media: mediaSchema,
  link: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('SustainabilityContent', sustainabilityContentSchema);


