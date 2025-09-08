import React, { useState } from 'react';
import { Heart, MessageCircle, Share, Copy, ExternalLink, Calendar, User, Eye, ThumbsUp, Send, Bookmark, MoreHorizontal, Check, Verified, Trash } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from 'react-hot-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import axios from 'axios';

const AwarenessCampaign = ({ campaign, onLike, onComment, currentUser }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const canDelete = currentUser && (currentUser.role === 'admin' || campaign.createdBy?._id === currentUser.id);

  const handleDeleteCampaign = async () => {
    if (!canDelete) return;
    if (!window.confirm('Delete this campaign? This cannot be undone.')) return;
    try {
      await axios.delete(`/api/campaigns/${campaign._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Campaign deleted');
      window.location.href = '/campaigns';
    } catch (e) {
      toast.error('Failed to delete campaign');
    }
  };

  const isLiked = campaign.likes?.some(like => like._id === currentUser?.id);
  const likesCount = campaign.likes?.length || 0;
  const commentsCount = campaign.comments?.length || 0;

  const handleLike = async () => {
    if (!currentUser) {
      toast.error('Please login to like campaigns');
      return;
    }
    try {
      await onLike(campaign._id);
    } catch (error) {
      toast.error('Failed to like campaign');
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please login to comment');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await onComment(campaign._id, newComment.trim());
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async (platform) => {
    const url = `${window.location.origin}/campaigns/${campaign._id}`;
    const text = `Check out this campaign: ${campaign.title}`;

    if (!platform && navigator.share) {
      try {
        await navigator.share({ title: 'GreenCampaigns', text, url });
        setShowShareMenu(false);
        return;
      } catch (_) {}
    }

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          toast.success('Link copied to clipboard');
        } catch (e) {
          // fallback open new tab
          window.open(url, '_blank');
        }
        break;
      default:
        try {
          await navigator.clipboard.writeText(url);
          toast.success('Link copied to clipboard');
        } catch (e) {
          window.open(url, '_blank');
        }
        break;
    }
    setShowShareMenu(false);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden border-0">
      {/* Header with uploader info */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 ring-2 ring-green-100">
              <AvatarImage 
                src={campaign.createdBy?.avatar} 
                alt={campaign.createdBy?.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white font-semibold">
                {(campaign.createdBy?.name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 text-base">
                  {campaign.createdBy?.firstName ? `${campaign.createdBy.firstName}${campaign.createdBy.lastName ? ' ' + campaign.createdBy.lastName : ''}` : (campaign.createdBy?.name || 'User')}
                </h3>
                {campaign.createdBy?.isVerified && (
                  <Verified className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(campaign.createdAt)}</span>
                <span>•</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  Awareness
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded hover:bg-gray-100">
                <MoreHorizontal className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {canDelete && (
                <DropdownMenuItem onClick={handleDeleteCampaign} className="text-red-600">
                  <Trash className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Campaign Title and Description */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">{campaign.title}</h2>
          {campaign.description && (
            <p className="text-gray-700 leading-relaxed">{campaign.description}</p>
          )}
        </div>
      </CardHeader>

      {/* Campaign Image */}
      {campaign.image && (
        <div className="relative">
          <img
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-80 object-cover"
          />
          <div className="absolute top-4 right-4">
            <Button size="sm" variant="secondary" className="bg-white/90 backdrop-blur-sm">
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <CardContent className="pt-4">
        {/* Engagement Actions */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-all duration-200 hover:scale-105 ${
                isLiked 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{likesCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-all duration-200 hover:scale-105"
            >
              <MessageCircle className="h-6 w-6" />
              <span className="font-medium">{commentsCount}</span>
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-all duration-200 hover:scale-105"
              >
                <Send className="h-6 w-6" />
                <span className="font-medium">Share</span>
              </Button>

              {showShareMenu && (
                <div className="absolute top-full mt-2 right-0 bg-white border rounded-xl shadow-xl p-2 z-10 min-w-[180px] border-gray-200">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    📘 Facebook
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    🐦 Twitter
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    💼 LinkedIn
                  </button>
                  <Separator className="my-1" />
                  <button
                    onClick={() => handleShare('copy')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy Link</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-600 transition-colors">
            <Bookmark className="h-5 w-5" />
          </Button>
        </div>

        <Separator className="my-3" />

        {/* Engagement Summary */}
        {(likesCount > 0 || commentsCount > 0) && (
          <div className="mb-4">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              {likesCount > 0 && (
                <>
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{likesCount} {likesCount === 1 ? 'person likes' : 'people like'} this</span>
                </>
              )}
              {likesCount > 0 && commentsCount > 0 && <span>•</span>}
              {commentsCount > 0 && (
                <span className="font-medium">{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</span>
              )}
            </div>
          </div>
        )}

        {showComments && (
          <div className="mt-4 space-y-4">
            {/* Comment form */}
            {currentUser && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                    <AvatarFallback className="bg-green-100 text-green-700 text-sm">
                      {(currentUser.name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <form onSubmit={handleSubmitComment} className="flex-1 space-y-3">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a thoughtful comment..."
                      className="min-h-[80px] bg-white border-gray-200 focus:border-green-300 focus:ring-green-100"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {newComment.length}/500 characters
                      </span>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!newComment.trim() || isSubmittingComment || newComment.length > 500}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Comments list */}
            <div className="space-y-4">
              {campaign.comments?.map((comment, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.user?.avatar} alt={comment.user?.firstName || comment.user?.name} />
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                      {(comment.user?.firstName || comment.user?.name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900 text-sm">
                          {comment.user?.firstName ? `${comment.user.firstName}${comment.user.lastName ? ' ' + comment.user.lastName : ''}` : (comment.user?.name || 'User')}
                        </span>
                        {comment.user?.isVerified && (
                          <Check className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              ))}
              
              {commentsCount === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No comments yet</p>
                  <p className="text-gray-400 text-sm">Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AwarenessCampaign;
