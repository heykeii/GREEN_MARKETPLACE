import express from 'express';
import {
  createReport,
  getUserReports,
  getReportById,
  getAllReports,
  getReportStats,
  updateReportStatus,
  resolveReport
} from '../controllers/report.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// User routes (require authentication)
router.use(protect);

// Create a new report
router.post('/create', createReport);

// Get user's own reports
router.get('/my-reports', getUserReports);

// Get a specific report by ID (for the reporter)
router.get('/:reportId', getReportById);

// Admin routes (require admin privileges)
router.use(isAdmin);

// Get all reports with filtering and pagination
router.get('/admin/all', getAllReports);

// Get report statistics
router.get('/admin/stats', getReportStats);

// Update report status
router.patch('/admin/:reportId/status', updateReportStatus);

// Resolve report with action
router.post('/admin/:reportId/resolve', resolveReport);

export default router;
