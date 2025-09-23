import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { listMyCertifications, createCertification, deleteCertification } from '../controllers/certification.controller.js';

const router = express.Router();

router.use(protect);
router.get('/me', listMyCertifications);
router.post('/', createCertification);
router.delete('/:id', deleteCertification);

export default router;


