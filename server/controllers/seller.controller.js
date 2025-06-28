import SellerApplication from '../models/seller.model.js';
import User from '../models/user.model.js';
import cloudinary from '../utils/cloudinary.js';
import multer from 'multer';
import path from 'path';

// Multer setup (memory storage for direct upload to Cloudinary)
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Helper to upload a file buffer to Cloudinary
async function uploadToCloudinary(fileBuffer, filename) {
  return await cloudinary.uploader.upload_stream({
    folder: 'seller_verification',
    public_id: path.parse(filename).name,
    resource_type: 'auto',
  }, (error, result) => {
    if (error) throw error;
    return result;
  });
}

// Seller Verification Controller
export const submitSellerVerification = async (req, res) => {
  try {
    const { sellerType, tin } = req.body;
    const userId = req.user._id;
    const files = req.files;

    // Validate required files
    if (!files || !files.govIDs || files.govIDs.length < 2 || !files.proofOfAddress || !files.bankProof) {
      return res.status(400).json({ message: 'Required documents missing.' });
    }

    // Upload all files to Cloudinary
    const uploadFile = async (file) => {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({
          folder: 'seller_verification',
          resource_type: 'auto',
        }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(file.buffer);
      });
      return result.secure_url;
    };

    // Upload documents
    const govIDs = await Promise.all(files.govIDs.map(uploadFile));
    const proofOfAddress = await uploadFile(files.proofOfAddress[0]);
    const bankProof = await uploadFile(files.bankProof[0]);

    // Business-specific documents
    let dtiRegistration, businessPermit, birRegistration;
    if (sellerType === 'business') {
      if (!files.dtiRegistration || !files.businessPermit || !files.birRegistration) {
        return res.status(400).json({ message: 'Business documents missing.' });
      }
      dtiRegistration = await uploadFile(files.dtiRegistration[0]);
      businessPermit = await uploadFile(files.businessPermit[0]);
      birRegistration = await uploadFile(files.birRegistration[0]);
    }

    // Save application
    const application = await SellerApplication.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        sellerType,
        documents: {
          govIDs,
          tin,
          proofOfAddress,
          bankProof,
          dtiRegistration,
          businessPermit,
          birRegistration,
        },
        status: 'pending',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Set user sellerStatus to pending
    await User.findByIdAndUpdate(userId, { sellerStatus: 'pending' });

    res.status(201).json({ message: 'Seller verification submitted.', application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to submit seller verification.', error: error.message });
  }
};

// Admin: Approve or Reject Seller Application
export const reviewSellerApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { action, message } = req.body; // action: 'approved' or 'rejected'
    const adminId = req.user._id;

    const application = await SellerApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Seller application not found.' });
    }

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action.' });
    }

    application.status = action;
    application.message = message || '';
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();
    await application.save();

    // Update user seller status
    if (action === 'approved') {
      await User.findByIdAndUpdate(application.user, {
        isSeller: true,
        sellerStatus: 'verified'
      });
    } else if (action === 'rejected') {
      await User.findByIdAndUpdate(application.user, {
        isSeller: false,
        sellerStatus: 'rejected'
      });
    }

    res.status(200).json({ message: `Seller application ${action}.`, application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to review seller application.', error: error.message });
  }
};
