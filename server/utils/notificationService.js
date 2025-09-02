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
}
