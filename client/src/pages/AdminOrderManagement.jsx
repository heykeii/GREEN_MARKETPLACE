import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FaBox, FaEye, FaEdit, FaCalendar, FaMoneyBillWave, FaUser, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const AdminOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      navigate('/login');
      return;
    }
    if (!user.isAdmin) {
      navigate('/');
      return;
    }
    
    const controller = new AbortController();
    fetchOrders(currentPage, token, controller.signal);
    
    return () => controller.abort();
  }, [navigate, currentPage, statusFilter]);

  const fetchOrders = async (page = 1, token, signal) => {
    if (!token) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/orders/admin/all?${params}`,
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
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/orders/admin/${orderId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        toast.success('Order status updated successfully');
        const controller = new AbortController();
        await fetchOrders(currentPage, token, controller.signal);
      } else {
        toast.error(res.data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Update order status error:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update order status');
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

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      `${order.customer?.firstName} ${order.customer?.lastName}`.toLowerCase().includes(searchLower) ||
      order.customer?.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-[#f5fdfb] via-[#e7f7f4] to-[#daf2ef] py-16 px-4 pt-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center py-20">
              <div className="text-2xl text-emerald-600">Loading orders...</div>
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
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-extrabold text-emerald-800 flex items-center gap-3">
              <FaBox className="text-emerald-600 text-3xl" /> Order Management
            </h1>
            <Link to="/admin">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Filters */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-md mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-emerald-800">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Search Orders</Label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Order number, customer name, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="status">Filter by Status</Label>
                  <select
                    id="status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">📦</div>
              <h2 className="text-2xl font-semibold text-gray-600 mb-4">No orders found</h2>
              <p className="text-gray-500">No orders match your current filters.</p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {filteredOrders.map((order) => (
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
                              <span className="flex items-center gap-1">
                                <FaUser />
                                {order.customer?.firstName} {order.customer?.lastName}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          <div className="flex gap-2">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                              className="text-sm p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="ready">Ready</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {order.items.slice(0, 4).map((item, idx) => (
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
                        {order.items.length > 4 && (
                          <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-500">
                              +{order.items.length - 4} more items
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">
                            <strong>Payment:</strong> {order.paymentMethod.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600">
                            <strong>Status:</strong> {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                          </span>
                          {order.shippingAddress && (
                            <span className="text-sm text-gray-600">
                              <strong>Ship to:</strong> {order.shippingAddress.city}, {order.shippingAddress.province}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`mailto:${order.customer?.email}`, '_blank')}
                          >
                            Contact Customer
                          </Button>
                        </div>
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

export default AdminOrderManagement;
