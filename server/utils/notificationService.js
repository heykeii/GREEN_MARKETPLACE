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

    const message = statusMessages[newStatus] || `Your order status has been updated to ${newStatus}`;
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
}
