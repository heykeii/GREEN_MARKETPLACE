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
    proofOfAddress: { type: String, required: true },
    bankProof: { type: String, required: true }, // Screenshot or account details

    // For business type only
    businessPermit: { type: String },
    birRegistration: { type: String }
  },

  gcash: {
    number: { type: String, required: true },
    qrCode: { type: String, required: true } // URL to GCash QR code image
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
