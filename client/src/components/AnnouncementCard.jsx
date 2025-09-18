import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Megaphone, 
  Settings, 
  Info, 
  AlertTriangle, 
  Calendar, 
  Clock,
  Eye,
  Target,
  Shield
} from 'lucide-react';

const AnnouncementCard = ({ announcement, currentUser, onMarkedAsRead }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'maintenance': return <Settings className="h-4 w-4" />;
      case 'feature': return <Info className="h-4 w-4" />;
      case 'policy': return <AlertTriangle className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      default: return <Megaphone className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAudienceLabel = (audience) => {
    switch (audience) {
      case 'all': return 'All Users';
      case 'users': return 'Regular Users';
      case 'sellers': return 'All Sellers';
      case 'verified_sellers': return 'Verified Sellers';
      default: return audience;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const userId = currentUser?._id || currentUser?.id;
  const hasViewed = Array.isArray(announcement.viewedBy)
    ? announcement.viewedBy.some(v => String(v.user || v._id || v) === String(userId))
    : false;

  const handleMarkAsRead = async () => {
    if (!userId) return; // only logged-in users can mark as read
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/announcements/${announcement._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('admin_token')}`
        }
      });
      // optimistically update UI
      if (typeof onMarkedAsRead === 'function') {
        onMarkedAsRead(announcement._id, userId);
      }
      return res;
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date();

  return (
    <Card className={`w-full max-w-3xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden border-0 ${
      isExpired ? 'opacity-75' : ''
    }`}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 p-1 shadow-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900 text-base">
                  Official Announcement
                </span>
                {isExpired && (
                  <Badge className="bg-gray-100 text-gray-600 text-xs">
                    Expired
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatDate(announcement.publishedAt || announcement.createdAt)}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  {getTypeIcon(announcement.type)}
                  <span className="capitalize">{announcement.type}</span>
                </div>
                <Badge className={`text-xs ${getPriorityColor(announcement.priority)}`}>
                  {announcement.priority}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Announcement Content */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">
            {announcement.title}
          </h2>
          <div className="text-gray-700 leading-relaxed">
            <p>{announcement.content}</p>
          </div>
        </div>
      </CardHeader>

      {/* Media */}
      {announcement.media && announcement.media.length > 0 && (
        <div className="px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {announcement.media.slice(0, 4).map((mediaUrl, index) => (
              <img
                key={index}
                src={mediaUrl}
                alt={`Announcement media ${index + 1}`}
                className="w-full h-40 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      <CardContent className="pt-4">
        {/* Metadata */}
        <div className="flex items-center justify-between py-3 text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4" />
              <span>{getAudienceLabel(announcement.targetAudience)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{announcement.views || 0} views</span>
            </div>
            {announcement.expiresAt && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Expires: {formatDate(announcement.expiresAt)}</span>
              </div>
            )}
          </div>
          
          {!hasViewed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsRead}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              Mark as Read
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnouncementCard;
