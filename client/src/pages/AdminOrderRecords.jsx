import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/AdminLayout';
import { toast } from '@/utils/toast';
import { 
  FaReceipt, 
  FaSpinner, 
  FaShoppingBag, 
  FaUser, 
  FaMoneyBillWave, 
  FaDollarSign,
  FaBox,
  FaChevronLeft,
  FaChevronRight,
  FaCalendar,
  FaMapMarkerAlt,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaClock
} from 'react-icons/fa';

const AdminOrderRecords = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [commissionRate, setCommissionRate] = useState(5);
  const [totalCommission, setTotalCommission] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrderRecords();
  }, [currentPage]);

  const fetchOrderRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/order-records?page=${currentPage}&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
        setCommissionRate(response.data.commissionRate);
        setTotalCommission(response.data.totalCommissionAllOrders);
      }
    } catch (error) {
      console.error('Error fetching order records:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch order records');
      
      if (error.response?.status === 401) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const markCommissionPaid = async (orderId) => {
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/order-records/${orderId}/commission-paid`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Commission marked as paid');
      // refresh list
      await fetchOrderRecords();
      setExpandedOrder(orderId);
    } catch (error) {
      console.error('Failed to mark commission paid', error);
      toast.error(error.response?.data?.message || 'Failed to mark as paid');
    }
  };

  const getReceiptStatusBadge = (receiptStatus) => {
    const statusConfig = {
      not_uploaded: { 
        color: 'bg-gray-100 text-gray-700', 
        text: 'No Receipt', 
        icon: FaClock 
      },
      uploaded: { 
        color: 'bg-blue-100 text-blue-700', 
        text: 'Receipt Uploaded', 
        icon: FaCheckCircle 
      },
      verified: { 
        color: 'bg-green-100 text-green-700', 
        text: 'Verified', 
        icon: FaCheckCircle 
      },
      rejected: { 
        color: 'bg-red-100 text-red-700', 
        text: 'Rejected', 
        icon: FaTimesCircle 
      }
    };

    const config = statusConfig[receiptStatus] || statusConfig.not_uploaded;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${config.color}`}>
        <IconComponent className="text-xs" />
        {config.text}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FaReceipt className="text-emerald-600" />
              Order Records & Commission
            </h1>
            <p className="text-gray-600 mt-1">Track completed orders and admin commission earnings</p>
          </div>
        </div>

        {/* Commission Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Total Commission</p>
                  <p className="text-3xl font-bold text-white mt-1">₱{totalCommission.toLocaleString()}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <FaDollarSign className="text-white text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Completed Orders</p>
                  <p className="text-3xl font-bold text-white mt-1">{pagination.totalOrders || 0}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <FaShoppingBag className="text-white text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Commission Rate</p>
                  <p className="text-3xl font-bold text-white mt-1">₱{commissionRate}</p>
                  <p className="text-purple-100 text-xs mt-1">per item</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                  <FaMoneyBillWave className="text-white text-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <FaReceipt className="text-emerald-600" />
              Order Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <FaSpinner className="animate-spin h-8 w-8 text-emerald-600" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <FaReceipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No completed orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Order Header */}
                    <div className="bg-gray-50 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 cursor-pointer" onClick={() => toggleOrderExpansion(order._id)}>
                        <div>
                          <p className="text-xs text-gray-500">Order Number</p>
                          <p className="font-semibold text-emerald-600">{order.orderNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Customer</p>
                          <p className="font-semibold truncate">
                            {(order.customer?.firstName || 'Deleted')} {(order.customer?.lastName || 'User')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Seller(s)</p>
                          <p className="font-semibold truncate">
                            {order.sellers.length === 1 
                              ? `${order.sellers[0].firstName} ${order.sellers[0].lastName}`
                              : `${order.sellers.length} sellers`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Order Amount</p>
                          <p className="font-semibold">₱{order.totalOrderAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Admin Commission</p>
                          <div className="flex flex-col gap-1">
                            <p className="font-bold text-emerald-600">₱{order.adminCommission.toLocaleString()}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {getReceiptStatusBadge(order?.commission?.receiptStatus)}
                              {order?.commission?.isPaid ? (
                                <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">Paid</span>
                              ) : order?.commission?.receiptStatus === 'uploaded' ? (
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); markCommissionPaid(order._id); }}>Mark as Paid</Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Order Details */}
                    {expandedOrder === order._id && (
                      <div className="p-6 bg-white border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {/* Customer Info */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <FaUser className="text-blue-600" />
                              Customer Information
                            </h4>
                            <div className="flex items-center gap-3">
                              {order.customer?.avatar ? (
                                <img
                                  src={order.customer.avatar}
                                  alt={order.customer?.firstName || 'Customer'}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 font-bold">
                                    {(order.customer?.firstName?.charAt(0) || 'D')}{(order.customer?.lastName?.charAt(0) || 'U')}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="font-semibold">{order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Deleted user'}</p>
                                <p className="text-sm text-gray-600">{order.customer?.email || 'Deleted account'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Order Info */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <FaCalendar className="text-purple-600" />
                              Order Details
                            </h4>
                            <div className="space-y-1">
                              <p className="text-sm"><span className="text-gray-600">Date:</span> <span className="font-medium">{formatDate(order.createdAt)}</span></p>
                              <p className="text-sm"><span className="text-gray-600">Status:</span> <span className="font-medium capitalize">{order.status}</span></p>
                              <p className="text-sm"><span className="text-gray-600">Payment:</span> <span className="font-medium capitalize">{order.paymentMethod}</span></p>
                            </div>
                          </div>
                        </div>

                        {/* Sellers */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FaUser className="text-emerald-600" />
                            Seller Information
                          </h4>
                          <div className="flex flex-wrap gap-3">
                            {order.sellers.map((seller) => (
                              <div key={seller._id} className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg">
                                {seller.avatar ? (
                                  <img
                                    src={seller.avatar}
                                    alt={seller.firstName}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <span className="text-emerald-600 font-bold text-xs">
                                      {seller.firstName?.charAt(0)}{seller.lastName?.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-semibold">{seller.firstName} {seller.lastName}</p>
                                  <p className="text-xs text-gray-600">{seller.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Products */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FaBox className="text-orange-600" />
                            Products ({order.items.length})
                          </h4>
                          <div className="space-y-3">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                                {item.product?.images?.[0] && (
                                  <img
                                    src={item.product.images[0]}
                                    alt={item.product.name}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="font-semibold">{item.product?.name || 'Product'}</p>
                                  <p className="text-sm text-gray-600">
                                    Quantity: <span className="font-medium">{item.quantity}</span> × 
                                    ₱{item.price.toLocaleString()} = ₱{item.subtotal.toLocaleString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Commission</p>
                                  <p className="font-semibold text-emerald-600">₱{(item.quantity * commissionRate).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-red-600" />
                            Shipping Address
                          </h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-semibold">{order.shippingAddress.fullName}</p>
                            <p className="text-sm text-gray-600">{order.shippingAddress.phone}</p>
                            <p className="text-sm text-gray-600">
                              {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zipCode}
                            </p>
                          </div>
                        </div>

                        {/* Commission Receipt */}
                        {order?.commission?.receipt && (
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <FaReceipt className="text-purple-600" />
                              Commission Receipt
                            </h4>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-start gap-4">
                                <div className="border rounded-lg p-2 bg-white">
                                  <img 
                                    src={order.commission.receipt} 
                                    alt="Commission Receipt" 
                                    className="w-32 h-32 object-cover rounded cursor-pointer hover:opacity-80 transition"
                                    onClick={() => window.open(order.commission.receipt, '_blank')}
                                  />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">Status:</span>
                                    {getReceiptStatusBadge(order.commission.receiptStatus)}
                                  </div>
                                  {order.commission.receiptUploadedAt && (
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Uploaded:</span>{' '}
                                      {formatDate(order.commission.receiptUploadedAt)}
                                    </p>
                                  )}
                                  {order.commission.receiptRejectionReason && (
                                    <div className="bg-red-50 border border-red-200 rounded p-2">
                                      <p className="text-xs text-red-700">
                                        <span className="font-semibold">Rejection Reason:</span>{' '}
                                        {order.commission.receiptRejectionReason}
                                      </p>
                                    </div>
                                  )}
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.open(order.commission.receipt, '_blank')}
                                    className="mt-2"
                                  >
                                    <FaEye className="mr-2" />
                                    View Full Size
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Summary */}
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Total Quantity:</span>
                            <span className="font-semibold">{order.totalQuantity} items</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Order Amount:</span>
                            <span className="font-semibold">₱{order.totalOrderAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Shipping Fee:</span>
                            <span className="font-semibold">₱{order.shippingFee.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-bold text-lg">Admin Commission:</span>
                            <span className="font-bold text-lg text-emerald-600">₱{order.adminCommission.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-right">
                            ({order.totalQuantity} items × ₱{commissionRate})
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    <FaChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                    <FaChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderRecords;

