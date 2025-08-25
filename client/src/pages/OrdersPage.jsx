import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FaBox, FaEye, FaTimes, FaCalendar, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

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

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-[#f5fdfb] via-[#e7f7f4] to-[#daf2ef] py-16 px-4 pt-24">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-center items-center py-20">
              <div className="text-2xl text-emerald-600">Loading your orders...</div>
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
      <div className="min-h-screen bg-gradient-to-br from-[#f5fdfb] via-[#e7f7f4] to-[#daf2ef] py-16 px-4 pt-24">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold text-emerald-800 mb-10 flex items-center gap-3">
            <FaBox className="text-emerald-600 text-3xl" /> My Orders
          </h1>

          {orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">📦</div>
              <h2 className="text-2xl font-semibold text-gray-600 mb-4">No orders yet</h2>
              <p className="text-gray-500 mb-8">Start shopping to see your orders here!</p>
              <Link to="/products">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {orders.map((order) => (
                  <Card key={order._id} className="shadow-xl border-0 bg-white/90 backdrop-blur-md">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">
                            {getStatusIcon(order.status)}
                          </div>
                          <div>
                            <CardTitle className="text-xl text-emerald-800">
                              Order #{order.orderNumber}
                            </CardTitle>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <FaCalendar />
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <FaMoneyBillWave />
                                ₱{order.totalAmount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          <Link to={`/orders/${order._id}`}>
                            <Button size="sm" variant="outline">
                              <FaEye className="mr-2" />
                              View
                            </Button>
                          </Link>
                          {(order.status === 'pending' || order.status === 'confirmed') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-100"
                              onClick={() => cancelOrder(order._id)}
                            >
                              <FaTimes className="mr-2" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <img
                              src={item.product?.images?.[0]}
                              alt={item.product?.name}
                              className="w-12 h-12 object-cover rounded-lg border"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-emerald-800 truncate">
                                {item.product?.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Qty: {item.quantity} × ₱{item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-500">
                              +{order.items.length - 3} more items
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {order.notes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Notes:</strong> {order.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    disabled={!pagination.hasPrev}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex gap-1">
                    {[...Array(pagination.totalPages)].map((_, idx) => (
                      <Button
                        key={idx + 1}
                        variant={currentPage === idx + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(idx + 1)}
                        className={currentPage === idx + 1 ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                      >
                        {idx + 1}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    disabled={!pagination.hasNext}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </Button>
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
