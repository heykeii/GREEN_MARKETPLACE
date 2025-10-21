import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Trash2, Filter, Calendar, Tag, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import axios from 'axios';
import { toast } from '@/utils/toast';
import AdminLayout from '../components/AdminLayout';

const AdminCampaignManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    verified: ''
  });
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, [filters]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('admin_token') || localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.verified) params.append('verified', filters.verified);

      const response = await axios.get(`/api/v1/admin/campaigns?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      if (response.data.success) {
        setCampaigns(response.data.campaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCampaign = async (campaignId, verified, message = '') => {
    try {
      setActionLoading(true);
      const adminToken = localStorage.getItem('admin_token') || localStorage.getItem('token');
      const response = await axios.patch(
        `/api/v1/admin/campaigns/verify/${campaignId}`,
        { verified, rejectionMessage: message },
        {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        }
      );

      if (response.data.success) {
        toast.success(`Campaign ${verified ? 'verified' : 'rejected'} successfully`);
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error verifying campaign:', error);
      toast.error('Failed to update campaign status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      const adminToken = localStorage.getItem('admin_token') || localStorage.getItem('token');
      await axios.delete(`/api/v1/admin/campaigns/${campaignId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      toast.success('Campaign deleted successfully');
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'awareness':
        return 'bg-green-100 text-green-800';
      case 'promotional':
        return 'bg-blue-100 text-blue-800';
      case 'community':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingCampaigns = campaigns.filter(c => !c.verified && !c.rejectionMessage);
  const verifiedCampaigns = campaigns.filter(c => c.verified);
  const rejectedCampaigns = campaigns.filter(c => !c.verified && c.rejectionMessage);

  const CampaignCard = ({ campaign, showActions = true }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={getTypeColor(campaign.type)}>
                {campaign.type.charAt(0).toUpperCase() + campaign.type.slice(1)}
              </Badge>
              <Badge className={getStatusColor(campaign.status)}>
                {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1)}
              </Badge>
              <Badge className={
                campaign.verified 
                  ? 'bg-green-100 text-green-800' 
                  : campaign.rejectionMessage 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800'
              }>
                {campaign.verified 
                  ? 'Verified' 
                  : campaign.rejectionMessage 
                    ? 'Rejected' 
                    : 'Pending'
                }
              </Badge>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{campaign.title}</h3>
            
            {campaign.description && (
              <p className="text-gray-600 mb-3 line-clamp-2">{campaign.description}</p>
            )}
            
            {campaign.rejectionMessage && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  <strong>Rejection Reason:</strong> {campaign.rejectionMessage}
                </p>
              </div>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {campaign.createdBy?.firstName} {campaign.createdBy?.lastName}
              </span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(campaign.createdAt)}
              </span>
            </div>

            {/* Type-specific info */}
            <div className="mt-3 text-sm">
              {campaign.type === 'community' && (
                <div className="flex items-center space-x-4">
                  <span>Participants: {campaign.participants?.length || 0}</span>
                  {campaign.goal && <span>Goal: {campaign.goal}</span>}
                </div>
              )}
              {campaign.type === 'awareness' && (
                <div className="flex items-center space-x-4">
                  <span>Likes: {campaign.likes?.length || 0}</span>
                  <span>Comments: {campaign.comments?.length || 0}</span>
                </div>
              )}
              {campaign.type === 'promotional' && (
                <div>
                  <span>Featured Businesses: {campaign.featuredBusinesses?.length || 0}</span>
                </div>
              )}
            </div>
          </div>

          {campaign.image && (
            <div className="w-24 h-24 ml-4 rounded-lg overflow-hidden">
              <img
                src={campaign.image}
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex items-center space-x-2 pt-4 border-t">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{campaign.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {campaign.image && (
                    <img
                      src={campaign.image}
                      alt={campaign.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <Label>Description</Label>
                    <p className="text-gray-700">{campaign.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Type</Label>
                      <p className="text-gray-700 capitalize">{campaign.type}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <p className="text-gray-700 capitalize">{campaign.status}</p>
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <p className="text-gray-700">
                        {campaign.startDate ? formatDate(campaign.startDate) : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <p className="text-gray-700">
                        {campaign.endDate ? formatDate(campaign.endDate) : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {!campaign.verified && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleVerifyCampaign(campaign._id, true)}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCampaign(campaign);
                    setRejectionMessage('');
                    setIsRejectDialogOpen(true);
                  }}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteCampaign(campaign._id)}
              disabled={actionLoading}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Campaign Management</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage and verify user-submitted campaigns</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap gap-4">
            <Select value={filters.type || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === "all" ? "" : value }))}>
              <SelectTrigger className="w-48">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="awareness">Awareness</SelectItem>
                <SelectItem value="promotional">Promotional</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === "all" ? "" : value }))}>
              <SelectTrigger className="w-48">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.verified || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, verified: value === "all" ? "" : value }))}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verification</SelectItem>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {(filters.type || filters.status || filters.verified) && (
              <Button
                variant="outline"
                onClick={() => setFilters({ type: '', status: '', verified: '' })}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-3 sm:space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Verification ({pendingCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified Campaigns ({verifiedCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected Campaigns ({rejectedCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Campaigns ({campaigns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pendingCampaigns.length > 0 ? (
            pendingCampaigns.map(campaign => (
              <CampaignCard key={campaign._id} campaign={campaign} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Campaigns</h3>
                <p className="text-gray-500">All campaigns have been reviewed!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="verified">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : verifiedCampaigns.length > 0 ? (
            verifiedCampaigns.map(campaign => (
              <CampaignCard key={campaign._id} campaign={campaign} showActions={false} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Verified Campaigns</h3>
                <p className="text-gray-500">No campaigns have been verified yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : rejectedCampaigns.length > 0 ? (
            rejectedCampaigns.map(campaign => (
              <CampaignCard key={campaign._id} campaign={campaign} showActions={false} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Rejected Campaigns</h3>
                <p className="text-gray-500">No campaigns have been rejected yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : campaigns.length > 0 ? (
            campaigns.map(campaign => (
              <CampaignCard key={campaign._id} campaign={campaign} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns Found</h3>
                <p className="text-gray-500">No campaigns match your current filters.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>

    {/* Rejection Dialog */}
    {selectedCampaign && (
      <Dialog open={isRejectDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsRejectDialogOpen(false);
          setRejectionMessage('');
        }
      }}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Reject Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to reject "{selectedCampaign.title}"?
            </p>
            <div>
              <Label htmlFor="rejection-message">Rejection Message (Optional)</Label>
              <Textarea
                id="rejection-message"
                value={rejectionMessage}
                onChange={(e) => setRejectionMessage(e.target.value)}
                placeholder="Provide feedback to the campaign creator..."
                className="mt-2"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsRejectDialogOpen(false);
                  setRejectionMessage('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleVerifyCampaign(selectedCampaign._id, false, rejectionMessage);
                  setIsRejectDialogOpen(false);
                }}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                Reject Campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}
    </AdminLayout>
  );
};

export default AdminCampaignManagement;
