import React, { useState, useEffect } from 'react';
import { toast } from '@/utils/toast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import ReportButton from '../components/ReportButton';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [orderedProducts, setOrderedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchReports();
    fetchOrderedProducts();
  }, [filters]);

  const fetchReports = async () => {
    try {
      // Filter out 'all' values to avoid sending them to the API
      const queryFilters = { ...filters };
      if (queryFilters.status === 'all') delete queryFilters.status;
      
      const queryParams = new URLSearchParams(queryFilters).toString();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/reports/my-reports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setReports(data.reports);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderedProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // Extract unique products from orders
        const products = [];
        const seenProducts = new Set();
        
        data.orders.forEach(order => {
          order.items.forEach(item => {
            if (!seenProducts.has(item.product._id)) {
              seenProducts.add(item.product._id);
              products.push({
                ...item.product,
                orderId: order._id,
                orderDate: order.createdAt
              });
            }
          });
        });
        
        setOrderedProducts(products);
      }
    } catch (error) {
      console.error('Error fetching ordered products:', error);
      toast.error('Failed to fetch ordered products');
    } finally {
      setProductsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReasonLabel = (reason) => {
    const reasonMap = {
      'inappropriate_content': 'Inappropriate Content',
      'fake_product': 'Fake Product',
      'poor_quality': 'Poor Quality',
      'wrong_item': 'Wrong Item',
      'scam': 'Scam',
      'harassment': 'Harassment',
      'spam': 'Spam',
      'copyright_violation': 'Copyright Violation',
      'fake_review': 'Fake Review',
      'other': 'Other'
    };
    return reasonMap[reason] || reason;
  };

  const getItemTypeLabel = (type) => {
    const typeMap = {
      'product': 'Product',
      'user': 'User',
      'review': 'Review',
      'order': 'Order'
    };
    return typeMap[type] || type;
  };

  const getActionLabel = (action) => {
    const actionMap = {
      'warning_issued': 'Warning Issued',
      'item_removed': 'Item Removed',
      'user_suspended': 'User Suspended',
      'user_banned': 'User Banned',
      'refund_issued': 'Refund Issued',
      'no_action': 'No Action',
      'other': 'Other'
    };
    return actionMap[action] || action;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Navbar/>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reports & Complaints</h1>
        <p className="text-gray-600">Track your reports and report products you've ordered</p>
      </div>

      <Tabs defaultValue="my-reports" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-reports">My Reports</TabsTrigger>
          <TabsTrigger value="report-product">Report Product</TabsTrigger>
        </TabsList>

        <TabsContent value="my-reports" className="space-y-6">
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => setFilters({ status: 'all', page: 1, limit: 10 })}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <p className="text-lg mb-2">No reports found</p>
              <p className="text-sm">You haven't submitted any reports yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report._id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      <Badge variant="outline">
                        {getItemTypeLabel(report.reportedItem.type)}
                      </Badge>
                      <span className="text-sm text-gray-500">#{report.reportNumber}</span>
                    </div>
                    <h3 className="font-semibold">
                      Reported: {report.reportedItem.itemId?.name || report.reportedItem.itemId?.title || report.reportedItem.itemId?.firstName || 'Unknown'}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-1">Reason: {getReasonLabel(report.reason)}</p>
                  <p className="text-sm text-gray-700">{report.description}</p>
                </div>

                {report.evidence && report.evidence.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Evidence:</p>
                    <div className="flex gap-2">
                      {report.evidence.map((url, index) => (
                        <img key={index} src={url} alt={`Evidence ${index + 1}`} className="w-16 h-16 object-cover rounded border" />
                      ))}
                    </div>
                  </div>
                )}

                {report.adminResponse && (
                  <div className="mb-4 p-3 bg-blue-50 rounded">
                    <p className="text-sm font-medium mb-1">Admin Response:</p>
                    <p className="text-sm">{report.adminResponse}</p>
                  </div>
                )}

                {report.resolution && (
                  <div className="mb-4 p-3 bg-green-50 rounded">
                    <p className="text-sm font-medium mb-1">Resolution:</p>
                    <p className="text-sm">{getActionLabel(report.resolution.action)}</p>
                    {report.resolution.notes && (
                      <p className="text-sm mt-1">{report.resolution.notes}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={pagination.currentPage === 1}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="report-product" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report a Product</CardTitle>
              <CardDescription>
                You can only report products that you have ordered. This helps ensure legitimate reports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : orderedProducts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    <p className="text-lg mb-2">No ordered products found</p>
                    <p className="text-sm">You need to order products before you can report them.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderedProducts.map((product) => (
                    <Card key={product._id} className="border-l-4 border-l-emerald-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <img
                              src={product.images?.[0] || '/placeholder-product.jpg'}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div>
                              <h3 className="font-semibold">{product.name}</h3>
                              <p className="text-sm text-gray-600">Ordered on {new Date(product.orderDate).toLocaleDateString()}</p>
                              <p className="text-sm text-gray-500">Order ID: {product.orderId}</p>
                            </div>
                          </div>
                          <ReportButton
                            reportedItemType="product"
                            reportedItemId={product._id}
                            reportedItemName={product.name}
                            onSuccess={() => {
                              fetchReports();
                              toast.success('Report submitted successfully!');
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Footer />
    </div>
  );
};

export default MyReports;
