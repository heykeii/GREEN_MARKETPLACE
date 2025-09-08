import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ["awareness", "promotional", "community"], required: true },
  startDate: Date,
  endDate: Date,
  image: String, // primary media
  media: [String], // up to 10 URLs
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // Promotional
  featuredBusinesses: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Community
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  goal: Number, // e.g., target volunteers
  progress: { type: Number, default: 0 },

  // Awareness (social features)
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [commentSchema],

  status: { type: String, enum: ["active", "upcoming", "completed"], default: "upcoming" },
  verified: { type: Boolean, default: false }, // ✅ Admin verification required
}, { timestamps: true });

export default mongoose.model("Campaign", campaignSchema);
