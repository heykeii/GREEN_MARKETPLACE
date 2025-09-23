import Certification from '../models/certification.model.js';
import cloudinary from '../utils/cloudinary.js';

const errorResponse = (res, status, message, error = null) => res.status(status).json({ success: false, message, error: process.env.NODE_ENV === 'development' ? error : undefined });

const uploadMediaIfNeeded = async (media) => {
  if (!media) return undefined;
  if (media.url && media.url.includes('res.cloudinary.com')) return media;
  const source = media.dataUrl || media.url;
  if (!source) return undefined;
  const result = await cloudinary.uploader.upload(source, { folder: 'certifications', resource_type: 'auto', timeout: 120000 });
  return { url: result.secure_url, type: result.resource_type === 'image' ? 'image' : result.resource_type, publicId: result.public_id };
};

export const listMyCertifications = async (req, res) => {
  try {
    const items = await Certification.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, items });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch certifications', error);
  }
};

export const createCertification = async (req, res) => {
  try {
    const { title, description, issuedBy, issueDate, media } = req.body;
    if (!title) return errorResponse(res, 400, 'Title is required');
    const uploaded = await uploadMediaIfNeeded(media);
    const doc = await Certification.create({ user: req.user._id, title, description, issuedBy, issueDate: issueDate ? new Date(issueDate) : undefined, media: uploaded });
    return res.status(201).json({ success: true, certification: doc });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create certification', error);
  }
};

export const deleteCertification = async (req, res) => {
  try {
    const cert = await Certification.findOne({ _id: req.params.id, user: req.user._id });
    if (!cert) return errorResponse(res, 404, 'Certification not found');
    await cert.deleteOne();
    if (cert.media?.publicId) {
      try { await cloudinary.uploader.destroy(cert.media.publicId, { resource_type: 'auto' }); } catch {}
    }
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete certification', error);
  }
};


