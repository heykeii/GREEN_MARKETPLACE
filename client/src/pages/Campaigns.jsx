import React, { useState, useEffect, useContext } from 'react';
import { Plus, Filter, Search, Calendar, Tag, TrendingUp, Users, Heart, MessageCircle, Share2, Target, Store, Lightbulb, MoreHorizontal, Bookmark, Send, Home, Compass, PlusSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CampaignCard from '../components/CampaignCard';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { getLikedCampaignIds, setLikedForCampaign } from '../lib/utils';
import { toast } from '@/utils/toast';
import { Link } from 'react-router-dom';
import ImageCarousel from '../components/ImageCarousel';

// Suggested friends component
const SuggestedFriends = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token');

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        let myId = null;
        let followingSet = new Set();
        if (token) {
          try {
            const meRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const me = meRes.data?.user || {};
            myId = me._id || me.id || null;
            followingSet = new Set((me.following || []).map((x) => String(x)));
            if (myId) followingSet.add(String(myId)); // exclude self too
          } catch (_) {}
        }

        // Fetch a list of verified sellers and users to follow (reusing sellers search as a simple suggestion source)
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/sellers?search=a`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        let sellers = Array.isArray(res.data?.sellers) ? res.data.sellers : [];

        // Exclude already-followed users and self
        sellers = sellers.filter((u) => {
          const id = String(u._id || u.id);
          return !followingSet.has(id);
        }).slice(0, 6);

        setSuggestions(sellers);
      } catch (_) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  const handleFollow = async (userId, idx) => {
    try {
      if (!token) return;
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/users/follow`, { targetUserId: userId }, { headers: { Authorization: `Bearer ${token}` } });
      // Remove from list after following
      setSuggestions(prev => prev.filter((_, i) => i !== idx));
    } catch (_) {}
  };

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>;
  if (suggestions.length === 0) return <div className="text-sm text-gray-500">No suggestions right now.</div>;

  return (
    <div className="space-y-4">
      {suggestions.map((u, idx) => (
        <div key={u._id} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border">
              <img src={u.avatar || '/default-avatar.png'} onError={(e)=>{ e.currentTarget.src='/default-avatar.png'; }} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm truncate">{`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}</p>
              <p className="text-gray-500 text-xs truncate">{u.businessName || 'Eco enthusiast'}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-600 hover:bg-emerald-50" onClick={()=>handleFollow(u._id, idx)} disabled={u.__isFollowing}>
            {u.__isFollowing ? 'Following' : 'Follow'}
          </Button>
        </div>
      ))}
    </div>
  );
};

// Enhanced Instagram-style Campaign Card Component
const InstagramStyleCampaignCard = ({ campaign, currentUser, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Helper: robustly compare user ids (supports id or _id)
  const isSameUser = (a, b) => {
    if (!a || !b) return false;
    return String(a) === String(b);
  };

  const currentUserId = currentUser?._id || currentUser?.id;

  // Use campaign data directly instead of local state to ensure persistence
  // If logged out, fall back to localStorage-based memory of likes for icon state
  const likedFromServer = (campaign.likes || []).some(like => isSameUser(like?._id || like?.id, currentUserId)) || false;
  const likedFromStorage = !currentUserId && getLikedCampaignIds().includes(String(campaign._id));
  const isLiked = likedFromServer || likedFromStorage;
  const likesCount = campaign.likes?.length || 0;
  
  const handleShare = async () => {
    const url = `${window.location.origin}/campaigns/${campaign._id}`;
    const text = `${campaign.title}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'GreenCampaigns', text, url });
        return;
      }
    } catch (_) {}
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'awareness': return <Lightbulb className="h-4 w-4" />;
      case 'promotional': return <Store className="h-4 w-4" />;
      case 'community': return <Users className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'awareness': return 'text-green-600 bg-green-50 border-green-200';
      case 'promotional': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'community': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const truncateDescription = (text, limit = 150) => {
    if (!text) return '';
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.error('Please login to like campaigns');
      return;
    }
    try {
      const response = await axios.post(`/api/campaigns/${campaign._id}/like`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        // Update the campaign data through the parent component
        const updatedLikes = response.data.isLiked
          ? [
              ...(campaign.likes || []),
              { _id: currentUserId }
            ]
          : (campaign.likes || []).filter(like => !isSameUser(like?._id || like?.id, currentUserId));

        onUpdate && onUpdate(campaign._id, { likes: updatedLikes });
        setLikedForCampaign(campaign._id, response.data.isLiked);
      }
    } catch (error) {
      toast.error('Failed to like campaign');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;
    
    try {
      const response = await axios.post(`/api/campaigns/${campaign._id}/comment`, 
        { text: newComment.trim() }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.data.success) {
        // Update the campaign data through the parent component
        onUpdate && onUpdate(campaign._id, {
          comments: [...(campaign.comments || []), response.data.comment]
        });
        setNewComment('');
        toast.success('Comment added successfully');
      }
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <Link to={`/profile/${campaign.createdBy?._id || campaign.createdBy?.id}`}>
            <Avatar className="h-12 w-12 ring-2 ring-gray-100 cursor-pointer">
              <AvatarImage src={campaign.createdBy?.avatar} alt={campaign.createdBy?.name} />
              <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white font-semibold">
                {(campaign.createdBy?.firstName || campaign.createdBy?.name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Link to={`/profile/${campaign.createdBy?._id || campaign.createdBy?.id}`} className="font-bold text-gray-900 text-base hover:underline">
                {campaign.createdBy?.firstName ? `${campaign.createdBy.firstName}${campaign.createdBy.lastName ? ' ' + campaign.createdBy.lastName : ''}` : (campaign.createdBy?.name || 'User')}
              </Link>
              {campaign.verified && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3 mt-1">
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs border ${getTypeColor(campaign.type)}`}>
                {getTypeIcon(campaign.type)}
                <span className="capitalize font-medium">{campaign.type}</span>
              </div>
              <span className="text-gray-500 text-xs">
                {new Date(campaign.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
        <Link to={`/campaigns/${campaign._id}`}>
          <MoreHorizontal className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
        </Link>
      </div>

      {/* Campaign Title and Description */}
      <div className="px-6 pb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
          {campaign.title}
        </h2>
        {campaign.description && (
          <div className="text-gray-700 leading-relaxed">
            <p>
              {showFullDescription ? campaign.description : truncateDescription(campaign.description)}
              {campaign.description.length > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-blue-600 hover:text-blue-700 ml-2 font-medium"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Campaign Media */}
      {(campaign.media?.length || campaign.image) && (
        <div className="relative">
          <ImageCarousel
            images={(campaign.media && campaign.media.length ? campaign.media : [campaign.image]).slice(0, 10)}
            className="w-full h-96"
            imgClassName="h-96"
          />
          <div className="absolute top-4 right-4">
            <Badge className="bg-black/70 text-white backdrop-blur-sm">
              {campaign.type === 'community' ? `${campaign.participants?.length || 0} joined` : 
               campaign.type === 'promotional' ? `${campaign.featuredBusinesses?.length || 0} businesses` :
               'Awareness Campaign'}
            </Badge>
          </div>
        </div>
      )}

      {/* Enhanced Engagement Section */}
      <div className="px-6 py-4">
        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-6">
            <button 
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-all duration-200 hover:scale-105 ${
                isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart className={`h-7 w-7 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-semibold">{likesCount}</span>
            </button>
            
            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-all duration-200 hover:scale-105"
            >
              <MessageCircle className="h-7 w-7" />
              <span className="font-semibold">{campaign.comments?.length || 0}</span>
            </button>
            
            <button onClick={handleShare} className="text-gray-600 hover:text-green-600 transition-all duration-200 hover:scale-105">
              <Send className="h-7 w-7" />
            </button>
          </div>
          
          <button className="text-gray-600 hover:text-green-600 transition-colors">
            <Bookmark className="h-6 w-6" />
          </button>
        </div>

        {/* Engagement Summary */}
        {(likesCount > 0 || (campaign.comments?.length || 0) > 0) && (
          <div className="mb-4 text-sm text-gray-600">
            {likesCount > 0 && (
              <p className="font-semibold">
                {likesCount} {likesCount === 1 ? 'like' : 'likes'}
              </p>
            )}
          </div>
        )}

        {/* Campaign Type Specific Info */}
        {campaign.type === 'community' && campaign.goal && (
          <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <span className="text-purple-700 font-medium text-sm">
                🎯 Goal: {campaign.goal} participants
              </span>
              <span className="text-purple-600 text-sm">
                {Math.round(((campaign.participants?.length || 0) / campaign.goal) * 100)}% complete
              </span>
            </div>
          </div>
        )}

        {campaign.type === 'promotional' && campaign.featuredBusinesses?.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-2">
              <Store className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700 font-medium text-sm">
                {campaign.featuredBusinesses.length} eco-businesses featured
              </span>
            </div>
          </div>
        )}

        {/* View Details Button */}
        <Link to={`/campaigns/${campaign._id}`}>
          <Button className="w-full mt-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02]">
            View Full Campaign
          </Button>
        </Link>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-6 space-y-4 border-t border-gray-100 pt-4">
            <h4 className="font-semibold text-gray-900">Comments</h4>
            
            {campaign.comments?.slice(0, 3).map((comment, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user?.avatar} alt={comment.user?.firstName || comment.user?.name} />
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                    {(comment.user?.firstName || comment.user?.name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{comment.user?.firstName ? `${comment.user.firstName}${comment.user.lastName ? ' ' + comment.user.lastName : ''}` : (comment.user?.name || 'User')}</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{comment.text}</p>
                </div>
              </div>
            ))}
            
            {campaign.comments?.length > 3 && (
              <Link to={`/campaigns/${campaign._id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View all {campaign.comments.length} comments
              </Link>
            )}
            
            {currentUser && (
              <form onSubmit={handleComment} className="flex items-center space-x-3 mt-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.firstName || currentUser.name} />
                  <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                    {(currentUser.firstName || currentUser.name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 border-gray-200 focus:border-green-300 focus:ring-green-100"
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!newComment.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Post
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Campaigns = () => {
  const { user } = useContext(AuthContext);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    awarenessCampaigns: 0,
    promotionalCampaigns: 0,
    communityCampaigns: 0,
    totalParticipants: 0,
    totalLikes: 0
  });
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchCampaigns();
  }, [filters]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      
      const response = await axios.get(`/api/campaigns?${params.toString()}`);
      if (response.data.success) {
        let filteredCampaigns = response.data.campaigns;
        
        // Apply search filter on frontend
        if (filters.search) {
          filteredCampaigns = filteredCampaigns.filter(campaign =>
            campaign.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            campaign.description?.toLowerCase().includes(filters.search.toLowerCase())
          );
        }
        
        setCampaigns(filteredCampaigns);
        
        // Calculate statistics
        const campaignStats = {
          totalCampaigns: filteredCampaigns.length,
          awarenessCampaigns: filteredCampaigns.filter(c => c.type === 'awareness').length,
          promotionalCampaigns: filteredCampaigns.filter(c => c.type === 'promotional').length,
          communityCampaigns: filteredCampaigns.filter(c => c.type === 'community').length,
          totalParticipants: filteredCampaigns.reduce((sum, c) => sum + (c.participants?.length || 0), 0),
          totalLikes: filteredCampaigns.reduce((sum, c) => sum + (c.likes?.length || 0), 0)
        };
        setStats(campaignStats);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCampaignUpdate = (campaignId, updates) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign._id === campaignId 
        ? { ...campaign, ...updates }
        : campaign
    ));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      search: ''
    });
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

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      {/* Global Navbar */}
      <Navbar />

      {/* Page-level Search (outside navbar) */}
      <div className="sticky top-16 z-20 bg-white border-b border-gray-200 md:static md:top-auto md:z-auto">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search campaigns..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Main Content - Instagram Layout */}
      <div className="max-w-6xl mx-auto flex gap-8 px-4 py-6">
        {/* Left Sidebar - Stories & Quick Stats */}
        <div className="hidden lg:block w-80 space-y-6">
          {/* Campaign Stories */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Campaign Types</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-green-50 cursor-pointer transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Awareness</p>
                  <p className="text-sm text-gray-500">{stats.awarenessCampaigns} active</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Promotional</p>
                  <p className="text-sm text-gray-500">{stats.promotionalCampaigns} active</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-purple-50 cursor-pointer transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Community</p>
                  <p className="text-sm text-gray-500">{stats.communityCampaigns} active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Impact Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Campaigns</span>
                <span className="font-bold text-green-600">{stats.totalCampaigns}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Participants</span>
                <span className="font-bold text-blue-600">{stats.totalParticipants}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Likes</span>
                <span className="font-bold text-red-500">{stats.totalLikes}</span>
              </div>
            </div>
          </div>

          {/* Create Campaign CTA */}
          {user && (
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <h3 className="font-semibold mb-2">Start Your Campaign</h3>
              <p className="text-green-100 text-sm mb-4">Make a difference in your community today</p>
              <Link to="/create-campaign">
                <Button className="w-full bg-white text-green-600 hover:bg-gray-100">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Main Feed */}
        <div className="flex-1 max-w-2xl space-y-8">
          {/* Enhanced Filter Pills */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 overflow-x-auto">
              <button 
                onClick={() => handleFilterChange('type', '')}
                className={`px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  !filters.type 
                    ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg transform scale-105' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                }`}
              >
                🌍 All Campaigns
              </button>
              <button 
                onClick={() => handleFilterChange('type', 'awareness')}
                className={`px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  filters.type === 'awareness' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg transform scale-105' 
                    : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700 hover:scale-105'
                }`}
              >
                💡 Awareness
              </button>
              <button 
                onClick={() => handleFilterChange('type', 'promotional')}
                className={`px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  filters.type === 'promotional' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105' 
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:scale-105'
                }`}
              >
                🏪 Promotional
              </button>
              <button 
                onClick={() => handleFilterChange('type', 'community')}
                className={`px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  filters.type === 'community' 
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform scale-105' 
                    : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700 hover:scale-105'
                }`}
              >
                👥 Community
              </button>
              {(filters.type || filters.status) && (
                <button 
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-200 hover:scale-105"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {/* Campaign Feed */}
          {loading ? (
            <div className="space-y-8">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-pulse">
                  <div className="flex items-center space-x-4 p-6">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="px-6 pb-4">
                    <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="h-96 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="flex items-center space-x-6 mb-4">
                      <div className="h-7 w-16 bg-gray-200 rounded"></div>
                      <div className="h-7 w-16 bg-gray-200 rounded"></div>
                      <div className="h-7 w-16 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-12 bg-gray-200 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : campaigns.length > 0 ? (
            <div className="space-y-8">
              {campaigns.map((campaign) => (
                <InstagramStyleCampaignCard
                  key={campaign._id}
                  campaign={campaign}
                  currentUser={user}
                  onUpdate={handleCampaignUpdate}
                />
              ))}
              
              {/* Load More Indicator */}
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2 text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">You're all caught up!</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-16 text-center shadow-lg border border-green-100">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Compass className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {filters.type || filters.status || filters.search
                  ? 'No campaigns match your filters'
                  : 'Start the Green Revolution!'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                {filters.type || filters.status || filters.search
                  ? 'Try adjusting your filters or search terms to discover more eco-friendly campaigns.'
                  : 'Be the first to create an impactful campaign and inspire your community to make a difference for our planet.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {(filters.type || filters.status || filters.search) && (
                  <Button 
                    onClick={clearFilters}
                    variant="outline" 
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
                {user && (
                  <Link to="/create-campaign">
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your Campaign
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Suggestions & Trending */}
        <div className="hidden xl:block w-80 space-y-6">
          {/* Trending Campaigns */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Trending Today</h3>
            <div className="space-y-4">
              {campaigns.slice(0, 3).map((campaign, index) => (
                <div key={campaign._id} className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden">
                    <img 
                      src={campaign.image || '/placeholder-campaign.jpg'} 
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm line-clamp-1">{campaign.title}</p>
                    <p className="text-gray-500 text-xs">{campaign.likes?.length || 0} likes</p>
                  </div>
                  <span className="text-gray-400 text-xs">#{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Friends (users to follow) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Suggested Friends</h3>
            <SuggestedFriends />
          </div>

          {/* How It Works */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">How It Works</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <p className="text-gray-700 text-sm">Create your eco-friendly campaign</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <p className="text-gray-700 text-sm">Get approved by our team</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <p className="text-gray-700 text-sm">Engage with the community</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
        <div className="flex justify-around items-center">
          <Link to="/" className="p-2">
            <Home className="h-6 w-6 text-gray-700" />
          </Link>
          <button onClick={() => setFilters({...filters, type: ''})}>
            <Compass className="h-6 w-6 text-gray-700" />
          </button>
          {user && (
            <Link to="/create-campaign" className="p-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
            </Link>
          )}
          <button>
            <Heart className="h-6 w-6 text-gray-700" />
          </button>
          {user && (
            <Avatar className="h-7 w-7 border border-gray-200">
              <AvatarImage src={user.avatar} alt={user.firstName || user.name} />
              <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                {(user.firstName || user.name)?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="md:hidden h-16"></div>
      <Footer />
    </div>
    </>
  );
};

export default Campaigns;
