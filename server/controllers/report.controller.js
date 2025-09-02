import Report from '../models/reports.model.js';
import User from '../models/user.model.js';
import Product from '../models/products.model.js';
import Review from '../models/reviews.model.js';
import Order from '../models/orders.model.js';
import { NotificationService } from '../utils/notificationService.js';

// Helper for error responses
const errorResponse = (res, status, message, error = null) => {
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined
  });
};

// Create a new report
export const createReport = async (req, res) => {
  try {
    const { reportedItemType, reportedItemId, reason, description, evidence } = req.body;
    const reporterId = req.user._id;

    // Validate reported item exists
    let reportedItem;
    switch (reportedItemType) {
      case 'product':
        reportedItem = await Product.findById(reportedItemId);
        break;
      case 'user':
        reportedItem = await User.findById(reportedItemId);
        break;
      case 'review':
        reportedItem = await Review.findById(reportedItemId);
        break;
      case 'order':
        reportedItem = await Order.findById(reportedItemId);
        break;
      default:
        return errorResponse(res, 400, 'Invalid reported item type');
    }

    if (!reportedItem) {
      return errorResponse(res, 404, 'Reported item not found');
    }

    // Check if user has already reported this item
    const existingReport = await Report.findOne({
      reporter: reporterId,
      'reportedItem.type': reportedItemType,
      'reportedItem.itemId': reportedItemId
    });

    if (existingReport) {
      return errorResponse(res, 400, 'You have already reported this item');
    }

    // Create the report
    const report = new Report({
      reporter: reporterId,
      reportedItem: {
        type: reportedItemType,
        itemId: reportedItemId
      },
      reason,
      description,
      evidence: evidence || []
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      report: {
        id: report._id,
        reportNumber: report.reportNumber,
        status: report.status,
        createdAt: report.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating report:', error);
    errorResponse(res, 500, 'Failed to create report', error);
  }
};

// Get user's own reports
export const getUserReports = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const filter = { reporter: userId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reportedItem.itemId', 'name title firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Report.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user reports:', error);
    errorResponse(res, 500, 'Failed to fetch reports', error);
  }
};

// Get a specific report by ID (for the reporter)
export const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user._id;

    const report = await Report.findOne({
      _id: reportId,
      reporter: userId
    }).populate('reportedItem.itemId', 'name title firstName lastName email');

    if (!report) {
      return errorResponse(res, 404, 'Report not found');
    }

    res.status(200).json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Error fetching report:', error);
    errorResponse(res, 500, 'Failed to fetch report', error);
  }
};

// ADMIN FUNCTIONS

// Get all reports (admin only)
export const getAllReports = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      reason, 
      reportedItemType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (reason) filter.reason = reason;
    if (reportedItemType) filter['reportedItem.type'] = reportedItemType;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'firstName lastName email')
        .populate('reportedItem.itemId', 'name title firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Report.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching all reports:', error);
    errorResponse(res, 500, 'Failed to fetch reports', error);
  }
};

// Get report statistics (admin only)
export const getReportStats = async (req, res) => {
  try {
    const [totalReports, pendingReports, investigatingReports, resolvedReports, dismissedReports] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'investigating' }),
      Report.countDocuments({ status: 'resolved' }),
      Report.countDocuments({ status: 'dismissed' })
    ]);

    // Get reports by reason
    const reportsByReason = await Report.aggregate([
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get reports by type
    const reportsByType = await Report.aggregate([
      {
        $group: {
          _id: '$reportedItem.type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total: totalReports,
        pending: pendingReports,
        investigating: investigatingReports,
        resolved: resolvedReports,
        dismissed: dismissedReports
      },
      byReason: reportsByReason,
      byType: reportsByType
    });

  } catch (error) {
    console.error('Error fetching report stats:', error);
    errorResponse(res, 500, 'Failed to fetch report statistics', error);
  }
};

// Update report status (admin only)
export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminResponse } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return errorResponse(res, 404, 'Report not found');
    }

    const oldStatus = report.status;
    report.status = status;
    if (adminResponse) {
      report.adminResponse = adminResponse;
    }

    await report.save();

    // Notify user about report status update
    try {
      await NotificationService.notifyReportStatusUpdate(
        report.reporter,
        report,
        status
      );
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the status update if notification fails
    }

    res.status(200).json({
      success: true,
      message: 'Report status updated successfully',
      report
    });

  } catch (error) {
    console.error('Error updating report status:', error);
    errorResponse(res, 500, 'Failed to update report status', error);
  }
};

// Resolve report with action (admin only)
export const resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, notes } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return errorResponse(res, 404, 'Report not found');
    }

    // Update report resolution
    report.status = 'resolved';
    report.resolution = {
      action,
      notes
    };

    // Take action based on resolution
    switch (action) {
      case 'item_removed':
        await handleItemRemoval(report);
        break;
      case 'user_suspended':
        await handleUserSuspension(report);
        break;
      case 'user_banned':
        await handleUserBan(report);
        break;
      case 'refund_issued':
        await handleRefund(report);
        break;
    }

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report resolved successfully',
      report
    });

  } catch (error) {
    console.error('Error resolving report:', error);
    errorResponse(res, 500, 'Failed to resolve report', error);
  }
};

// Helper functions for report resolution
const handleItemRemoval = async (report) => {
  const { type, itemId } = report.reportedItem;
  
  switch (type) {
    case 'product':
      await Product.findByIdAndUpdate(itemId, { isActive: false });
      break;
    case 'review':
      await Review.findByIdAndUpdate(itemId, { isVisible: false });
      break;
  }
};

const handleUserSuspension = async (report) => {
  const { type, itemId } = report.reportedItem;
  
  if (type === 'user') {
    await User.findByIdAndUpdate(itemId, { 
      isSuspended: true,
      suspendedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  }
};

const handleUserBan = async (report) => {
  const { type, itemId } = report.reportedItem;
  
  if (type === 'user') {
    await User.findByIdAndUpdate(itemId, { 
      isBanned: true,
      isActive: false
    });
  }
};

const handleRefund = async (report) => {
  const { type, itemId } = report.reportedItem;
  
  if (type === 'order') {
    await Order.findByIdAndUpdate(itemId, { 
      status: 'refunded',
      refundedAt: new Date()
    });
  }
};
