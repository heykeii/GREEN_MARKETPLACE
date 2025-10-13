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

  // New structured materials for sustainability scoring
  structuredMaterials: {
    type: Map,
    of: String, // e.g., {"plastic": "500g", "aluminum": "200g"}
    default: new Map()
  },

  // Individual material recyclability scores from OpenAI
  materialRecyclabilityScores: {
    type: Map,
    of: Number, // e.g., {"plastic": 0.3, "aluminum": 0.9}
    default: new Map()
  },

  sustainabilityScore: {
    type: Number,
    default: 0, // calculated based on materialsUsed and weights
  },

  // Store the calculation breakdown for transparency
  sustainabilityCalculation: {
    totalWeight: { type: Number, default: 0 },
    weightedScore: { type: Number, default: 0 },
    calculatedAt: { type: Date },
    details: { type: String } // JSON string of the calculation breakdown
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

  variants: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    sku: {
      type: String,
      trim: true
    },
    attributes: {
      type: Map,
      of: String // e.g., {"color": "red", "size": "large"}
    },
    images: [{
      type: String // Array of variant-specific image URLs
    }],
    isActive: {
      type: Boolean,
      default: true
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
