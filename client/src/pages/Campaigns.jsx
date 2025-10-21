import React, { useState, useEffect, useContext } from 'react';
import { Plus, Filter, Search, Calendar, Tag, TrendingUp, Users, Heart, MessageCircle, Share2, Target, Store, Lightbulb, MoreHorizontal, Send, Home, Compass, PlusSquare, Sparkles, TrendingDown, Award, Zap } from 'lucide-react';
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
import AnnouncementCard from '../components/AnnouncementCard';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { getLikedCampaignIds, setLikedForCampaign } from '../lib/utils';
import { toast } from '@/utils/toast';
import { Link } from 'react-router-dom';
import ImageCarousel from '../components/ImageCarousel';

// Suggested friends component with enhanced UI
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
            if (myId) followingSet.add(String(myId));
          } catch (_) {}
        }

        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/sellers?search=a`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        let sellers = Array.isArray(res.data?.sellers) ? res.data.sellers : [];

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
      setSuggestions(prev => prev.filter((_, i) => i !== idx));
    } catch (_) {}
  };

  if (loading) return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-16 bg-gray-100 rounded"></div>
            </div>
          </div>
          <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
  
  if (suggestions.length === 0) return (
    <div className="text-center py-6">
      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
      <p className="text-sm text-gray-500">No suggestions right now</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {suggestions.map((u, idx) => (
        <div key={u._id} className="group flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-all duration-200">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md group-hover:border-green-200 transition-all duration-200">
                <img src={u.avatar || '/default-avatar.svg'} onError={(e)=>{ e.currentTarget.src='/default-avatar.svg'; }} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}</p>
              <p className="text-gray-500 text-xs truncate">{u.businessName || 'Eco enthusiast'}</p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 px-4" 
            onClick={()=>handleFollow(u._id, idx)} 
            disabled={u.__isFollowing}
          >
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
  
  const isSameUser = (a, b) => {
    if (!a || !b) return false;
    return String(a) === String(b);
  };

  const currentUserId = currentUser?._id || currentUser?.id;

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
      case 'awareness': return 'text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200';
      case 'promotional': return 'text-blue-700 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200';
      case 'community': return 'text-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200';
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
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/campaigns/${campaign._id}/like`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
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
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/campaigns/${campaign._id}/comment`, 
        { text: newComment.trim() }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (response.data.success) {
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
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Enhanced Header with gradient background */}
      <div className="relative bg-gradient-to-br from-gray-50 via-white to-green-50/30 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <Link to={`/profile/${campaign.createdBy?._id || campaign.createdBy?.id}`}>
              <div className="relative group">
                <Avatar className="h-14 w-14 ring-4 ring-white shadow-lg cursor-pointer transition-transform duration-200 group-hover:scale-105">
                  <AvatarImage src={campaign.createdBy?.avatar} alt={campaign.createdBy?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 text-white font-bold text-lg">
                    {(campaign.createdBy?.firstName || campaign.createdBy?.name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white shadow-md"></div>
              </div>
            </Link>
            <div className="flex-1">
              <div className="flex items-center space-x-2 min-w-0">
                <Link to={`/profile/${campaign.createdBy?._id || campaign.createdBy?.id}`} className="font-bold text-gray-900 text-base hover:text-green-600 transition-colors">
                  {campaign.createdBy?.firstName ? `${campaign.createdBy.firstName}${campaign.createdBy.lastName ? ' ' + campaign.createdBy.lastName : ''}` : (campaign.createdBy?.name || 'User')}
                </Link>
                {campaign.verified && (
                  <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3 mt-1.5">
                <div className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs border shadow-sm ${getTypeColor(campaign.type)}`}>
                  {getTypeIcon(campaign.type)}
                  <span className="capitalize font-semibold">{campaign.type}</span>
                </div>
                <span className="text-gray-500 text-xs font-medium">
                  {new Date(campaign.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
          <Link to={`/campaigns/${campaign._id}`} className="self-start sm:self-auto">
            <div className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <MoreHorizontal className="h-6 w-6 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
            </div>
          </Link>
        </div>
      </div>

      {/* Campaign Title and Description */}
      <div className="px-6 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
          {campaign.title}
        </h2>
        {campaign.description && (
          <div className="text-gray-700 leading-relaxed">
            <p className="text-base">
              {showFullDescription ? campaign.description : truncateDescription(campaign.description)}
              {campaign.description.length > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-green-600 hover:text-green-700 ml-2 font-semibold transition-colors"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Campaign Media with enhanced overlay */}
      {(campaign.media?.length || campaign.image) && (
        <div className="relative group">
          <ImageCarousel
            images={(campaign.media && campaign.media.length ? campaign.media : [campaign.image]).slice(0, 10)}
            className="w-full h-64 sm:h-80 md:h-96"
            imgClassName="h-64 sm:h-80 md:h-96"
          />
          <div className="absolute top-4 right-4">
            <Badge className="bg-gradient-to-r from-gray-900 to-gray-800 text-white backdrop-blur-md border-0 shadow-xl px-4 py-2">
              {campaign.type === 'community' ? `🎯 ${campaign.participants?.length || 0} joined` : 
               campaign.type === 'promotional' ? `🏪 ${campaign.featuredBusinesses?.length || 0} businesses` :
               '💡 Awareness Campaign'}
            </Badge>
          </div>
          {/* Gradient overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
        </div>
      )}

      {/* Enhanced Engagement Section */}
      <div className="px-6 py-5 bg-gradient-to-b from-white to-gray-50/50">
        {/* Action Buttons with enhanced styling */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-8">
            <button 
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-all duration-300 hover:scale-110 ${
                isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <div className={`p-2 rounded-full ${isLiked ? 'bg-red-50' : 'hover:bg-gray-100'} transition-colors`}>
                <Heart className={`h-7 w-7 ${isLiked ? 'fill-current animate-pulse' : ''}`} />
              </div>
              <span className="font-bold text-base">{likesCount}</span>
            </button>
            
            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-all duration-300 hover:scale-110"
            >
              <div className="p-2 rounded-full hover:bg-blue-50 transition-colors">
                <MessageCircle className="h-7 w-7" />
              </div>
              <span className="font-bold text-base">{campaign.comments?.length || 0}</span>
            </button>

            <button 
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-all duration-300 hover:scale-110"
            >
              <div className="p-2 rounded-full hover:bg-green-50 transition-colors">
                <Share2 className="h-7 w-7" />
              </div>
            </button>
          </div>
        </div>

        {/* Engagement Summary with enhanced styling */}
        {(likesCount > 0 || (campaign.comments?.length || 0) > 0) && (
          <div className="mb-4 text-sm">
            {likesCount > 0 && (
              <p className="font-bold text-gray-900">
                ❤️ {likesCount} {likesCount === 1 ? 'like' : 'likes'}
              </p>
            )}
          </div>
        )}

        {/* Campaign Type Specific Info with enhanced cards */}
        {campaign.type === 'community' && campaign.goal && (
          <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-2xl border-2 border-purple-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span className="text-purple-700 font-semibold text-sm">
                  Goal: {campaign.goal} participants
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-purple-600 font-bold text-lg">
                  {Math.round(((campaign.participants?.length || 0) / campaign.goal) * 100)}%
                </div>
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="mt-3 h-2 bg-purple-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(((campaign.participants?.length || 0) / campaign.goal) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {campaign.type === 'promotional' && campaign.featuredBusinesses?.length > 0 && (
          <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 rounded-2xl border-2 border-blue-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Store className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <span className="text-blue-700 font-semibold text-sm block">
                  {campaign.featuredBusinesses.length} eco-businesses featured
                </span>
                <span className="text-blue-600 text-xs">Supporting sustainable commerce</span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced View Details Button */}
        <Link to={`/campaigns/${campaign._id}`}>
          <Button className="w-full mt-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-bold py-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl border-0">
            <Sparkles className="h-5 w-5 mr-2" />
            View Full Campaign
          </Button>
        </Link>

        {/* Enhanced Comments Section */}
        {showComments && (
          <div className="mt-6 space-y-4 border-t-2 border-gray-100 pt-6">
            <h4 className="font-bold text-gray-900 flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <span>Comments</span>
            </h4>
            
            {campaign.comments?.slice(0, 3).map((comment, index) => (
              <div key={index} className="flex items-start space-x-3 group">
                <Avatar className="h-9 w-9 ring-2 ring-white shadow-md">
                  <AvatarImage src={comment.user?.avatar} alt={comment.user?.firstName || comment.user?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 text-sm font-semibold">
                    {(comment.user?.firstName || comment.user?.name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4 shadow-sm group-hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="font-bold text-gray-900 text-sm">{comment.user?.firstName ? `${comment.user.firstName}${comment.user.lastName ? ' ' + comment.user.lastName : ''}` : (comment.user?.name || 'User')}</span>
                    <span className="text-gray-400 text-xs">•</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))}
            
            {campaign.comments?.length > 3 && (
              <Link to={`/campaigns/${campaign._id}`} className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors">
                <span>View all {campaign.comments.length} comments</span>
                <span>→</span>
              </Link>
            )}
            
            {currentUser && (
              <form onSubmit={handleComment} className="flex items-center space-x-3 mt-5">
                <Avatar className="h-9 w-9 ring-2 ring-green-100 shadow-md">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.firstName || currentUser.name} />
                  <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white text-sm font-bold">
                    {(currentUser.firstName || currentUser.name || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 border-2 border-gray-200 focus:border-green-400 focus:ring-green-200 rounded-xl bg-gray-50"
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!newComment.trim()}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-6 rounded-xl shadow-md"
                  >
                    <Send className="h-4 w-4" />
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
  const [announcements, setAnnouncements] = useState([]);
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
    fetchAnnouncements();
  }, [filters]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/campaigns?${params.toString()}`);
      if (response.data.success) {
        let filteredCampaigns = response.data.campaigns;
        
        if (filters.search) {
          filteredCampaigns = filteredCampaigns.filter(campaign =>
            campaign.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            campaign.description?.toLowerCase().includes(filters.search.toLowerCase())
          );
        }
        
        setCampaigns(filteredCampaigns);
        
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

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
      if (!token) return;
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/announcements/my-announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          page: 1,
          limit: 5
        }
      });
      
      if (response.data.success) {
        setAnnouncements(response.data.announcements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
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

  const handleAnnouncementMarkedAsRead = (announcementId, userId) => {
    setAnnouncements(prev => prev.map(a => {
      if (a._id !== announcementId) return a;
      const alreadyViewed = Array.isArray(a.viewedBy) && a.viewedBy.some(v => String(v.user || v._id || v) === String(userId));
      if (alreadyViewed) return a;
      return {
        ...a,
        views: (a.views || 0) + 1,
        viewedBy: [...(a.viewedBy || []), { user: userId, viewedAt: new Date().toISOString() }]
      };
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      search: ''
    });
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/30">
      {/* Global Navbar */}
      <Navbar />

      {/* Enhanced Page-level Search */}
      <div className="sticky top-16 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm md:static md:top-auto md:z-auto">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search campaigns by title or description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-12 pr-4 py-6 bg-gradient-to-r from-gray-50 to-green-50/30 border-2 border-gray-200 rounded-2xl text-base focus:border-green-400 focus:ring-green-200 shadow-sm hover:shadow-md transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content - Enhanced Instagram Layout */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 sm:gap-8 px-3 sm:px-4 py-6 sm:py-8">
        {/* Left Sidebar - Enhanced */}
        <div className="hidden lg:block w-80 space-y-6 sticky top-24 self-start">
          {/* Create Campaign CTA with enhanced design */}
          {user && (
            <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-2">Start Your Campaign</h3>
                <p className="text-green-100 text-sm mb-6 leading-relaxed">Make a difference in your community today and inspire others</p>
                <Link to="/create-campaign">
                  <Button className="w-full bg-white text-green-600 hover:bg-green-50 font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Campaign
                  </Button>
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* Main Feed - Enhanced */}
        <div className="flex-1 max-w-2xl space-y-6 sm:space-y-8">
          {/* Enhanced Filter Pills with gradient effects */}
          <div className="bg-white rounded-3xl p-5 shadow-xl border border-gray-100">
            <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none pb-2">
              <button 
                onClick={() => handleFilterChange('type', '')}
                className={`px-7 py-3.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-md ${
                  !filters.type 
                    ? 'bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white shadow-2xl transform scale-110' 
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 hover:scale-105'
                }`}
              >
                🌍 All Campaigns
              </button>
              <button 
                onClick={() => handleFilterChange('type', 'awareness')}
                className={`px-7 py-3.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-md ${
                  filters.type === 'awareness' 
                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white shadow-2xl transform scale-110' 
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:from-green-100 hover:to-emerald-100 hover:scale-105'
                }`}
              >
                💡 Awareness
              </button>
              <button 
                onClick={() => handleFilterChange('type', 'promotional')}
                className={`px-7 py-3.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-md ${
                  filters.type === 'promotional' 
                    ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white shadow-2xl transform scale-110' 
                    : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 hover:from-blue-100 hover:to-cyan-100 hover:scale-105'
                }`}
              >
                🏪 Promotional
              </button>
              <button 
                onClick={() => handleFilterChange('type', 'community')}
                className={`px-7 py-3.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-md ${
                  filters.type === 'community' 
                    ? 'bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white shadow-2xl transform scale-110' 
                    : 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100 hover:scale-105'
                }`}
              >
                👥 Community
              </button>
              {(filters.type || filters.status) && (
                <button 
                  onClick={clearFilters}
                  className="px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 shadow-md"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {/* Campaign Feed with enhanced loading states */}
          {loading ? (
            <div className="space-y-8">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-gray-50 to-green-50/30">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded-lg w-32 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded-lg w-24"></div>
                    </div>
                  </div>
                  <div className="px-6 pb-4">
                    <div className="h-7 bg-gray-200 rounded-lg mb-3 w-3/4"></div>
                    <div className="h-5 bg-gray-200 rounded-lg mb-2"></div>
                    <div className="h-5 bg-gray-200 rounded-lg w-2/3"></div>
                  </div>
                  <div className="h-96 bg-gradient-to-br from-gray-200 to-gray-300"></div>
                  <div className="p-6 bg-gradient-to-b from-white to-gray-50/50">
                    <div className="flex items-center space-x-6 mb-4">
                      <div className="h-9 w-20 bg-gray-200 rounded-full"></div>
                      <div className="h-9 w-20 bg-gray-200 rounded-full"></div>
                      <div className="h-9 w-20 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="h-14 bg-gray-200 rounded-2xl"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (announcements.length > 0 || campaigns.length > 0) ? (
            <div className="space-y-8">
              {/* Announcements */}
              {announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement._id}
                  announcement={announcement}
                  currentUser={user}
                  onMarkedAsRead={handleAnnouncementMarkedAsRead}
                />
              ))}
              
              {/* Campaigns */}
              {campaigns.map((campaign) => (
                <InstagramStyleCampaignCard
                  key={campaign._id}
                  campaign={campaign}
                  currentUser={user}
                  onUpdate={handleCampaignUpdate}
                />
              ))}
              
              {/* Enhanced Load More Indicator */}
              <div className="text-center py-12">
                <div className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full shadow-lg border border-green-100">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-base font-bold text-gray-700">You're all caught up!</span>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl p-20 text-center shadow-2xl border-2 border-green-100">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/20 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-200/20 rounded-full -ml-24 -mb-24"></div>
              <div className="relative z-10">
                <div className="w-32 h-32 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl transform hover:scale-110 transition-transform duration-300">
                  <Compass className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {filters.type || filters.status || filters.search
                    ? 'No campaigns match your filters'
                    : 'Start the Green Revolution!'}
                </h3>
                <p className="text-gray-600 text-lg mb-10 max-w-md mx-auto leading-relaxed">
                  {filters.type || filters.status || filters.search
                    ? 'Try adjusting your filters or search terms to discover more eco-friendly campaigns.'
                    : 'Be the first to create an impactful campaign and inspire your community to make a difference for our planet.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {(filters.type || filters.status || filters.search) && (
                    <Button 
                      onClick={clearFilters}
                      className="bg-white text-green-700 hover:bg-green-50 border-2 border-green-300 font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Filter className="h-5 w-5 mr-2" />
                      Clear All Filters
                    </Button>
                  )}
                  {user && (
                    <Link to="/create-campaign">
                      <Button className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-black px-10 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-0">
                        <Plus className="h-6 w-6 mr-2" />
                        Create Your Campaign
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Enhanced */}
        <div className="hidden xl:block w-80 space-y-6 sticky top-24 self-start">
          {/* Trending Campaigns with enhanced design */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center space-x-2 mb-5">
              <div className="p-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Trending Today</h3>
            </div>
            <div className="space-y-4">
              {campaigns.slice(0, 3).map((campaign, index) => (
                <Link key={campaign._id} to={`/campaigns/${campaign._id}`}>
                  <div className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50/30 transition-all duration-200 group cursor-pointer">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                      <img 
                        src={campaign.image || '/placeholder-campaign.jpg'} 
                        alt={campaign.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-green-600 transition-colors">{campaign.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span className="text-gray-600 text-xs font-medium">{campaign.likes?.length || 0} likes</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="h-4 w-4 text-orange-500" />
                      <span className="text-orange-600 text-sm font-bold">#{index + 1}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Suggested Friends with enhanced design */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
            <div className="flex items-center space-x-2 mb-5">
              <div className="p-2 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Suggested Friends</h3>
            </div>
            <SuggestedFriends />
          </div>

          {/* How It Works with enhanced design */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
            <div className="relative z-10">
              <h3 className="font-bold text-white mb-6 text-lg flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-400" />
                <span>How It Works</span>
              </h3>
              <div className="space-y-5">
                <div className="flex items-start space-x-4 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-white text-sm font-black">1</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">Create Campaign</p>
                    <p className="text-gray-400 text-xs">Share your eco-friendly initiative</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-white text-sm font-black">2</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">Get Approved</p>
                    <p className="text-gray-400 text-xs">Our team reviews and approves</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-white text-sm font-black">3</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">Engage Community</p>
                    <p className="text-gray-400 text-xs">Make an impact together</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 px-6 py-3 z-40 shadow-2xl">
        <div className="flex justify-around items-center">
          <Link to="/" className="p-3 rounded-xl hover:bg-gray-100 transition-colors">
            <Home className="h-6 w-6 text-gray-700" />
          </Link>
          <button onClick={() => setFilters({...filters, type: ''})} className="p-3 rounded-xl hover:bg-gray-100 transition-colors">
            <Compass className="h-6 w-6 text-gray-700" />
          </button>
          {user && (
            <Link to="/create-campaign" className="p-2">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                <Plus className="h-7 w-7 text-white" />
              </div>
            </Link>
          )}
          <button className="p-3 rounded-xl hover:bg-gray-100 transition-colors">
            <Heart className="h-6 w-6 text-gray-700" />
          </button>
          {user && (
            <Avatar className="h-9 w-9 border-2 border-green-500 shadow-md">
              <AvatarImage src={user.avatar} alt={user.firstName || user.name} />
              <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white text-sm font-bold">
                {(user.firstName || user.name)?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="md:hidden h-20"></div>
      <Footer />
    </div>
    </>
  );
};

export default Campaigns;