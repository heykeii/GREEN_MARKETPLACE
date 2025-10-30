import React, { useState, useEffect } from 'react';
import { toast } from '@/utils/toast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import AdminLayout from '../components/AdminLayout';

const AdminReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    reason: 'all',
    reportedItemType: 'all',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionData, setResolutionData] = useState({
    action: '',
    notes: ''
  });
  const [selectedEvidenceImage, setSelectedEvidenceImage] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [filters]);

  const fetchReports = async () => {
    try {
      // Filter out 'all' values to avoid sending them to the API
      const queryFilters = { ...filters };
      if (queryFilters.status === 'all') delete queryFilters.status;
      if (queryFilters.reason === 'all') delete queryFilters.reason;
      if (queryFilters.reportedItemType === 'all') delete queryFilters.reportedItemType;
      
      const queryParams = new URLSearchParams(queryFilters).toString();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/reports/admin/all?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
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

  const fetchStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/reports/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateReportStatus = async (reportId, status, adminResponse = '') => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/reports/admin/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ status, adminResponse })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Report status updated successfully');
        fetchReports();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating report status:', error);
      toast.error('Failed to update report status');
    }
  };

  const resolveReport = async () => {
    if (!selectedReport || !resolutionData.action) {
      toast.error('Please select an action');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/reports/admin/${selectedReport._id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(resolutionData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Report resolved successfully');
        setSelectedReport(null);
        setResolutionData({ action: '', notes: '' });
        fetchReports();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to resolve report');
      }
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Failed to resolve report');
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
    <div className="container mx-auto px-3 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Report Management</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage and resolve user reports</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.stats?.total || 0}</div>
            <div className="text-sm text-gray-600">Total Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.stats?.pending || 0}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.stats?.investigating || 0}</div>
            <div className="text-sm text-gray-600">Investigating</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.stats?.resolved || 0}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.stats?.dismissed || 0}</div>
            <div className="text-sm text-gray-600">Dismissed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
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
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Select value={filters.reason} onValueChange={(value) => setFilters(prev => ({ ...prev, reason: value, page: 1 }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                  <SelectItem value="fake_product">Fake Product</SelectItem>
                  <SelectItem value="poor_quality">Poor Quality</SelectItem>
                  <SelectItem value="scam">Scam</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Item Type</label>
              <Select value={filters.reportedItemType} onValueChange={(value) => setFilters(prev => ({ ...prev, reportedItemType: value, page: 1 }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => setFilters({ status: 'all', reason: 'all', reportedItemType: 'all', page: 1, limit: 10 })}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-3 sm:space-y-4">
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
                  <p className="text-sm text-gray-600">
                    By: {report.reporter?.firstName} {report.reporter?.lastName} ({report.reporter?.email})
                  </p>
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
                  <div className="flex gap-2 flex-wrap">
                    {report.evidence.map((url, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setSelectedEvidenceImage(url);
                          setImageLoading(true);
                          setImageLoadError(false);
                        }}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <img 
                          src={url} 
                          alt={`Evidence ${index + 1}`} 
                          className="w-16 h-16 object-cover rounded border hover:border-blue-500 hover:shadow-md transition-all" 
                        />
                        <p className="text-xs text-gray-500 text-center mt-1">Evidence {index + 1}</p>
                      </div>
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

              <div className="flex gap-2">
                {report.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateReportStatus(report._id, 'investigating')}
                    >
                      Start Investigation
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReportStatus(report._id, 'dismissed')}
                    >
                      Dismiss
                    </Button>
                  </>
                )}

                {report.status === 'investigating' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={() => setSelectedReport(report)}>
                        Resolve Report
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Resolve Report</DialogTitle>
                        <DialogDescription>
                          Select an action to resolve this report.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Action</label>
                          <Select value={resolutionData.action} onValueChange={(value) => setResolutionData(prev => ({ ...prev, action: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="warning_issued">Warning Issued</SelectItem>
                              <SelectItem value="item_removed">Item Removed</SelectItem>
                              <SelectItem value="user_suspended">User Suspended</SelectItem>
                              <SelectItem value="user_banned">User Banned</SelectItem>
                              <SelectItem value="refund_issued">Refund Issued</SelectItem>
                              <SelectItem value="no_action">No Action</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Notes</label>
                          <Textarea
                            value={resolutionData.notes}
                            onChange={(e) => setResolutionData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes..."
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={resolveReport} className="flex-1">
                            Resolve
                          </Button>
                          <Button variant="outline" className="flex-1" onClick={() => {
                            setSelectedReport(null);
                            setResolutionData({ action: '', notes: '' });
                          }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Evidence Image Viewer Dialog */}
      <Dialog open={!!selectedEvidenceImage} onOpenChange={(open) => {
        if (!open) {
          setSelectedEvidenceImage(null);
          setImageLoadError(false);
          setImageLoading(true);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Evidence Image</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex justify-center items-center min-h-[400px] bg-gray-50 rounded-lg p-4 overflow-auto">
            {selectedEvidenceImage && (
              <>
                {imageLoading && !imageLoadError && (
                  <div className="text-gray-500">Loading image...</div>
                )}
                {imageLoadError ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-red-500 text-center">
                      <p className="font-medium mb-2">Failed to load image</p>
                      <p className="text-sm text-gray-600 mb-4">{selectedEvidenceImage}</p>
                      <Button 
                        onClick={() => window.open(selectedEvidenceImage, '_blank')}
                        variant="outline"
                      >
                        Open Image in New Tab
                      </Button>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={selectedEvidenceImage} 
                    alt="Evidence" 
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                    onLoad={() => {
                      setImageLoading(false);
                      setImageLoadError(false);
                    }}
                    onError={() => {
                      setImageLoading(false);
                      setImageLoadError(true);
                    }}
                    style={{ display: imageLoading ? 'none' : 'block' }}
                  />
                )}
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            {selectedEvidenceImage && !imageLoadError && (
              <Button 
                variant="outline"
                onClick={() => window.open(selectedEvidenceImage, '_blank')}
              >
                Open in New Tab
              </Button>
            )}
            <Button onClick={() => {
              setSelectedEvidenceImage(null);
              setImageLoadError(false);
              setImageLoading(true);
            }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
    </AdminLayout>
  );
};

export default AdminReportManagement;
