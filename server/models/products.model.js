import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    required: true,
  },

  images: {
    type: [String], // Array of image URLs or file paths
    default: [],
  },

  price: {
    type: Number,
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
    min: 0,
  },

  category: {
    type: String,
    required: true,
    // Temporarily comment out enum to handle existing data
    // enum: [
    //   "Eco Home & Living",
    //   "Sustainable Fashion & Accessories", 
    //   "Natural Beauty & Personal Care",
    //   "Zero-Waste Essentials",
    //   "Gifts & Eco Kits",
    //   "Upcycled Art & Crafts",
    //   "Eco Baby & Kids",
    //   "Garden & Outdoors",
    //   "Education & Advocacy"
    // ],
    default: "Eco Home & Living"
  },

  origin: {
    type: String, // e.g., Batangas, PH
    default: "",
  },

  productionMethod: {
    type: String, // e.g., "handcrafted", "machine-assisted"
    default: "",
  },

  materialsUsed: {
    type: [String],
    required: true, // e.g., ["recycled wood", "organic cotton"]
  },

  sustainabilityScore: {
    type: Number,
    default: 0, // to be calculated based on materialsUsed
  },

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  isAvailable: {
    type: Boolean,
    default: true,
  },

  externalUrls: [{
    platform: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    }
  }],

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Product", productSchema);
