import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, AlertTriangle, Share2, Bookmark, MoreHorizontal, Calendar, Clock, Eye, TrendingUp, Users, Heart, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import CampaignCard from '../components/CampaignCard';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/campaigns/${id}`);
      if (response.data.success) {
        setCampaign(response.data.campaign);
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      if (error.response?.status === 404) {
        toast.error('Campaign not found');
        navigate('/campaigns');
      } else if (error.response?.status === 403) {
        toast.error('This campaign is not available');
        navigate('/campaigns');
      } else {
        toast.error('Failed to load campaign');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignUpdate = (campaignId, updates) => {
    setCampaign(prev => ({ ...prev, ...updates }));
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await axios.delete(`/api/campaigns/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Campaign deleted successfully');
      navigate('/campaigns');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    } finally {
      setDeleting(false);
    }
  };

  const canEditOrDelete = user && (
    user.role === 'admin' || 
    campaign?.createdBy?._id === user.id
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign not found</h3>
            <p className="text-gray-500 mb-6">
              The campaign you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/campaigns">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getEngagementStats = () => {
    const likes = campaign.likes?.length || 0;
    const comments = campaign.comments?.length || 0;
    const participants = campaign.participants?.length || 0;
    return { likes, comments, participants };
  };

  const getCampaignTypeInfo = () => {
    switch (campaign.type) {
      case 'awareness':
        return {
          icon: <Eye className="h-5 w-5" />,
          color: 'text-green-600 bg-green-50 border-green-200',
          label: 'Awareness Campaign'
        };
      case 'promotional':
        return {
          icon: <TrendingUp className="h-5 w-5" />,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          label: 'Promotional Campaign'
        };
      case 'community':
        return {
          icon: <Users className="h-5 w-5" />,
          color: 'text-purple-600 bg-purple-50 border-purple-200',
          label: 'Community Campaign'
        };
      default:
        return {
          icon: <Calendar className="h-5 w-5" />,
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          label: 'Campaign'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/campaigns">
                <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Campaigns
                </Button>
              </Link>
              {campaign && (
                <div className="flex items-center space-x-3">
                  <Badge className={getCampaignTypeInfo().color + " border"}>
                    {getCampaignTypeInfo().icon}
                    <span className="ml-1">{getCampaignTypeInfo().label}</span>
                  </Badge>
                  {campaign.verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <Bookmark className="h-4 w-4" />
              </Button>
              {canEditOrDelete && (
                <>
                  <Separator orientation="vertical" className="h-6" />
                  <Link to={`/campaigns/${id}/edit`}>
                    <Button variant="outline" size="sm" className="hover:bg-blue-50">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Stats Overview */}
        {campaign && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Heart className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold text-red-600">{getEngagementStats().likes}</p>
                      <p className="text-sm text-red-600">Likes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{getEngagementStats().comments}</p>
                      <p className="text-sm text-blue-600">Comments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{getEngagementStats().participants}</p>
                      <p className="text-sm text-purple-600">Participants</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm font-bold text-green-600">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-green-600">Created</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Main Campaign Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CampaignCard
              campaign={campaign}
              currentUser={user}
              onUpdate={handleCampaignUpdate}
            />
          </div>

          {/* Sidebar with additional info */}
          <div className="space-y-6">
            {/* Campaign Info Card */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Campaign Information</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaign && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Type</span>
                      <Badge className={getCampaignTypeInfo().color}>
                        {getCampaignTypeInfo().label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge variant={campaign.verified ? 'default' : 'secondary'}>
                        {campaign.verified ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Created</span>
                      <span className="text-sm font-medium">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {campaign.startDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Start Date</span>
                        <span className="text-sm font-medium">
                          {new Date(campaign.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {campaign.endDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">End Date</span>
                        <span className="text-sm font-medium">
                          {new Date(campaign.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Organizer Info Card */}
            {campaign?.createdBy && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Organizer</h3>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {(campaign.createdBy.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{campaign.createdBy.name}</p>
                      <p className="text-sm text-gray-600">{campaign.createdBy.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Additional Info for Admin/Creator */}
        {canEditOrDelete && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(campaign.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Updated:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(campaign.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Verification Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  campaign.verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {campaign.verified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Campaign ID:</span>
                <span className="ml-2 text-gray-600 font-mono text-xs">{campaign._id}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetail;
