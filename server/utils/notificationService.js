import { createNotification } from '../controllers/notification.controller.js';

// Notification service for creating notifications based on different events
export class NotificationService {
  // User notifications
  static async notifyOrderStatusUpdate(userId, order, newStatus, oldStatus) {
    const statusMessages = {
      'confirmed': 'Your order has been confirmed and is being prepared',
      'ready': 'Your order is ready for pickup/delivery',
      'completed': 'Your order has been completed successfully',
      'cancelled': 'Your order has been cancelled'
    };

    const statusTypes = {
      'confirmed': 'order_confirmed',
      'ready': 'order_ready',
      'completed': 'order_completed',
      'cancelled': 'order_cancelled'
    };

    let message = statusMessages[newStatus] || `Your order status has been updated to ${newStatus}`;
    if (newStatus === 'cancelled' && order?.cancellation?.reason) {
      message = `Your order has been cancelled. Reason: ${order.cancellation.reason}`;
    }
    const type = statusTypes[newStatus] || 'order_status_updated';

    await createNotification(
      userId,
      type,
      `Order #${order.orderNumber} Status Updated`,
      message,
      { orderId: order._id },
      `/orders/${order._id}`,
      newStatus === 'cancelled' ? 'high' : 'medium'
    );
  }

  // Product status notifications to seller
  static async notifyProductApproved(sellerId, product) {
    await createNotification(
      sellerId,
      'product_approved',
      `Product Approved: ${product.name}`,
      'Your product has been approved and is now ready for listing.',
      { productId: product._id },
      `/seller/products`,
      'medium'
    );
  }

  static async notifyProductRejected(sellerId, product, message) {
    await createNotification(
      sellerId,
      'product_rejected',
      `Product Rejected: ${product.name}`,
      message || 'Your product has been rejected by the admin. Please review and resubmit.',
      { productId: product._id },
      `/seller/products`,
      'high'
    );
  }

  static async notifyProductStatusUpdated(sellerId, product, newStatus) {
    await createNotification(
      sellerId,
      'product_status_updated',
      `Product ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      `Your product "${product.name}" status changed to ${newStatus}.`,
      { productId: product._id },
      `/seller/products`,
      newStatus === 'rejected' ? 'high' : 'medium'
    );
  }

  static async notifyOrderCancelledBySeller(userId, order) {
    await createNotification(
      userId,
      'order_cancelled',
      `Order #${order.orderNumber} Cancelled`,
      'Your order has been cancelled by the seller',
      { orderId: order._id },
      `/orders/${order._id}`,
      'high'
    );
  }

  // Seller notifications
  static async notifyNewOrder(sellerId, order) {
    await createNotification(
      sellerId,
      'new_order',
      `New Order #${order.orderNumber}`,
      `You have received a new order for ₱${order.totalAmount.toFixed(2)}`,
      { orderId: order._id },
      `/seller/orders`,
      'high'
    );
  }

  static async notifyNewReview(sellerId, review, product) {
    await createNotification(
      sellerId,
      'new_review',
      `New Review for ${product.name}`,
      `You received a ${review.rating}-star review: "${review.comment.substring(0, 50)}${review.comment.length > 50 ? '...' : ''}"`,
      { reviewId: review._id, productId: product._id },
      `/products/${product._id}`,
      'medium'
    );
  }

  static async notifyOrderCancelledByCustomer(sellerId, order) {
    await createNotification(
      sellerId,
      'order_cancelled_by_customer',
      `Order #${order.orderNumber} Cancelled by Customer`,
      'A customer has cancelled their order',
      { orderId: order._id },
      `/seller/orders`,
      'medium'
    );
  }

  // Report notifications
  static async notifyReportStatusUpdate(userId, report, newStatus) {
    const statusMessages = {
      'investigating': 'Your report is now under investigation',
      'resolved': 'Your report has been resolved',
      'dismissed': 'Your report has been dismissed'
    };

    const message = statusMessages[newStatus] || `Your report status has been updated to ${newStatus}`;

    await createNotification(
      userId,
      'report_status_updated',
      `Report #${report.reportNumber} Status Updated`,
      message,
      { reportId: report._id },
      `/my-reports`,
      'medium'
    );
  }

  // System notifications
  static async notifySystemMessage(userId, title, message, priority = 'medium') {
    await createNotification(
      userId,
      'system_message',
      title,
      message,
      {},
      null,
      priority
    );
  }

  // Social graph: someone followed you
  static async notifyUserFollowed(recipientUserId, actorUser) {
    await createNotification(
      recipientUserId,
      'user_followed_you',
      `${actorUser.firstName || 'Someone'} followed you`,
      `${actorUser.firstName || 'Someone'} ${actorUser.lastName || ''} started following you`,
      { actorId: actorUser._id },
      `/profile/${actorUser._id}`,
      'low'
    );
  }

  // Campaign: liked
  static async notifyCampaignLiked(creatorUserId, campaign, actorUser) {
    await createNotification(
      creatorUserId,
      'campaign_liked',
      `${actorUser.firstName || 'Someone'} liked your campaign`,
      `${actorUser.firstName || 'Someone'} liked "${campaign.title}"`,
      { campaignId: campaign._id, actorId: actorUser._id },
      `/campaigns/${campaign._id}`,
      'low'
    );
  }

  // Campaign: commented
  static async notifyCampaignCommented(creatorUserId, campaign, actorUser, commentText) {
    await createNotification(
      creatorUserId,
      'campaign_commented',
      `${actorUser.firstName || 'Someone'} commented on your campaign`,
      `${actorUser.firstName || 'Someone'}: "${String(commentText || '').slice(0, 80)}${String(commentText || '').length > 80 ? '...' : ''}"`,
      { campaignId: campaign._id, actorId: actorUser._id },
      `/campaigns/${campaign._id}`,
      'medium'
    );
  }

  // Campaign: joined
  static async notifyCampaignJoined(creatorUserId, campaign, actorUser) {
    await createNotification(
      creatorUserId,
      'campaign_joined',
      `${actorUser.firstName || 'Someone'} joined your campaign`,
      `${actorUser.firstName || 'Someone'} joined "${campaign.title}"`,
      { campaignId: campaign._id, actorId: actorUser._id },
      `/campaigns/${campaign._id}`,
      'medium'
    );
  }

  // Review: seller replied to your review
  static async notifyReviewReply(reviewerUserId, product, sellerUser) {
    await createNotification(
      reviewerUserId,
      'review_reply',
      `${sellerUser.firstName || 'Seller'} replied to your review`,
      `You have a new reply regarding ${product.name}`,
      { productId: product._id, actorId: sellerUser._id },
      `/product/${product._id}`,
      'medium'
    );
  }

  // GCash Receipt Notifications
  static async notifyReceiptVerified(customerId, order, referenceNumber) {
    await createNotification(
      customerId,
      'receipt_verified',
      `Payment Verified - Order #${order.orderNumber}`,
      `Your GCash payment (Ref: ${referenceNumber}) has been verified and confirmed. Your order is now being processed.`,
      { orderId: order._id, referenceNumber },
      `/orders/${order._id}`,
      'high'
    );
  }

  static async notifyReceiptRejected(customerId, order, rejectionReason) {
    await createNotification(
      customerId,
      'receipt_rejected',
      `Payment Verification Failed - Order #${order.orderNumber}`,
      `Your GCash receipt could not be verified: ${rejectionReason}. Please upload a new receipt with correct information.`,
      { orderId: order._id },
      `/orders/${order._id}`,
      'high'
    );
  }

  static async notifyPaymentReceived(sellerId, order, amount) {
    await createNotification(
      sellerId,
      'payment_received',
      `Payment Received - Order #${order.orderNumber}`,
      `GCash payment of ₱${amount.toFixed(2)} has been verified for your order. You can now process the order.`,
      { orderId: order._id },
      `/seller/orders`,
      'high'
    );
  }

  // Admin review notifications
  static async notifyReceiptNeedsReview(adminId, receipt, order) {
    await createNotification(
      adminId,
      'receipt_needs_review',
      `GCash Receipt Needs Review - Order #${order.orderNumber}`,
      `A GCash payment receipt requires manual review for order verification.`,
      { receiptId: receipt._id, orderId: order._id },
      `/admin/receipts/${receipt._id}`,
      'medium'
    );
  }

  // Badge notifications
  static async notifyBadgeEarned(userId, badges) {
    if (!badges || badges.length === 0) return;

    const badgeNames = badges.map(badge => badge.name).join(', ');
    const badgeCount = badges.length;
    
    await createNotification(
      userId,
      'badge_earned',
      `🏆 New Badge${badgeCount > 1 ? 's' : ''} Earned!`,
      `Congratulations! You've earned ${badgeCount > 1 ? 'badges' : 'a badge'}: ${badgeNames}`,
      { badges: badges },
      `/profile`,
      'high'
    );
  }

  // Campaign verification notifications
  static async notifyCampaignApproved(creatorUserId, campaign) {
    await createNotification(
      creatorUserId,
      'campaign_approved',
      'Campaign Approved! 🎉',
      `Your campaign "${campaign.title}" has been approved and is now live.`,
      { campaignId: campaign._id },
      `/campaigns/${campaign._id}`,
      'high'
    );
  }

  static async notifyCampaignRejected(creatorUserId, campaign, reason) {
    await createNotification(
      creatorUserId,
      'campaign_rejected',
      'Campaign Needs Review ⚠️',
      `Your campaign "${campaign.title}" was not approved${reason ? `: ${reason}` : ''}. Please review and update your submission.`,
      { campaignId: campaign._id },
      `/campaigns/${campaign._id}`,
      'high'
    );
  }
}
