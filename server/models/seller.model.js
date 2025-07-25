import mongoose from 'mongoose';

const sellerApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  sellerType: {
    type: String,
    enum: ['individual', 'business'],
    required: true
  },

  documents: {
    govIDs: [{ type: String, required: true }], // URLs to 2 government IDs
    tin: { type: String, required: true },
    proofOfAddress: { type: String, required: true },
    bankProof: { type: String, required: true }, // Screenshot or account details

    // For business type only
    dtiRegistration: { type: String }, // file URL
    businessPermit: { type: String },
    birRegistration: { type: String }
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  message: {
    type: String,
    maxlength: 500
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const SellerApplication = mongoose.model('SellerApplication', sellerApplicationSchema);

export default SellerApplication;
