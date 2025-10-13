import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FaBox, FaEye, FaTimes, FaCalendar, FaMoneyBillWave, FaExclamationTriangle, FaShoppingBag, FaClock, FaCheckCircle, FaTruck, FaGift, FaBan } from 'react-icons/fa';
import { toast } from '@/utils/toast';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import ReportButton from '@/components/ReportButton';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      navigate('/login');
      return;
    }
    
    const controller = new AbortController();
    fetchOrders(currentPage, token, controller.signal);
    
    return () => controller.abort();
  }, [navigate, currentPage]);

  const fetchOrders = async (page = 1, token, signal) => {
    if (!token) return;
    
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/orders/my-orders?page=${page}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal
        }
      );

      if (res.data.success) {
        setOrders(res.data.orders || []);
        setPagination(res.data.pagination || {});
      } else {
        setOrders([]);
        setPagination({});
        toast.error(res.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      if (error.name === 'CanceledError') return;
      
      console.error('Fetch orders error:', error);
      setOrders([]);
      setPagination({});
      toast.error(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
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
        const controller = new AbortController();
        await fetchOrders(currentPage, token, controller.signal);
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

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200',
        icon: FaClock,
        iconColor: 'text-amber-600',
        bgGradient: 'from-amber-50 to-orange-50'
      },
      confirmed: {
        color: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200',
        icon: FaCheckCircle,
        iconColor: 'text-blue-600',
        bgGradient: 'from-blue-50 to-indigo-50'
      },
      ready: {
        color: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200',
        icon: FaTruck,
        iconColor: 'text-purple-600',
        bgGradient: 'from-purple-50 to-pink-50'
      },
      completed: {
        color: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200',
        icon: FaGift,
        iconColor: 'text-emerald-600',
        bgGradient: 'from-emerald-50 to-green-50'
      },
      cancelled: {
        color: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200',
        icon: FaBan,
        iconColor: 'text-red-600',
        bgGradient: 'from-red-50 to-rose-50'
      }
    };
    return configs[status] || {
      color: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200',
      icon: FaBox,
      iconColor: 'text-gray-600',
      bgGradient: 'from-gray-50 to-slate-50'
    };
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4 pt-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <FaBox className="absolute inset-0 m-auto text-2xl text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-700 mb-2">Loading Your Orders</h2>
              <p className="text-slate-500">Please wait while we fetch your order history...</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 sm:py-8 px-3 sm:px-4 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 sm:mb-6 shadow-xl">
              <FaShoppingBag className="text-2xl sm:text-3xl text-white" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-3 sm:mb-4">
              My Orders
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-2">
              Track and manage all your orders in one place. From pending to delivered, stay updated on every step.
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                  <FaBox className="text-5xl text-slate-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm">0</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-slate-700 mb-4">No Orders Yet</h2>
              <p className="text-slate-500 mb-8 text-lg max-w-md mx-auto">
                Your order history is empty. Start shopping to see your orders appear here!
              </p>
              <Link to="/products">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <FaShoppingBag className="mr-3" />
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Orders Grid */}
              <div className="space-y-6 sm:space-y-8">
                {orders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <Card key={order._id} className={`group shadow-xl border-0 bg-gradient-to-r ${statusConfig.bgGradient} backdrop-blur-sm hover:shadow-2xl transition-all duration-500 overflow-hidden`}>
                      {/* Status Bar */}
                      <div className={`h-2 bg-gradient-to-r ${statusConfig.color.split(' ')[0]} ${statusConfig.color.split(' ')[1]}`} />
                      
                      <CardHeader className="pb-5 sm:pb-6 pt-6 sm:pt-8">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex items-start gap-4 sm:gap-6">
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-white to-gray-50 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white`}>
                              <StatusIcon className={`text-xl sm:text-2xl ${statusConfig.iconColor}`} />
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                              <div>
                                <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
                                  Order #{order.orderNumber}
                                </CardTitle>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-slate-600">
                                  <span className="flex items-center gap-2 bg-white/60 px-3 py-1 rounded-lg">
                                    <FaCalendar className="text-sm" />
                                    {new Date(order.createdAt).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                  <span className="flex items-center gap-2 bg-white/60 px-3 py-1 rounded-lg font-semibold">
                                    <FaMoneyBillWave className="text-sm" />
                                    ₱{order.totalAmount.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Badge className={`${statusConfig.color} px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold shadow-sm`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            
                            <div className="flex gap-2">
                              <Link to={`/orders/${order._id}`}>
                                <Button size="sm" className="bg-white/80 hover:bg-white text-slate-700 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                                  <FaEye className="mr-2" />
                                  View Details
                                </Button>
                              </Link>
                              
                              {(order.status === 'pending' || order.status === 'confirmed') && (
                                <Button
                                  size="sm"
                                  className="bg-white/80 hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 shadow-sm hover:shadow-md transition-all duration-300"
                                  onClick={() => cancelOrder(order._id)}
                                >
                                  <FaTimes className="mr-2" />
                                  Cancel
                                </Button>
                              )}
                              
                              {order.status === 'completed' && (
                                <ReportButton
                                  reportedItemType="order"
                                  reportedItemId={order._id}
                                  reportedItemName={`Order #${order.orderNumber}`}
                                  variant="outline"
                                  size="sm"
                                  className="bg-white/80 hover:bg-orange-50 text-orange-600 border border-orange-200 hover:border-orange-300 shadow-sm hover:shadow-md transition-all duration-300"
                                  onSuccess={() => {
                                    toast.success('Report submitted successfully!');
                                  }}
                                >
                                  <FaExclamationTriangle className="mr-2" />
                                  Report
                                </ReportButton>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        {/* Items Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="group/item bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-white/50">
                              <div className="flex items-start gap-4">
                                <div className="relative">
                                  <img
                                    src={item.product?.images?.[0]}
                                    alt={item.product?.name}
                                    className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-sm group-hover/item:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute -top-2 -right-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
                                    {item.quantity}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                  <h4 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">
                                    {item.product?.name}
                                  </h4>
                                  {item.variant?.name && (
                                    <p className="text-xs text-emerald-700">
                                      Variant: <span className="font-medium">{item.variant.name}</span>
                                    </p>
                                  )}
                                  <p className="text-xs text-slate-500">
                                    ₱{item.price.toFixed(2)} each
                                  </p>
                                  <p className="text-sm font-bold text-emerald-600">
                                    ₱{(item.price * item.quantity).toFixed(2)}
                                  </p>
                                  
                                  {order.status === 'completed' && (
                                    <div className="pt-2">
                                      <ReportButton
                                        reportedItemType="product"
                                        reportedItemId={item.product._id}
                                        reportedItemName={item.product.name}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 px-3 py-1.5 h-auto"
                                        onSuccess={() => {
                                          toast.success('Product report submitted successfully!');
                                        }}
                                      >
                                        <FaExclamationTriangle className="mr-1 text-xs" />
                                        Report
                                      </ReportButton>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {order.items.length > 3 && (
                            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/50 flex items-center justify-center">
                              <div className="text-center space-y-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto">
                                  <FaBox className="text-slate-500" />
                                </div>
                                <span className="text-sm font-medium text-slate-600">
                                  +{order.items.length - 3} more items
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Order Notes */}
                        {order.notes && (
                          <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-blue-600 text-sm">💬</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-blue-800 text-sm mb-1">Order Notes</h4>
                                <p className="text-blue-700 text-sm leading-relaxed">{order.notes}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Enhanced Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex flex-col items-center gap-6 mt-16">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        disabled={!pagination.hasPrev}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="bg-white/60 hover:bg-emerald-50 border-emerald-200 text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        ← Previous
                      </Button>
                      
                      <div className="flex gap-2">
                        {[...Array(Math.min(5, pagination.totalPages))].map((_, idx) => {
                          const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + idx;
                          if (pageNum > pagination.totalPages) return null;
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-10 h-10 rounded-xl shadow-sm transition-all duration-300 ${
                                currentPage === pageNum 
                                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg" 
                                  : "bg-white/60 hover:bg-emerald-50 border-emerald-200 text-emerald-700 hover:shadow-md"
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        disabled={!pagination.hasNext}
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="bg-white/60 hover:bg-emerald-50 border-emerald-200 text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        Next →
                      </Button>
                    </div>
                    
                    <div className="text-center mt-4">
                      <p className="text-sm text-slate-600">
                        Showing page {currentPage} of {pagination.totalPages} ({orders.length} orders)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OrdersPage;