import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { listMyCertifications, createCertification, deleteCertification, listUserCertificationsPublic } from '../controllers/certification.controller.js';

const router = express.Router();

// Public endpoint: get certifications for a user profile
router.get('/user/:userId', listUserCertificationsPublic);

router.use(protect);
router.get('/me', listMyCertifications);
router.post('/', createCertification);
router.delete('/:id', deleteCertification);

export default router;


