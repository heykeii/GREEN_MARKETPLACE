import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ReviewForm from '@/components/ReviewForm';
import ReportButton from '@/components/ReportButton';
import { 
  FaBox, 
  FaCalendar, 
  FaMoneyBillWave, 
  FaUser, 
  FaEnvelope, 
  FaCreditCard,
  FaStickyNote,
  FaTimes,
  FaStar,
  FaMapMarkerAlt,
  FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from '@/utils/toast';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';

const OrderDetailsPage = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, productId: null, productName: '' });
  
  const { orderId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      navigate('/login');
      return;
    }
    
    const controller = new AbortController();
    fetchOrder(token, controller.signal);
    
    return () => controller.abort();
  }, [orderId, navigate]);

  const fetchOrder = async (token, signal) => {
    if (!token) return;
    
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal
        }
      );

      if (res.data.success) {
        setOrder(res.data.order);
      } else {
        toast.error(res.data.message || 'Failed to fetch order details');
        navigate('/orders');
      }
    } catch (error) {
      if (error.name === 'CanceledError') return;
      
      console.error('Fetch order error:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch order details');
        navigate('/orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/orders/${orderId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        toast.success('Order cancelled successfully');
        setOrder(res.data.order);
      } else {
        toast.error(res.data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to cancel order');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      ready: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'ready': return '📦';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const getStatusMessage = (status) => {
    const messages = {
      pending: 'Your order is being processed',
      confirmed: 'Your order has been confirmed and is being prepared',
      ready: 'Your order is ready for pickup/delivery',
      completed: 'Your order has been completed',
      cancelled: 'This order has been cancelled'
    };
    return messages[status] || 'Order status unknown';
  };

  const canCancelOrder = () => {
    return order && (order.status === 'pending' || order.status === 'confirmed');
  };

  const canReviewItems = () => {
    return order && order.status === 'completed';
  };

  const openReviewModal = (productId, productName) => {
    setReviewModal({ isOpen: true, productId, productName });
  };

  const closeReviewModal = () => {
    setReviewModal({ isOpen: false, productId: null, productName: '' });
  };

  const handleReviewSubmitted = (review) => {
    toast.success('Review submitted successfully!');
    closeReviewModal();
    
    // Store a flag to indicate a new review was submitted
    // This can be used by other components to refresh their data
    localStorage.setItem('newReviewSubmitted', Date.now().toString());
    
    // Optionally refresh the order data to show updated review status
    // fetchOrder();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-[#f5fdfb] via-[#e7f7f4] to-[#daf2ef] py-16 px-4 pt-24">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-center items-center py-20">
              <div className="text-2xl text-emerald-600">Loading order details...</div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-[#f5fdfb] via-[#e7f7f4] to-[#daf2ef] py-16 px-4 pt-24">
          <div className="max-w-6xl mx-auto text-center py-20">
            <div className="text-6xl mb-6">❓</div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">Order not found</h2>
            <Link to="/orders">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Back to Orders
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#f5fdfb] via-[#e7f7f4] to-[#daf2ef] py-16 px-4 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-extrabold text-emerald-800 flex items-center gap-3">
                <FaBox className="text-emerald-600 text-3xl" />
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-600 mt-2">
                Order placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/orders">
                <Button variant="outline">Back to Orders</Button>
              </Link>
              {canCancelOrder() && (
                <Button
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-100"
                  onClick={cancelOrder}
                >
                  <FaTimes className="mr-2" />
                  Cancel Order
                </Button>
              )}
              {order.status === 'completed' && (
                <ReportButton
                  reportedItemType="order"
                  reportedItemId={order._id}
                  reportedItemName={`Order #${order.orderNumber}`}
                  variant="outline"
                  className="text-orange-600 border-orange-300 hover:bg-orange-100"
                  onSuccess={() => {
                    toast.success('Order report submitted successfully!');
                  }}
                >
                  <FaExclamationTriangle className="mr-2" />
                  Report Order
                </ReportButton>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Order Items */}
            <div className="md:col-span-2 space-y-6">
              {/* Status */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl text-emerald-800 flex items-center gap-3">
                    {getStatusIcon(order.status)}
                    Order Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <p className="text-gray-600 mt-2">{getStatusMessage(order.status)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl text-emerald-800">Order Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <img
                        src={item.product?.images?.[0]}
                        alt={item.product?.name}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-emerald-800 text-lg">
                          {item.product?.name}
                        </h3>
                        <div className="text-gray-600 mt-1">
                          <p>Quantity: {item.quantity}</p>
                          <p>Price: ₱{item.price.toFixed(2)} each</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-700 text-lg">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </p>
                        <div className="flex flex-col gap-2 mt-2">
                          {canReviewItems() && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openReviewModal(item.product._id, item.product.name)}
                            >
                              <FaStar className="mr-1" />
                              Review
                            </Button>
                          )}
                          {order.status === 'completed' && (
                            <ReportButton
                              reportedItemType="product"
                              reportedItemId={item.product._id}
                              reportedItemName={item.product.name}
                              variant="outline"
                              size="sm"
                              className="text-orange-600 border-orange-300 hover:bg-orange-100"
                              onSuccess={() => {
                                toast.success('Product report submitted successfully!');
                              }}
                            >
                              <FaExclamationTriangle className="mr-1" />
                              Report Product
                            </ReportButton>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Notes */}
              {order.notes && (
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-xl text-emerald-800 flex items-center gap-2">
                      <FaStickyNote className="text-emerald-600" />
                      Order Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">{order.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              {/* Customer Info */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl text-emerald-800 flex items-center gap-2">
                    <FaUser className="text-emerald-600" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-gray-500" />
                    <span>{order.customer?.firstName} {order.customer?.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-gray-500" />
                    <span>{order.customer?.email}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-xl text-emerald-800 flex items-center gap-2">
                      <FaMapMarkerAlt className="text-emerald-600" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <strong>Name:</strong> {order.shippingAddress.fullName}
                    </div>
                    <div>
                      <strong>Phone:</strong> {order.shippingAddress.phone}
                    </div>
                    <div>
                      <strong>Address:</strong> {order.shippingAddress.address}
                    </div>
                    <div>
                      <strong>City:</strong> {order.shippingAddress.city}
                    </div>
                    <div>
                      <strong>Province:</strong> {order.shippingAddress.province}
                    </div>
                    <div>
                      <strong>ZIP Code:</strong> {order.shippingAddress.zipCode}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Info */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl text-emerald-800 flex items-center gap-2">
                    <FaCreditCard className="text-emerald-600" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="capitalize">{order.paymentMethod}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Order Total */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl text-emerald-800 flex items-center gap-2">
                    <FaMoneyBillWave className="text-emerald-600" />
                    Order Total
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₱{order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping:</span>
                    <span>Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xl font-bold text-emerald-800">
                    <span>Total:</span>
                    <span>₱{order.totalAmount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Order Timeline */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xl text-emerald-800 flex items-center gap-2">
                    <FaCalendar className="text-emerald-600" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                      <div>
                        <p className="font-medium">Order Placed</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {order.status !== 'pending' && (
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                        <div>
                          <p className="font-medium">Status Updated</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-emerald-800">
                  Review: {reviewModal.productName}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeReviewModal}
                  className="hover:bg-gray-100"
                >
                  <FaTimes />
                </Button>
              </div>
              
              <ReviewForm
                productId={reviewModal.productId}
                orderId={orderId}
                onReviewSubmitted={handleReviewSubmitted}
                onCancel={closeReviewModal}
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default OrderDetailsPage;
